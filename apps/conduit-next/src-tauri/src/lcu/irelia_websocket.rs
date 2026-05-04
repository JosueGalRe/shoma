use irelia::ws::LCUWebSocket;
use serde_json::Value;
use tokio::{sync::broadcast, task::JoinHandle};
use tokio_tungstenite::tungstenite::Error as WebSocketError;

use super::{
    lockfile::LockfileInfo,
    websocket::{LcuEvent, LcuEventType, LcuWebSocketError},
};

const EVENT_TOPIC: &str = "OnJsonApiEvent";
const EVENT_OPCODE: u64 = 8;

pub struct IreliaWebSocketAdapter {
    events: broadcast::Sender<LcuEvent>,
    websocket: LCUWebSocket,
    reader_task: JoinHandle<()>,
}

impl IreliaWebSocketAdapter {
    pub async fn connect(_lockfile: &LockfileInfo) -> Result<Self, LcuWebSocketError> {
        Self::connect_with_irelia().await
    }

    pub async fn connect_with_irelia() -> Result<Self, LcuWebSocketError> {
        let mut websocket = LCUWebSocket::new()
            .await
            .map_err(|_| LcuWebSocketError::Connect(WebSocketError::ConnectionClosed))?;
        websocket.subscribe(EVENT_TOPIC);

        let (events, _) = broadcast::channel(128);
        let reader_events = events.clone();
        let mut receiver = std::mem::replace(
            &mut websocket.client_reciver,
            tokio::sync::mpsc::unbounded_channel().1,
        );
        let reader_task = tokio::spawn(async move {
            while let Some(message) = receiver.recv().await {
                match message {
                    Ok(payload) => {
                        if let Some(event) = parse_lcu_event(&payload) {
                            let _ = reader_events.send(event);
                        }
                    }
                    Err(_) => break,
                }
            }
        });

        Ok(Self {
            events,
            websocket,
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

impl Drop for IreliaWebSocketAdapter {
    fn drop(&mut self) {
        self.websocket.terminate();
        self.reader_task.abort();
    }
}

fn parse_lcu_event(payload: &Value) -> Option<LcuEvent> {
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
    fn parses_irelia_update_event() {
        let event = parse_lcu_event(&json!([
            8,
            "OnJsonApiEvent",
            {
                "uri": "/lol-gameflow/v1/gameflow-phase",
                "eventType": "Update",
                "data": "Lobby"
            }
        ]))
        .expect("valid test event payload");

        assert_eq!(event.path, "/lol-gameflow/v1/gameflow-phase");
        assert_eq!(event.event_type, LcuEventType::Update);
        assert_eq!(event.data, Some(json!("Lobby")));
    }

    #[test]
    fn parses_delete_event_without_data() {
        let event = parse_lcu_event(&json!([
            8,
            "OnJsonApiEvent",
            {
                "uri": "/lol-lobby/v2/lobby",
                "eventType": "Delete",
                "data": { "ignored": true }
            }
        ]))
        .expect("valid test delete payload");

        assert_eq!(event.path, "/lol-lobby/v2/lobby");
        assert_eq!(event.event_type, LcuEventType::Delete);
        assert_eq!(event.data, None);
    }

    #[tokio::test]
    async fn broadcasts_parsed_events() {
        let (events, mut subscriber) = broadcast::channel(128);
        let payload = json!([
            8,
            "OnJsonApiEvent",
            {
                "uri": "/lol-chat/v1/me",
                "eventType": "Create",
                "data": { "status": "online" }
            }
        ]);

        let parsed = parse_lcu_event(&payload).expect("valid broadcast payload");
        events.send(parsed).expect("channel open");

        let event = subscriber.recv().await.expect("event received");
        assert_eq!(event.path, "/lol-chat/v1/me");
        assert_eq!(event.event_type, LcuEventType::Create);
        assert_eq!(event.data, Some(json!({ "status": "online" })));
    }

    #[test]
    fn ignores_invalid_payloads() {
        let invalid_payloads = [
            json!(null),
            json!({}),
            json!([8, "OnJsonApiEvent"]),
            json!([5, "OnJsonApiEvent", {}]),
            json!([8, "OtherTopic", {}]),
            json!([8, "OnJsonApiEvent", { "uri": 5, "eventType": "Update", "data": null }]),
            json!([8, "OnJsonApiEvent", { "uri": "/path", "data": null }]),
        ];

        for payload in invalid_payloads {
            assert_eq!(parse_lcu_event(&payload), None);
        }
    }
}
