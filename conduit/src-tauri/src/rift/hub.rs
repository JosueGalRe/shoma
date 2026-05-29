use std::{collections::HashMap, future::Future, pin::Pin, sync::Arc};

use crate::protocol::{RiftErrorPayload, RiftFrame, RiftOpcode};
use futures::{SinkExt, StreamExt};
use serde_json::Value;
use thiserror::Error;
use tokio::sync::{mpsc, Mutex};
use tokio_tungstenite::{connect_async, tungstenite::Message};
use url::Url;

pub const DEFAULT_HUB_WS_URL: &str = "ws://localhost:51001/conduit";
const HUB_WS_URL_ENV: &str = "LEYLINE_HUB_WS_URL";

pub fn default_hub_ws_url() -> String {
    hub_ws_url_or_default(std::env::var(HUB_WS_URL_ENV).ok())
}

fn hub_ws_url_or_default(value: Option<String>) -> String {
    value.unwrap_or_else(|| DEFAULT_HUB_WS_URL.to_string())
}

pub trait PeerHandler: Send + Sync {
    fn handle_message(&self, payload: Value) -> Pin<Box<dyn Future<Output = ()> + Send + '_>>;

    fn on_close(&self) {}

    fn identity(&self) -> Option<String> {
        None
    }
}

pub type PeerHandlerFactory = Arc<dyn Fn(&str) -> Arc<dyn PeerHandler> + Send + Sync>;

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum LifecycleEvent {
    Connected,
    Disconnected,
    Error(RiftErrorPayload),
    PeerOpened(String),
    PeerClosed(String),
}

