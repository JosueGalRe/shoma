use crate::protocol::{RiftFrame, RiftOpcode};
use futures::{SinkExt, StreamExt};
use serde_json::Value;
use std::{collections::HashMap, sync::Arc};
use thiserror::Error;
use tokio::sync::{mpsc, Mutex};
use tokio_tungstenite::{connect_async, tungstenite::Message};
use url::Url;

pub const DEFAULT_HUB_WS_URL: &str = "ws://localhost:51001/conduit";

pub trait PeerHandler: Send + Sync {
    fn handle_message(&self, payload: Value);

    fn on_close(&self) {}
}

pub type PeerHandlerFactory = Arc<dyn Fn(&str) -> Arc<dyn PeerHandler> + Send + Sync>;

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum LifecycleEvent {
    Connected,
    Disconnected,
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

        tokio::spawn(async move {
            while let Some(frame) = outbound_rx.recv().await {
                let Ok(payload) = serde_json::to_string(&frame) else {
                    continue;
                };

                if writer.send(Message::Text(payload)).await.is_err() {
                    break;
                }
            }
        });

        let client = Self::from_parts(outbound, peer_factory, events);
        client.emit(LifecycleEvent::Connected);

        let peers = Arc::clone(&client.peers);
        let peer_factory = Arc::clone(&client.peer_factory);
        let events = client.events.clone();

        tokio::spawn(async move {
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

        Ok(client)
    }

    pub fn reply(&self, peer_id: impl Into<String>, payload: Value) -> Result<(), RiftHubError> {
        let frame = build_reply_frame(peer_id.into(), payload);
        self.outbound
            .send(frame)
            .map_err(|_| RiftHubError::WriterClosed)
    }

    #[cfg(test)]
    async fn handle_frame(&self, frame: RiftFrame) -> Result<(), RiftHubError> {
        handle_frame(&self.peers, &self.peer_factory, &self.events, frame).await
    }

    fn from_parts(
        outbound: mpsc::UnboundedSender<RiftFrame>,
        peer_factory: PeerHandlerFactory,
        events: Option<mpsc::UnboundedSender<LifecycleEvent>>,
    ) -> Self {
        Self {
            peers: Arc::new(Mutex::new(HashMap::new())),
            outbound,
            peer_factory,
            events,
        }
    }

    fn emit(&self, event: LifecycleEvent) {
        emit(&self.events, event);
    }
}

pub fn hub_url_with_auth(hub_url: &str, jwt: &str, public_key: &str) -> Result<Url, RiftHubError> {
    let mut url = Url::parse(hub_url)?;
    url.query_pairs_mut()
        .append_pair("token", jwt)
        .append_pair("publicKey", public_key);
    Ok(url)
}

fn build_reply_frame(peer_id: String, payload: Value) -> RiftFrame {
    RiftFrame::new(RiftOpcode::Reply, vec![Value::from(peer_id), payload])
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
            let handler = peers.lock().await.get(&peer_id).cloned();

            if let Some(handler) = handler {
                handler.handle_message(payload);
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
        fn handle_message(&self, payload: Value) {
            self.messages.lock().unwrap().push(payload);
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

    #[test]
    fn formats_reply_messages_as_rift_reply_frames() {
        let (outbound_tx, mut outbound_rx) = mpsc::unbounded_channel();
        let client = RiftHubClient::from_parts(
            outbound_tx,
            Arc::new(|_| Arc::new(RecordingPeerHandler::default())),
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
