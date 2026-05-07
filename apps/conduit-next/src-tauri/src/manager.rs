use std::{sync::Arc, time::Duration};

use reqwest::Client;
use rsa::RsaPrivateKey;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter};
use tauri_plugin_notification::NotificationExt;
use thiserror::Error;
use tokio::{
    sync::{mpsc, watch, Mutex},
    task::JoinHandle,
};

use crate::{
    crypto::{export_public_key, CryptoError},
    lcu::{
        http::LcuHttpClient,
        lockfile::{self, LockfileEvent, LockfileInfo},
        websocket::LcuWebSocketClient,
    },
    mobile::session::MobileSession,
    persistence,
    rift::hub::{default_hub_ws_url, LifecycleEvent, PeerHandlerFactory, RiftHubClient},
};

const DEFAULT_HUB_HTTP_URL: &str = "http://localhost:51001";
const HUB_HTTP_URL_ENV: &str = "RIFT_HUB_HTTP_URL";
const LOCKFILE_POLL_INTERVAL: Duration = Duration::from_secs(2);
const RECONNECT_DELAY: Duration = Duration::from_secs(5);

#[derive(Clone)]
pub struct ConnectionManager {
    inner: Arc<ConnectionManagerInner>,
}

struct ConnectionManagerInner {
    app: AppHandle,
    http_client: Client,
    hub_http_url: String,
    hub_ws_url: String,
    state: Mutex<ConnectionState>,
    events_tx: Mutex<Option<mpsc::UnboundedSender<LockfileEvent>>>,
}

#[derive(Default)]
struct ConnectionState {
    current_lockfile: Option<LockfileInfo>,
    lcu_http: Option<Arc<LcuHttpClient>>,
    lcu_websocket: Option<LcuWebSocketClient>,
    rift_hub: Option<RiftHubClient>,
    rift_events_task: Option<JoinHandle<()>>,
    reconnect_task: Option<JoinHandle<()>>,
    reconnect_cancel: Option<watch::Sender<bool>>,
    is_new_launch: bool,
    has_tried_immediate_reconnect: bool,
}

#[derive(Serialize)]
pub struct ConnectionSnapshot {
    state: String,
    code: Option<String>,
    url: String,
}