#[derive(Debug, Error)]
pub enum RiftHubError {
    #[error("invalid hub URL: {0}")]
    InvalidUrl(#[from] url::ParseError),
    #[error("websocket error: {0}")]
    WebSocket(#[from] tokio_tungstenite::tungstenite::Error),
    #[error("invalid frame: {0}")]
    InvalidFrame(&'static str),
    #[error("hub writer is closed")]
    WriterClosed,
}

#[derive(Clone)]
pub struct RiftHubClient {
    peers: Arc<Mutex<HashMap<String, Arc<dyn PeerHandler>>>>,
    outbound: mpsc::UnboundedSender<RiftFrame>,
    peer_factory: PeerHandlerFactory,
    events: Option<mpsc::UnboundedSender<LifecycleEvent>>,
    writer_task: Arc<Mutex<Option<tokio::task::JoinHandle<()>>>>,
    reader_task: Arc<Mutex<Option<tokio::task::JoinHandle<()>>>>,
}

impl RiftHubClient {
    pub async fn connect(
        hub_url: impl AsRef<str>,
        jwt: impl AsRef<str>,
        public_key: impl AsRef<str>,
        peer_factory: PeerHandlerFactory,
        events: Option<mpsc::UnboundedSender<LifecycleEvent>>,
    ) -> Result<Self, RiftHubError> {
        let url = hub_url_with_auth(hub_url.as_ref(), jwt.as_ref(), public_key.as_ref())?;
        let (socket, _) = connect_async(url.as_str()).await?;
        let (mut writer, mut reader) = socket.split();
        let (outbound, mut outbound_rx) = mpsc::unbounded_channel::<RiftFrame>();

        let writer_task = tokio::spawn(async move {
            while let Some(frame) = outbound_rx.recv().await {
                let Ok(payload) = serde_json::to_string(&frame) else {
                    continue;
                };

                if writer.send(Message::Text(payload)).await.is_err() {
                    break;
                }
            }
        });

        let client = Self::from_parts(outbound, peer_factory, events, Some(writer_task));
        client.emit(LifecycleEvent::Connected);

        let peers = Arc::clone(&client.peers);
        let peer_factory = Arc::clone(&client.peer_factory);
        let events = client.events.clone();

        let reader_task = tokio::spawn(async move {
            while let Some(message) = reader.next().await {
                let Ok(Message::Text(text)) = message else {
                    continue;
                };
                let Ok(frame) = serde_json::from_str::<RiftFrame>(&text) else {
                    continue;
                };

                let _ = handle_frame(&peers, &peer_factory, &events, frame).await;
            }

            close_all_peers(&peers).await;
            emit(&events, LifecycleEvent::Disconnected);
        });

        *client.reader_task.lock().await = Some(reader_task);

        Ok(client)
    }

    pub fn reply(&self, peer_id: impl Into<String>, payload: Value) -> Result<(), RiftHubError> {
        let peer_id = peer_id.into();
        tracing::info!(
            peer_id,
            payload_len = payload.to_string().len(),
            "rift hub sending reply"
        );
        let frame = build_reply_frame(peer_id, payload);
        self.outbound
            .send(frame)
            .map_err(|_| RiftHubError::WriterClosed)
    }

    pub fn disconnect_peer(&self, peer_id: impl Into<String>) -> Result<(), RiftHubError> {
        let peer_id = peer_id.into();
        tracing::info!(peer_id, "rift hub sending disconnect peer");
        let frame = build_disconnect_frame(peer_id);
        self.outbound
            .send(frame)
            .map_err(|_| RiftHubError::WriterClosed)
    }

    pub async fn disconnect_peers_by_identity(&self, identity: &str) {
        let peers = self.peers.lock().await;
        for (peer_id, handler) in peers.iter() {
            if handler.identity().as_deref() == Some(identity) {
                let _ = self.disconnect_peer(peer_id);
            }
        }
    }

    pub async fn close(&self) {
        if let Some(task) = self.writer_task.lock().await.take() {
            task.abort();
        }
        if let Some(task) = self.reader_task.lock().await.take() {
            task.abort();
        }
    }

    #[cfg(test)]
    async fn handle_frame(&self, frame: RiftFrame) -> Result<(), RiftHubError> {
        handle_frame(&self.peers, &self.peer_factory, &self.events, frame).await
    }

    fn from_parts(
        outbound: mpsc::UnboundedSender<RiftFrame>,
        peer_factory: PeerHandlerFactory,
        events: Option<mpsc::UnboundedSender<LifecycleEvent>>,
        writer_task: Option<tokio::task::JoinHandle<()>>,
    ) -> Self {
        Self {
            peers: Arc::new(Mutex::new(HashMap::new())),
            outbound,
            peer_factory,
            events,
            writer_task: Arc::new(Mutex::new(writer_task)),
            reader_task: Arc::new(Mutex::new(None)),
        }
    }

    fn emit(&self, event: LifecycleEvent) {
        emit(&self.events, event);
    }
}

pub fn hub_url_with_auth(hub_url: &str, jwt: &str, public_key: &str) -> Result<Url, RiftHubError> {
    let mut url = Url::parse(hub_url)?;
    let path = url.path();
    if !path.ends_with("/conduit") {
        url.set_path(&format!("{}/conduit", path.trim_end_matches('/')));
    }
    url.query_pairs_mut()
        .append_pair("token", jwt)
        .append_pair("publicKey", public_key);
    Ok(url)
}

fn build_reply_frame(peer_id: String, payload: Value) -> RiftFrame {
    RiftFrame::new(RiftOpcode::Reply, vec![Value::from(peer_id), payload])
}

fn build_disconnect_frame(peer_id: String) -> RiftFrame {
    RiftFrame::new(RiftOpcode::DisconnectPeer, vec![Value::from(peer_id)])
}

async fn handle_frame(
    peers: &Arc<Mutex<HashMap<String, Arc<dyn PeerHandler>>>>,
    peer_factory: &PeerHandlerFactory,
    events: &Option<mpsc::UnboundedSender<LifecycleEvent>>,
    frame: RiftFrame,
) -> Result<(), RiftHubError> {
    match frame.opcode {
        RiftOpcode::Open => {
            let peer_id = peer_id_arg(&frame)?;
            let mut peers = peers.lock().await;
            if peers.contains_key(&peer_id) {
                return Ok(());
            }

            peers.insert(peer_id.clone(), peer_factory(&peer_id));
            emit(events, LifecycleEvent::PeerOpened(peer_id));
            Ok(())
        }
        RiftOpcode::Msg => {
            let peer_id = peer_id_arg(&frame)?;
            let payload = frame
                .args
                .get(1)
                .cloned()
                .ok_or(RiftHubError::InvalidFrame("message frame missing payload"))?;
            tracing::info!(
                peer_id,
                payload_len = payload.to_string().len(),
                "rift hub received MSG"
            );
            let handler = peers.lock().await.get(&peer_id).cloned();

            if let Some(handler) = handler {
                handler.handle_message(payload).await;
            } else {
                tracing::warn!(peer_id, "rift hub no handler for peer");
            }

            Ok(())
        }
        RiftOpcode::Close => {
            let peer_id = peer_id_arg(&frame)?;
            let handler = peers.lock().await.remove(&peer_id);

            if let Some(handler) = handler {
                handler.on_close();
                emit(events, LifecycleEvent::PeerClosed(peer_id));
            }

            Ok(())
        }
        RiftOpcode::Error => {
            let payload = frame
                .args
                .first()
                .cloned()
                .ok_or(RiftHubError::InvalidFrame("error frame missing payload"))?;
            let payload = serde_json::from_value::<RiftErrorPayload>(payload)
                .map_err(|_| RiftHubError::InvalidFrame("error frame payload is invalid"))?;
            emit(events, LifecycleEvent::Error(payload));
            Ok(())
        }
        _ => Ok(()),
    }
}

fn peer_id_arg(frame: &RiftFrame) -> Result<String, RiftHubError> {
    frame
        .args
        .first()
        .and_then(Value::as_str)
        .map(ToOwned::to_owned)
        .ok_or(RiftHubError::InvalidFrame("frame missing peer id"))
}

async fn close_all_peers(peers: &Arc<Mutex<HashMap<String, Arc<dyn PeerHandler>>>>) {
    let peers = std::mem::take(&mut *peers.lock().await);
    for handler in peers.into_values() {
        handler.on_close();
    }
}

fn emit(events: &Option<mpsc::UnboundedSender<LifecycleEvent>>, event: LifecycleEvent) {
    if let Some(events) = events {
        let _ = events.send(event);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::sync::{Arc as StdArc, Mutex as StdMutex};

    #[derive(Default)]
    struct RecordingPeerHandler {
        messages: StdArc<StdMutex<Vec<Value>>>,
        closes: StdArc<StdMutex<usize>>,
    }

    impl PeerHandler for RecordingPeerHandler {
        fn handle_message(&self, payload: Value) -> Pin<Box<dyn Future<Output = ()> + Send + '_>> {
            self.messages.lock().unwrap().push(payload);
            Box::pin(async {})
        }

        fn on_close(&self) {
            *self.closes.lock().unwrap() += 1;
        }
    }

    #[tokio::test]
    async fn handles_open_message_and_close_frames() {
        let messages = StdArc::new(StdMutex::new(Vec::new()));
        let closes = StdArc::new(StdMutex::new(0));
        let (events_tx, mut events_rx) = mpsc::unbounded_channel();
        let (_outbound_tx, _outbound_rx) = mpsc::unbounded_channel();
        let factory_messages = StdArc::clone(&messages);
        let factory_closes = StdArc::clone(&closes);
        let client = RiftHubClient::from_parts(
            _outbound_tx,
            Arc::new(move |_| {
                Arc::new(RecordingPeerHandler {
                    messages: StdArc::clone(&factory_messages),
                    closes: StdArc::clone(&factory_closes),
                })
            }),
            Some(events_tx),
            None,
        );

        client
            .handle_frame(RiftFrame::new(RiftOpcode::Open, vec![json!("peer-1")]))
            .await
            .unwrap();
        client
            .handle_frame(RiftFrame::new(
                RiftOpcode::Msg,
                vec![json!("peer-1"), json!({ "hello": "rift" })],
            ))
            .await
            .unwrap();
        client
            .handle_frame(RiftFrame::new(RiftOpcode::Close, vec![json!("peer-1")]))
            .await
            .unwrap();

        assert_eq!(*messages.lock().unwrap(), vec![json!({ "hello": "rift" })]);
        assert_eq!(*closes.lock().unwrap(), 1);
        assert_eq!(
            events_rx.recv().await,
            Some(LifecycleEvent::PeerOpened("peer-1".into()))
        );
        assert_eq!(
            events_rx.recv().await,
            Some(LifecycleEvent::PeerClosed("peer-1".into()))
        );
    }

    #[tokio::test]
    async fn ignores_message_and_close_for_unknown_peer() {
        let (outbound_tx, _outbound_rx) = mpsc::unbounded_channel();
        let (events_tx, mut events_rx) = mpsc::unbounded_channel();
        let client = RiftHubClient::from_parts(
            outbound_tx,
            Arc::new(|_| Arc::new(RecordingPeerHandler::default())),
            Some(events_tx),
            None,
        );

        client
            .handle_frame(RiftFrame::new(
                RiftOpcode::Msg,
                vec![json!("missing"), json!("payload")],
            ))
            .await
            .unwrap();
        client
            .handle_frame(RiftFrame::new(RiftOpcode::Close, vec![json!("missing")]))
            .await
            .unwrap();

        assert!(events_rx.try_recv().is_err());
    }

    #[tokio::test]
    async fn forwards_error_frame_to_lifecycle_events() {
        let (outbound_tx, _outbound_rx) = mpsc::unbounded_channel();
        let (events_tx, mut events_rx) = mpsc::unbounded_channel();
        let client = RiftHubClient::from_parts(
            outbound_tx,
            Arc::new(|_| Arc::new(RecordingPeerHandler::default())),
            Some(events_tx),
            None,
        );

        client
            .handle_frame(RiftFrame::new(
                RiftOpcode::Error,
                vec![json!({ "code": "relay_unreachable", "message": "hub unavailable" })],
            ))
            .await
            .unwrap();

        assert_eq!(
            events_rx.recv().await,
            Some(LifecycleEvent::Error(RiftErrorPayload {
                code: "relay_unreachable".to_string(),
                message: Some("hub unavailable".to_string()),
            }))
        );
    }

    #[test]
    fn formats_reply_messages_as_rift_reply_frames() {
        let (outbound_tx, mut outbound_rx) = mpsc::unbounded_channel();
        let client = RiftHubClient::from_parts(
            outbound_tx,
            Arc::new(|_| Arc::new(RecordingPeerHandler::default())),
            None,
            None,
        );

        client.reply("peer-1", json!({ "ok": true })).unwrap();

        let frame = outbound_rx.try_recv().unwrap();
        assert_eq!(frame.opcode, RiftOpcode::Reply);
        assert_eq!(frame.args, vec![json!("peer-1"), json!({ "ok": true })]);
        assert_eq!(
            serde_json::to_value(frame).unwrap(),
            json!([7, "peer-1", { "ok": true }])
        );
    }

    #[test]
    fn adds_token_and_public_key_to_hub_url() {
        let url = hub_url_with_auth(DEFAULT_HUB_WS_URL, "jwt token", "abc+/=").unwrap();

        assert_eq!(url.scheme(), "ws");
        assert_eq!(
            url.query_pairs().find(|(key, _)| key == "token").unwrap().1,
            "jwt token"
        );
        assert_eq!(
            url.query_pairs()
                .find(|(key, _)| key == "publicKey")
                .unwrap()
                .1,
            "abc+/="
        );
    }

    #[test]
    fn hub_ws_url_uses_env_value_when_present() {
        assert_eq!(
            hub_ws_url_or_default(Some("ws://172.25.208.230:51001/conduit".to_string())),
            "ws://172.25.208.230:51001/conduit"
        );
    }

    #[test]
    fn hub_ws_url_defaults_to_localhost() {
        assert_eq!(hub_ws_url_or_default(None), DEFAULT_HUB_WS_URL);
    }

    #[test]
    fn parses_open_message_and_close_frames_with_protocol_types() {
        let open: RiftFrame = serde_json::from_value(json!([1, "peer-1"])).unwrap();
        let message: RiftFrame =
            serde_json::from_value(json!([2, "peer-1", { "body": 1 }])).unwrap();
        let close: RiftFrame = serde_json::from_value(json!([3, "peer-1"])).unwrap();

        assert_eq!(
            open,
            RiftFrame::new(RiftOpcode::Open, vec![json!("peer-1")])
        );
        assert_eq!(
            message,
            RiftFrame::new(RiftOpcode::Msg, vec![json!("peer-1"), json!({ "body": 1 })])
        );
        assert_eq!(
            close,
            RiftFrame::new(RiftOpcode::Close, vec![json!("peer-1")])
        );
    }
}
