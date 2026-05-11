use base64::{engine::general_purpose, Engine as _};
use futures::{SinkExt, StreamExt};
use serde_json::Value;
use thiserror::Error;
use tokio::{sync::broadcast, task::JoinHandle};
use tokio_tungstenite::{
    connect_async_tls_with_config,
    tungstenite::{
        client::IntoClientRequest,
        http::{
            header::{AUTHORIZATION, SEC_WEBSOCKET_PROTOCOL},
            HeaderValue,
        },
        Error as WebSocketError, Message,
    },
    Connector,
};
use url::Url;

use super::lockfile::LockfileInfo;

const SUBSCRIBE_FRAME: &str = r#"[5,"OnJsonApiEvent"]"#;
const EVENT_OPCODE: u64 = 8;
const EVENT_TOPIC: &str = "OnJsonApiEvent";

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum LcuEventType {
    Create,
    Update,
    Delete,
    Other(String),
}

#[derive(Clone, Debug, PartialEq)]
pub struct LcuEvent {
    pub path: String,
    pub event_type: LcuEventType,
    pub data: Option<Value>,
}

#[derive(Debug, Error)]
pub enum LcuWebSocketError {
    #[error("invalid LCU websocket url: {0}")]
    InvalidUrl(#[from] url::ParseError),
    #[error("failed to build websocket request: {0}")]
    Request(#[from] WebSocketError),
    #[error("failed to build authorization header: {0}")]
    AuthorizationHeader(#[from] tokio_tungstenite::tungstenite::http::header::InvalidHeaderValue),
    #[error("failed to build TLS connector: {0}")]
    Tls(#[from] native_tls::Error),
    #[error("failed to connect to LCU websocket: {0}")]
    Connect(WebSocketError),
    #[error("failed to subscribe to LCU websocket events: {0}")]
    Subscribe(WebSocketError),
}

pub struct LcuWebSocketClient {
    events: broadcast::Sender<LcuEvent>,
    reader_task: JoinHandle<()>,
}

impl LcuWebSocketClient {
    pub async fn connect(lockfile: &LockfileInfo) -> Result<Self, LcuWebSocketError> {
        let url = websocket_url(lockfile.port)?;
        let mut request = url.as_str().into_client_request()?;
        let credentials = general_purpose::STANDARD.encode(format!("riot:{}", lockfile.password));

        request.headers_mut().insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Basic {credentials}"))?,
        );
        request
            .headers_mut()
            .insert(SEC_WEBSOCKET_PROTOCOL, HeaderValue::from_static("wamp"));

        let tls_connector = native_tls::TlsConnector::builder()
            .danger_accept_invalid_certs(true)
            .danger_accept_invalid_hostnames(true)
            .build()?;
        let connector = Connector::NativeTls(tls_connector);
        let (mut websocket, _) =
            connect_async_tls_with_config(request, None, false, Some(connector))
                .await
                .map_err(LcuWebSocketError::Connect)?;

        websocket
            .send(Message::Text(subscribe_frame().to_string()))
            .await
            .map_err(LcuWebSocketError::Subscribe)?;

        let (events, _) = broadcast::channel(128);
        let reader_events = events.clone();
        let reader_task = tokio::spawn(async move {
            while let Some(message) = websocket.next().await {
                match message {
                    Ok(Message::Text(payload)) => {
                        if let Some(event) = parse_lcu_event(&payload) {
                            let _ = reader_events.send(event);
                        }
                    }
                    Ok(Message::Close(_)) => break,
                    Ok(_) => {}
                    Err(_) => break,
                }
            }
        });

        Ok(Self {
            events,
            reader_task,
        })
    }

    pub fn subscribe(&self) -> broadcast::Receiver<LcuEvent> {
        self.events.subscribe()
    }

    pub fn observe<F>(&self, path: impl Into<String>, mut callback: F) -> JoinHandle<()>
    where
        F: FnMut(LcuEvent) + Send + 'static,
    {
        let path = path.into();
        let mut events = self.subscribe();

        tokio::spawn(async move {
            loop {
                match events.recv().await {
                    Ok(event) if event.path == path => callback(event),
                    Ok(_) => {}
                    Err(broadcast::error::RecvError::Lagged(_)) => continue,
                    Err(broadcast::error::RecvError::Closed) => break,
                }
            }
        })
    }
}

impl Drop for LcuWebSocketClient {
    fn drop(&mut self) {
        self.reader_task.abort();
    }
}

fn websocket_url(port: u16) -> Result<Url, url::ParseError> {
    Url::parse(&format!("wss://127.0.0.1:{port}/"))
}

fn subscribe_frame() -> &'static str {
    SUBSCRIBE_FRAME
}

fn parse_lcu_event(payload: &str) -> Option<LcuEvent> {
    let payload = serde_json::from_str::<Value>(payload).ok()?;
    let frame = payload.as_array()?;

    if frame.len() != 3 {
        return None;
    }

    if frame.first()?.as_u64()? != EVENT_OPCODE || frame.get(1)?.as_str()? != EVENT_TOPIC {
        return None;
    }

    let event = frame.get(2)?.as_object()?;
    let path = event.get("uri")?.as_str()?.to_string();
    let event_type = parse_event_type(event.get("eventType")?.as_str()?);
    let data = match event_type {
        LcuEventType::Delete => None,
        _ => event.get("data").cloned(),
    };

    Some(LcuEvent {
        path,
        event_type,
        data,
    })
}

fn parse_event_type(event_type: &str) -> LcuEventType {
    match event_type {
        "Create" => LcuEventType::Create,
        "Update" => LcuEventType::Update,
        "Delete" => LcuEventType::Delete,
        other => LcuEventType::Other(other.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn formats_subscribe_frame() {
        assert_eq!(subscribe_frame(), r#"[5,"OnJsonApiEvent"]"#);
    }

    #[test]
    fn parses_create_event() {
        let event = parse_lcu_event(
            r#"[8,"OnJsonApiEvent",{"uri":"/lol-chat/v1/me","eventType":"Create","data":{"status":"online"}}]"#,
        )
        .unwrap();

        assert_eq!(event.path, "/lol-chat/v1/me");
        assert_eq!(event.event_type, LcuEventType::Create);
        assert_eq!(event.data, Some(json!({ "status": "online" })));
    }

    #[test]
    fn parses_update_event() {
        let event = parse_lcu_event(
            r#"[8,"OnJsonApiEvent",{"uri":"/lol-gameflow/v1/gameflow-phase","eventType":"Update","data":"Lobby"}]"#,
        )
        .unwrap();

        assert_eq!(event.path, "/lol-gameflow/v1/gameflow-phase");
        assert_eq!(event.event_type, LcuEventType::Update);
        assert_eq!(event.data, Some(json!("Lobby")));
    }

    #[test]
    fn parses_delete_event_without_data() {
        let event = parse_lcu_event(
            r#"[8,"OnJsonApiEvent",{"uri":"/lol-lobby/v2/lobby","eventType":"Delete","data":{"ignored":true}}]"#,
        )
        .unwrap();

        assert_eq!(event.path, "/lol-lobby/v2/lobby");
        assert_eq!(event.event_type, LcuEventType::Delete);
        assert_eq!(event.data, None);
    }

    #[test]
    fn ignores_invalid_payloads() {
        let invalid_payloads = [
            "not json",
            r#"{}"#,
            r#"[8,"OnJsonApiEvent"]"#,
            r#"[5,"OnJsonApiEvent",{}]"#,
            r#"[8,"OtherTopic",{}]"#,
            r#"[8,"OnJsonApiEvent",{"uri":5,"eventType":"Update","data":null}]"#,
            r#"[8,"OnJsonApiEvent",{"uri":"/path","data":null}]"#,
        ];

        for payload in invalid_payloads {
            assert_eq!(parse_lcu_event(payload), None);
        }
    }
}