#[derive(Debug, Error)]
pub enum ConnectionManagerError {
    #[error("failed to create LCU HTTP client: {0}")]
    LcuHttp(String),
    #[error("failed to connect to LCU websocket: {0}")]
    LcuWebSocket(#[from] crate::lcu::websocket::LcuWebSocketError),
    #[error("failed to access persisted data: {0}")]
    Persistence(#[from] persistence::PersistenceError),
    #[error("cryptographic operation failed: {0}")]
    Crypto(#[from] CryptoError),
    #[error("Rift HTTP request failed: {0}")]
    RiftHttp(#[from] reqwest::Error),
    #[error("Rift register response was missing a valid token")]
    InvalidRegisterResponse,
    #[error("failed to connect to Rift hub: {0}")]
    RiftHub(#[from] crate::rift::hub::RiftHubError),
}

impl From<crate::lcu::http::LcuHttpError> for ConnectionManagerError {
    fn from(error: crate::lcu::http::LcuHttpError) -> Self {
        ConnectionManagerError::LcuHttp(error.to_string())
    }
}

pub type Result<T> = std::result::Result<T, ConnectionManagerError>;

#[derive(Deserialize)]
struct RegisterResponse {
    ok: bool,
    token: Option<String>,
}

impl ConnectionManager {
    pub fn new(app: AppHandle) -> Self {
        Self::with_urls(app, default_hub_http_url(), default_hub_ws_url())
    }

    pub fn with_urls(
        app: AppHandle,
        hub_http_url: impl Into<String>,
        hub_ws_url: impl Into<String>,
    ) -> Self {
        Self {
            inner: Arc::new(ConnectionManagerInner {
                app,
                http_client: Client::new(),
                hub_http_url: hub_http_url.into(),
                hub_ws_url: hub_ws_url.into(),
                state: Mutex::new(ConnectionState {
                    is_new_launch: true,
                    ..ConnectionState::default()
                }),
                events_tx: Mutex::new(None),
            }),
        }
    }

    pub fn spawn(self) -> tauri::async_runtime::JoinHandle<()> {
        tauri::async_runtime::spawn(async move { self.run().await })
    }

    pub async fn connection_snapshot(&self) -> ConnectionSnapshot {
        let state = {
            let state = self.inner.state.lock().await;
            state.status().to_string()
        };
        let code = persistence::get_hub_code().unwrap_or(None);
        let url = self.inner.hub_http_url.clone();

        ConnectionSnapshot { state, code, url }
    }

    pub async fn ensure_registered_access_code(&self) -> Result<()> {
        self.emit_access_code_generating();
        let private_key = tokio::task::spawn_blocking(|| persistence::get_or_generate_rsa_keys())
            .await
            .map_err(|e| persistence::PersistenceError::Io(
                std::io::Error::new(std::io::ErrorKind::Other, format!("RSA key generation task failed: {e}"))
            ))??;
        let public_key = tokio::task::spawn_blocking({
            let pk = private_key.clone();
            move || export_public_key(&pk)
        })
        .await
            .map_err(|e| persistence::PersistenceError::Io(
                std::io::Error::new(std::io::ErrorKind::Other, format!("public key export task failed: {e}"))
            ))??;
        self.valid_or_registered_jwt(&public_key).await?;
        self.emit_access_code_changed();

        Ok(())
    }

    async fn run(self) {
        let (events_tx, mut events_rx) = mpsc::unbounded_channel();
        *self.inner.events_tx.lock().await = Some(events_tx.clone());
        let watcher_tx = events_tx.clone();
        tokio::spawn(async move {
            lockfile::watch_lockfile(LOCKFILE_POLL_INTERVAL, move |event| {
                let _ = watcher_tx.send(event);
            })
            .await;
        });

        while let Some(event) = events_rx.recv().await {
            self.handle_lockfile_event(event).await;
        }
    }

    async fn handle_lockfile_event(&self, event: LockfileEvent) {
        match event {
            LockfileEvent::Appeared(lockfile) => {
                tracing::info!("League client detected, connecting...");
                if let Err(error) = self.connect_for_lockfile(lockfile).await {
                    tracing::error!("failed to connect after lockfile event: {error}");
                    self.close_and_reconnect().await;
                }
            }
            LockfileEvent::Changed(lockfile) => {
                tracing::info!("League client lockfile changed, reconnecting...");
                if let Err(error) = self.connect_for_lockfile(lockfile).await {
                    tracing::error!("failed to connect after lockfile event: {error}");
                    self.close_and_reconnect().await;
                }
            }
            LockfileEvent::Disappeared => {
                tracing::info!("League client closed");
                self.close_without_reconnect().await;
            }
        }
    }

    async fn connect_for_lockfile(&self, lockfile: LockfileInfo) -> Result<()> {
        self.cancel_pending_reconnect().await;
        self.close_active_connections().await;

        let http_client = Arc::new(LcuHttpClient::new(lockfile.clone())?);
        let websocket_client = Self::connect_websocket_with_retry(&lockfile).await?;

        {
            let mut state = self.inner.state.lock().await;
            state.current_lockfile = Some(lockfile);
            state.lcu_http = Some(http_client.clone());
            state.lcu_websocket = Some(websocket_client);
        }
        self.emit_connection_state_changed().await;

        self.connect_to_rift(http_client).await
    }

    async fn connect_websocket_with_retry(lockfile: &LockfileInfo) -> Result<LcuWebSocketClient> {
        let mut last_error = None;
        let mut delay = Duration::from_millis(500);

        for attempt in 1..=5 {
            match LcuWebSocketClient::connect(lockfile).await {
                Ok(client) => {
                    if attempt > 1 {
                        tracing::info!(port = lockfile.port, attempt, "LCU WebSocket connected after retry");
                    }
                    return Ok(client);
                }
                Err(e) => {
                    tracing::warn!(attempt, "LCU WebSocket not ready, retrying in {:?}", delay);
                    last_error = Some(e);
                    tokio::time::sleep(delay).await;
                    delay *= 2;
                }
            }
        }

        Err(last_error.unwrap().into())
    }

    async fn connect_to_rift(&self, http_client: Arc<LcuHttpClient>) -> Result<()> {
        let private_key = tokio::task::spawn_blocking(|| persistence::get_or_generate_rsa_keys())
            .await
            .map_err(|e| persistence::PersistenceError::Io(
                std::io::Error::new(std::io::ErrorKind::Other, format!("RSA key generation task failed: {e}"))
            ))??;
        let public_key = tokio::task::spawn_blocking({
            let pk = private_key.clone();
            move || export_public_key(&pk)
        })
        .await
            .map_err(|e| persistence::PersistenceError::Io(
                std::io::Error::new(std::io::ErrorKind::Other, format!("public key export task failed: {e}"))
            ))??;
        let jwt = self.valid_or_registered_jwt(&public_key).await?;
        self.emit_access_code_changed();
        let (events_tx, events_rx) = mpsc::unbounded_channel();
        let (reply_tx, mut reply_rx) = mpsc::unbounded_channel::<(String, Value)>();
        let peer_factory = self.peer_factory(private_key, http_client, reply_tx);

        let hub = RiftHubClient::connect(
            &self.inner.hub_ws_url,
            &jwt,
            &public_key,
            peer_factory,
            Some(events_tx),
        )
        .await?;
        tracing::info!("connected to Rift hub");

        let hub_for_replies = hub.clone();
        tokio::spawn(async move {
            while let Some((peer_id, payload)) = reply_rx.recv().await {
                tracing::info!(peer_id, payload_len = payload.to_string().len(), "manager forwarding reply to hub");
                if let Err(e) = hub_for_replies.reply(peer_id, payload) {
                    tracing::error!(error = %e, "manager failed to forward reply");
                }
            }
        });

        let events_manager = self.clone();
        let events_task =
            tokio::spawn(async move { events_manager.handle_rift_events(events_rx).await });

        let mut state = self.inner.state.lock().await;
        state.rift_hub = Some(hub);
        state.rift_events_task = Some(events_task);
        state.has_tried_immediate_reconnect = false;

        if state.is_new_launch {
            show_connected_notification(&self.inner.app);
            state.is_new_launch = false;
        }
        drop(state);
        self.emit_connection_state_changed().await;

        Ok(())
    }

    fn peer_factory(
        &self,
        private_key: RsaPrivateKey,
        http_client: Arc<LcuHttpClient>,
        reply_tx: mpsc::UnboundedSender<(String, Value)>,
    ) -> PeerHandlerFactory {
        let manager = self.clone();
        Arc::new(move |peer_id| {
            let peer_id = peer_id.to_string();
            let reply_tx = reply_tx.clone();
            let send = Arc::new(move |payload: Value| {
                tracing::info!(peer_id, payload_len = payload.to_string().len(), "peer_factory send called");
                if let Err(e) = reply_tx.send((peer_id.clone(), payload)) {
                    tracing::error!(error = %e, "peer_factory failed to send reply");
                }
            });

            let app = manager.inner.app.clone();
            let approval = Arc::new(move |device: &str, browser: &str| {
                let (tx, rx) = std::sync::mpsc::channel();
                let app = app.clone();
                let device = device.to_string();
                let browser = browser.to_string();
                tauri::async_runtime::spawn(async move {
                    let result = crate::mobile::approval::request_device_approval(&app, &device, &browser).await;
                    let _ = tx.send(result);
                });
                rx.recv().unwrap_or(false)
            });

            let session = Arc::new(MobileSession::with_approval_callback(
                private_key.clone(),
                http_client.clone(),
                send,
                move |device, browser| approval(device, browser),
            ));
            let events_session = Arc::clone(&session);
            let events_manager = manager.clone();
            tokio::spawn(async move {
                let mut events = {
                    let state = events_manager.inner.state.lock().await;
                    state
                        .lcu_websocket
                        .as_ref()
                        .map(LcuWebSocketClient::subscribe)
                };

                let Some(events) = events.as_mut() else {
                    return;
                };

                loop {
                    match events.recv().await {
                        Ok(event) => events_session.handle_lcu_event(event),
                        Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => continue,
                        Err(tokio::sync::broadcast::error::RecvError::Closed) => break,
                    }
                }
            });

            session
        })
    }

    async fn valid_or_registered_jwt(&self, public_key: &str) -> Result<String> {
        if let Some(jwt) = persistence::get_hub_token()? {
            if check_jwt_with_client(&self.inner.http_client, &self.inner.hub_http_url, &jwt)
                .await?
            {
                tracing::info!("reusing existing Rift access code");
                return Ok(jwt);
            }
            tracing::info!("existing Rift access code invalid, registering new one");
        } else {
            tracing::info!("no existing Rift access code, registering new one");
        }

        let jwt = register_jwt_with_client(
            &self.inner.http_client,
            &self.inner.hub_http_url,
            public_key,
        )
        .await?;
        persistence::set_hub_token(&jwt)?;
        tracing::info!("new Rift access code registered");
        Ok(jwt)
    }

    async fn handle_rift_events(&self, mut events_rx: mpsc::UnboundedReceiver<LifecycleEvent>) {
        while let Some(event) = events_rx.recv().await {
            match event {
                LifecycleEvent::Disconnected => {
                    tracing::warn!("disconnected from Rift hub");
                    self.close_and_reconnect_from_lifecycle().await;
                    break;
                }
                LifecycleEvent::PeerOpened(peer_id) => {
                    tracing::info!(peer_id, "mobile device connected");
                }
                LifecycleEvent::PeerClosed(peer_id) => {
                    tracing::info!(peer_id, "mobile device disconnected");
                }
                _ => {}
            }
        }
    }

    async fn close_and_reconnect(&self) {
        self.close_active_connections_with(true).await;

        let lockfile = {
            let state = self.inner.state.lock().await;
            state.current_lockfile.clone()
        };

        if let Some(lockfile) = lockfile {
            self.schedule_reconnect(lockfile).await;
        }
    }

    async fn close_without_reconnect(&self) {
        self.cancel_pending_reconnect().await;
        self.close_active_connections().await;

        let mut state = self.inner.state.lock().await;
        state.current_lockfile = None;
        state.is_new_launch = true;
        state.has_tried_immediate_reconnect = false;
        drop(state);
        self.emit_connection_state_changed().await;
    }

    async fn close_active_connections(&self) {
        self.close_active_connections_with(true).await;
    }

    async fn close_active_connections_from_lifecycle(&self) {
        self.close_active_connections_with(false).await;
    }

    async fn close_active_connections_with(&self, abort_events_task: bool) {
        let mut state = self.inner.state.lock().await;
        if let Some(hub) = state.rift_hub.take() {
            hub.close();
        }
        state.lcu_websocket = None;
        state.lcu_http = None;

        if abort_events_task {
            if let Some(task) = state.rift_events_task.take() {
                task.abort();
            }
        } else {
            state.rift_events_task = None;
        }
    }

    async fn close_and_reconnect_from_lifecycle(&self) {
        self.close_active_connections_from_lifecycle().await;

        let lockfile = {
            let state = self.inner.state.lock().await;
            state.current_lockfile.clone()
        };

        if let Some(lockfile) = lockfile {
            self.schedule_reconnect(lockfile).await;
        }
    }

    async fn cancel_pending_reconnect(&self) {
        let mut state = self.inner.state.lock().await;
        if let Some(cancel) = state.reconnect_cancel.take() {
            let _ = cancel.send(true);
        }
        if let Some(task) = state.reconnect_task.take() {
            task.abort();
        }
    }

    async fn schedule_reconnect(&self, lockfile: LockfileInfo) {
        self.cancel_pending_reconnect().await;

        let (cancel_tx, mut cancel_rx) = watch::channel(false);
        let delay = {
            let mut state = self.inner.state.lock().await;
            let delay = next_reconnect_delay(state.has_tried_immediate_reconnect);
            state.has_tried_immediate_reconnect = true;
            state.reconnect_cancel = Some(cancel_tx);
            delay
        };

        let manager = self.clone();
        let task = tokio::spawn(async move {
            if !delay.is_zero() {
                tokio::select! {
                    _ = tokio::time::sleep(delay) => {}
                    _ = cancel_rx.changed() => return,
                }
            }

            if let Some(events_tx) = manager.inner.events_tx.lock().await.clone() {
                let _ = events_tx.send(LockfileEvent::Changed(lockfile));
            }
        });

        self.inner.state.lock().await.reconnect_task = Some(task);
    }

    async fn emit_connection_state_changed(&self) {
        let state = {
            let state = self.inner.state.lock().await;
            state.status().to_string()
        };
        let _ = self
            .inner
            .app
            .emit("connection-state-changed", json!({ "state": state }));
    }

    fn emit_access_code_changed(&self) {
        if let Ok(Some(code)) = persistence::get_hub_code() {
            let _ = self
                .inner
                .app
                .emit("access-code-changed", json!({ "code": code }));
        }
    }

    fn emit_access_code_generating(&self) {
        let _ = self
            .inner
            .app
            .emit("access-code-generating", json!({ "generating": true }));
    }
}

impl ConnectionState {
    fn status(&self) -> &'static str {
        if self.rift_hub.is_some() {
            "Connected"
        } else if self.current_lockfile.is_some() {
            "Starting"
        } else {
            "Waiting"
        }
    }
}

pub async fn check_jwt_with_client(client: &Client, hub_http_url: &str, jwt: &str) -> Result<bool> {
    let url = format!("{}/check", trim_trailing_slash(hub_http_url));

    let response = client
        .get(&url)
        .query(&[("token", jwt)])
        .send()
        .await?
        .text()
        .await?;

    Ok(response.trim() == "true")
}

pub async fn register_jwt_with_client(
    client: &Client,
    hub_http_url: &str,
    public_key: &str,
) -> Result<String> {
    let url = format!("{}/register", trim_trailing_slash(hub_http_url));

    let http_response = client
        .post(&url)
        .json(&json!({ "pubkey": public_key }))
        .send()
        .await?;

    let text = http_response.text().await?;

    let response: RegisterResponse = serde_json::from_str(&text)
        .map_err(|_| ConnectionManagerError::InvalidRegisterResponse)?;

    match (response.ok, response.token) {
        (true, Some(token)) if !token.is_empty() => Ok(token),
        _ => Err(ConnectionManagerError::InvalidRegisterResponse),
    }
}

fn next_reconnect_delay(has_tried_immediate_reconnect: bool) -> Duration {
    if has_tried_immediate_reconnect {
        RECONNECT_DELAY
    } else {
        Duration::ZERO
    }
}

#[cfg(test)]
fn lockfile_event_action(event: &LockfileEvent) -> &'static str {
    match event {
        LockfileEvent::Appeared(_) | LockfileEvent::Changed(_) => "connect",
        LockfileEvent::Disappeared => "close",
    }
}

fn trim_trailing_slash(url: &str) -> &str {
    url.trim_end_matches('/')
}

fn default_hub_http_url() -> String {
    hub_http_url_or_default(std::env::var(HUB_HTTP_URL_ENV).ok())
}

fn hub_http_url_or_default(value: Option<String>) -> String {
    value.unwrap_or_else(|| DEFAULT_HUB_HTTP_URL.to_string())
}

fn show_connected_notification(app: &AppHandle) {
    let _ = app
        .notification()
        .builder()
        .title("Mimic Conduit")
        .body("Connected to League. Click here for instructions on how to control your League client from your phone.")
        .show();
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::{
        io::{AsyncReadExt, AsyncWriteExt},
        net::TcpListener,
    };

    #[test]
    fn reconnect_delay_is_immediate_then_five_seconds() {
        assert_eq!(next_reconnect_delay(false), Duration::ZERO);
        assert_eq!(next_reconnect_delay(true), Duration::from_secs(5));
    }

    #[test]
    fn hub_http_url_uses_env_value_when_present() {
        assert_eq!(
            hub_http_url_or_default(Some("http://172.25.208.230:51001".to_string())),
            "http://172.25.208.230:51001"
        );
    }

    #[test]
    fn hub_http_url_defaults_to_localhost() {
        assert_eq!(hub_http_url_or_default(None), DEFAULT_HUB_HTTP_URL);
    }

    #[test]
    fn lockfile_events_map_to_connection_actions() {
        let info = lockfile_info();
        assert_eq!(
            lockfile_event_action(&LockfileEvent::Appeared(info.clone())),
            "connect"
        );
        assert_eq!(
            lockfile_event_action(&LockfileEvent::Changed(info)),
            "connect"
        );
        assert_eq!(lockfile_event_action(&LockfileEvent::Disappeared), "close");
    }

    #[tokio::test]
    async fn jwt_validation_reads_true_response() {
        let server =
            MockHttpServer::spawn("HTTP/1.1 200 OK\r\nContent-Length: 4\r\n\r\ntrue").await;

        let valid = check_jwt_with_client(&Client::new(), &server.url(), "jwt-token")
            .await
            .unwrap();

        assert!(valid);
        assert!(server
            .request()
            .await
            .contains("GET /check?token=jwt-token HTTP/1.1"));
    }

    #[tokio::test]
    async fn jwt_validation_treats_false_response_as_invalid() {
        let server =
            MockHttpServer::spawn("HTTP/1.1 200 OK\r\nContent-Length: 5\r\n\r\nfalse").await;

        let valid = check_jwt_with_client(&Client::new(), &server.url(), "expired")
            .await
            .unwrap();

        assert!(!valid);
        assert!(server
            .request()
            .await
            .contains("GET /check?token=expired HTTP/1.1"));
    }

    #[tokio::test]
    async fn register_jwt_posts_public_key_and_returns_token() {
        let server = MockHttpServer::spawn(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 25\r\n\r\n{\"ok\":true,\"token\":\"jwt\"}",
        )
        .await;

        let token = register_jwt_with_client(&Client::new(), &server.url(), "public-key")
            .await
            .unwrap();

        let request = server.request().await;
        assert_eq!(token, "jwt");
        assert!(request.contains("POST /register HTTP/1.1"));
        assert!(request.contains(r#"{"pubkey":"public-key"}"#));
    }

    fn lockfile_info() -> LockfileInfo {
        LockfileInfo {
            name: "LeagueClient".to_string(),
            pid: 1234,
            port: 2999,
            password: "secret".to_string(),
            protocol: "https".to_string(),
        }
    }

    struct MockHttpServer {
        address: std::net::SocketAddr,
        request_rx: mpsc::UnboundedReceiver<String>,
    }

    impl MockHttpServer {
        async fn spawn(response: &'static str) -> Self {
            let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
            let address = listener.local_addr().unwrap();
            let (request_tx, request_rx) = mpsc::unbounded_channel();

            tokio::spawn(async move {
                let (mut socket, _) = listener.accept().await.unwrap();
                let mut buffer = vec![0_u8; 4096];
                let bytes = socket.read(&mut buffer).await.unwrap();
                let request = String::from_utf8_lossy(&buffer[..bytes]).to_string();
                let _ = request_tx.send(request);
                socket.write_all(response.as_bytes()).await.unwrap();
            });

            Self {
                address,
                request_rx,
            }
        }

        fn url(&self) -> String {
            format!("http://{}", self.address)
        }

        async fn request(mut self) -> String {
            self.request_rx.recv().await.unwrap()
        }
    }
}
