use std::{collections::HashMap, sync::Arc, time::Duration};

use tokio::sync::oneshot;

use reqwest::Client;
use rsa::RsaPrivateKey;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, Manager};
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
    live_client::http::LiveClientHttpClient,
    mobile::session::{MobileHttpClient, MobileSession},
    persistence,
    protocol::RiftErrorPayload,
    rift::hub::{default_hub_ws_url, LifecycleEvent, PeerHandlerFactory, RiftHubClient},
};

const DEFAULT_HUB_HTTP_URL: &str = "http://localhost:51001";
const HUB_HTTP_URL_ENV: &str = "LEYLINE_HUB_HTTP_URL";
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
    pending_approvals: Mutex<HashMap<String, oneshot::Sender<bool>>>,
}

#[derive(Default)]
struct ConnectionState {
    current_lockfile: Option<LockfileInfo>,
    lcu_http: Option<Arc<LcuHttpClient>>,
    live_client: Option<Arc<LiveClientHttpClient>>,
    lcu_websocket: Option<LcuWebSocketClient>,
    rift_hub: Option<RiftHubClient>,
    rift_events_task: Option<JoinHandle<()>>,
    reconnect_task: Option<JoinHandle<()>>,
    reconnect_cancel: Option<watch::Sender<bool>>,
    is_new_launch: bool,
    has_tried_immediate_reconnect: bool,
    conduit: ConduitState,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct ConduitState {
    pub relay: RelayState,
    pub lcu: LcuState,
    pub error: Option<ConduitErrorCode>,
}

impl Default for ConduitState {
    fn default() -> Self {
        Self {
            relay: RelayState::Waiting,
            lcu: LcuState::Waiting,
            error: None,
        }
    }
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum RelayState {
    Waiting,
    Connecting,
    Connected,
    Paired,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum LcuState {
    Waiting,
    Connecting,
    Connected,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ConduitErrorCode {
    LcuUnavailable,
    RelayUnreachable,
    RegistrationFailed,
    ServerError,
}

#[derive(Serialize)]
pub struct ConnectionSnapshot {
    state: ConduitState,
    code: Option<String>,
    url: String,
}

#[derive(Debug, Error)]
pub enum ConnectionManagerError {
    #[error("failed to create LCU HTTP client: {0}")]
    LcuHttp(String),
    #[error("failed to create Live Client HTTP client: {0}")]
    LiveClientHttp(#[from] crate::live_client::http::LiveClientHttpError),
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
                pending_approvals: Mutex::new(HashMap::new()),
            }),
        }
    }

    pub fn spawn(self) -> tauri::async_runtime::JoinHandle<()> {
        tauri::async_runtime::spawn(async move { self.run().await })
    }

    pub async fn connection_snapshot(&self) -> ConnectionSnapshot {
        let state = {
            let state = self.inner.state.lock().await;
            state.status()
        };
        let code = persistence::get_hub_code().unwrap_or(None);
        let url = self.inner.hub_http_url.clone();

        ConnectionSnapshot { state, code, url }
    }

    pub async fn ensure_registered_access_code(&self) -> Result<()> {
        self.emit_access_code_generating();
        let private_key = tokio::task::spawn_blocking(|| persistence::get_or_generate_rsa_keys())
            .await
            .map_err(|e| {
                persistence::PersistenceError::Io(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    format!("RSA key generation task failed: {e}"),
                ))
            })??;
        let public_key = tokio::task::spawn_blocking({
            let pk = private_key.clone();
            move || export_public_key(&pk)
        })
        .await
        .map_err(|e| {
            persistence::PersistenceError::Io(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("public key export task failed: {e}"),
            ))
        })??;
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
                    self.set_error_from_manager_error(&error).await;
                    self.close_and_reconnect().await;
                }
            }
            LockfileEvent::Changed(lockfile) => {
                tracing::info!("League client lockfile changed, reconnecting...");
                if let Err(error) = self.connect_for_lockfile(lockfile).await {
                    tracing::error!("failed to connect after lockfile event: {error}");
                    self.set_error_from_manager_error(&error).await;
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

        {
            let mut state = self.inner.state.lock().await;
            state.current_lockfile = Some(lockfile.clone());
            state.conduit.lcu = LcuState::Connecting;
            state.conduit.relay = RelayState::Waiting;
            state.conduit.error = None;
        }
        self.emit_connection_state_changed().await;

        let http_client = Arc::new(LcuHttpClient::new(lockfile.clone())?);
        let live_client = Arc::new(LiveClientHttpClient::new()?);
        let websocket_client = Self::connect_websocket_with_retry(&lockfile).await?;

        {
            let mut state = self.inner.state.lock().await;
            state.current_lockfile = Some(lockfile);
            state.lcu_http = Some(http_client.clone());
            state.live_client = Some(live_client.clone());
            state.lcu_websocket = Some(websocket_client);
            state.conduit.lcu = LcuState::Connected;
            state.conduit.relay = RelayState::Connecting;
            state.conduit.error = None;
        }
        self.emit_connection_state_changed().await;

        self.connect_to_rift(http_client, live_client).await
    }

    async fn connect_websocket_with_retry(lockfile: &LockfileInfo) -> Result<LcuWebSocketClient> {
        let mut last_error = None;
        let mut delay = Duration::from_millis(500);

        for attempt in 1..=5 {
            match LcuWebSocketClient::connect(lockfile).await {
                Ok(client) => {
                    if attempt > 1 {
                        tracing::info!(
                            port = lockfile.port,
                            attempt,
                            "LCU WebSocket connected after retry"
                        );
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

    async fn connect_to_rift(
        &self,
        http_client: Arc<LcuHttpClient>,
        live_client: Arc<LiveClientHttpClient>,
    ) -> Result<()> {
        let private_key = tokio::task::spawn_blocking(|| persistence::get_or_generate_rsa_keys())
            .await
            .map_err(|e| {
                persistence::PersistenceError::Io(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    format!("RSA key generation task failed: {e}"),
                ))
            })??;
        let public_key = tokio::task::spawn_blocking({
            let pk = private_key.clone();
            move || export_public_key(&pk)
        })
        .await
        .map_err(|e| {
            persistence::PersistenceError::Io(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("public key export task failed: {e}"),
            ))
        })??;
        let jwt = self.valid_or_registered_jwt(&public_key).await?;
        self.emit_access_code_changed();
        let (events_tx, events_rx) = mpsc::unbounded_channel();
        let (reply_tx, mut reply_rx) = mpsc::unbounded_channel::<(String, Value)>();
        let peer_factory = self.peer_factory(private_key, http_client, live_client, reply_tx);

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
                tracing::info!(
                    peer_id,
                    payload_len = payload.to_string().len(),
                    "manager forwarding reply to hub"
                );
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
        state.conduit.relay = RelayState::Connected;
        state.conduit.lcu = LcuState::Connected;
        state.conduit.error = None;

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
        live_client: Arc<LiveClientHttpClient>,
        reply_tx: mpsc::UnboundedSender<(String, Value)>,
    ) -> PeerHandlerFactory {
        let manager = self.clone();
        Arc::new(move |peer_id| {
            let peer_id = peer_id.to_string();
            let reply_tx = reply_tx.clone();
            let send = Arc::new(move |payload: Value| {
                tracing::info!(
                    peer_id,
                    payload_len = payload.to_string().len(),
                    "peer_factory send called"
                );
                if let Err(e) = reply_tx.send((peer_id.clone(), payload)) {
                    tracing::error!(error = %e, "peer_factory failed to send reply");
                }
            });

            let approval_manager = manager.clone();
            let approval = move |device: &str, browser: &str| {
                let approval_manager = approval_manager.clone();
                let device = device.to_string();
                let browser = browser.to_string();
                Box::pin(async move {
                    approval_manager.request_device_approval(&device, &browser).await
                }) as std::pin::Pin<Box<dyn std::future::Future<Output = bool> + Send>>
            };

            let live_client: Arc<dyn MobileHttpClient> = live_client.clone();
            let session = Arc::new(MobileSession::with_approval_callback(
                private_key.clone(),
                http_client.clone(),
                Some(live_client),
                send,
                approval,
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
        if let Some(jwt) = persistence::get_hub_token(&self.inner.hub_http_url)? {
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
        persistence::set_hub_token(&self.inner.hub_http_url, &jwt)?;
        tracing::info!("new Rift access code registered");
        Ok(jwt)
    }

    async fn handle_rift_events(&self, mut events_rx: mpsc::UnboundedReceiver<LifecycleEvent>) {
        while let Some(event) = events_rx.recv().await {
            match event {
                LifecycleEvent::Disconnected => {
                    tracing::warn!("disconnected from Rift hub");
                    self.set_relay_error(ConduitErrorCode::RelayUnreachable)
                        .await;
                    self.close_and_reconnect_from_lifecycle().await;
                    break;
                }
                LifecycleEvent::Error(payload) => {
                    tracing::warn!(code = payload.code, "Rift hub reported an error");
                    self.handle_rift_error(payload).await;
                }
                LifecycleEvent::PeerOpened(peer_id) => {
                    tracing::info!(peer_id, "mobile device connected");
                    {
                        let mut state = self.inner.state.lock().await;
                        state.conduit.relay = RelayState::Paired;
                    }
                    self.emit_connection_state_changed().await;
                }
                LifecycleEvent::PeerClosed(peer_id) => {
                    tracing::info!(peer_id, "mobile device disconnected");
                    {
                        let mut state = self.inner.state.lock().await;
                        if state.rift_hub.is_some() {
                            state.conduit.relay = RelayState::Connected;
                        }
                    }
                    self.emit_connection_state_changed().await;
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
        state.conduit = ConduitState::default();
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
            hub.close().await;
        }
        state.lcu_websocket = None;
        state.lcu_http = None;
        state.live_client = None;
        state.conduit.relay = RelayState::Waiting;
        state.conduit.lcu = if state.current_lockfile.is_some() {
            LcuState::Connecting
        } else {
            LcuState::Waiting
        };

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
            state.status()
        };
        let _ = self
            .inner
            .app
            .emit("connection-state-changed", json!({ "state": state }));
    }

    async fn set_error_from_manager_error(&self, error: &ConnectionManagerError) {
        let error = manager_error_code(error);
        self.set_error(error).await;
    }

    async fn set_relay_error(&self, error: ConduitErrorCode) {
        {
            let mut state = self.inner.state.lock().await;
            state.conduit.relay = RelayState::Waiting;
            state.conduit.error = Some(error);
        }
        self.emit_connection_state_changed().await;
    }

    async fn handle_rift_error(&self, payload: RiftErrorPayload) {
        let error = match payload.code.as_str() {
            "lcu_unavailable" => ConduitErrorCode::LcuUnavailable,
            "registration_failed" => ConduitErrorCode::RegistrationFailed,
            "server_error" => ConduitErrorCode::ServerError,
            _ => ConduitErrorCode::RelayUnreachable,
        };

        self.set_error(error).await;
    }

    async fn set_error(&self, error: ConduitErrorCode) {
        {
            let mut state = self.inner.state.lock().await;
            state.conduit.error = Some(error);
            match error {
                ConduitErrorCode::LcuUnavailable => state.conduit.lcu = LcuState::Waiting,
                ConduitErrorCode::RelayUnreachable
                | ConduitErrorCode::RegistrationFailed
                | ConduitErrorCode::ServerError => state.conduit.relay = RelayState::Waiting,
            }
        }
        self.emit_connection_state_changed().await;
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

    pub async fn request_device_approval(&self, device: &str, browser: &str) -> bool {
        let approval_id = uuid::Uuid::new_v4().to_string();
        let (tx, rx) = oneshot::channel();

        {
            let mut pending = self.inner.pending_approvals.lock().await;
            pending.insert(approval_id.clone(), tx);
        }

        if let Some(window) = self.inner.app.get_webview_window("main") {
            if let Err(error) = window.show() {
                tracing::warn!(%error, "failed to show main window for device approval");
            }
            if let Err(error) = window.set_focus() {
                tracing::warn!(%error, "failed to focus main window for device approval");
            }
        }

        let _ = self
            .inner
            .app
            .notification()
            .builder()
            .title("Sho'ma - Device Connection")
            .body(format!("Device '{device}' ({browser}) wants to connect."))
            .show();

        let _ = self.inner.app.emit(
            "device-approval-requested",
            json!({
                "approvalId": approval_id,
                "device": device,
                "browser": browser,
            }),
        );

        match tokio::time::timeout(Duration::from_secs(60), rx).await {
            Ok(Ok(approved)) => approved,
            Ok(Err(_)) => {
                tracing::warn!("device approval channel closed unexpectedly");
                false
            }
            Err(_) => {
                tracing::warn!("device approval timed out after 60s");
                {
                    let mut pending = self.inner.pending_approvals.lock().await;
                    pending.remove(&approval_id);
                }
                false
            }
        }
    }

    pub async fn resolve_device_approval(&self, approval_id: &str, approved: bool) {
        let sender = {
            let mut pending = self.inner.pending_approvals.lock().await;
            pending.remove(approval_id)
        };

        if let Some(tx) = sender {
            let _ = tx.send(approved);
            tracing::info!(approval_id, approved, "device approval resolved");
        } else {
            tracing::warn!(approval_id, "no pending approval found for resolution");
        }
    }

    pub async fn disconnect_device(&self, identity: &str) {
        let hub = {
            let state = self.inner.state.lock().await;
            state.rift_hub.clone()
        };

        if let Some(hub) = hub {
            hub.disconnect_peers_by_identity(identity).await;
            tracing::info!(identity, "disconnected peers for revoked device");
        } else {
            tracing::warn!(identity, "no active hub to disconnect revoked device");
        }
    }
}

impl ConnectionState {
    fn status(&self) -> ConduitState {
        self.conduit.clone()
    }
}

pub fn manager_error_code(error: &ConnectionManagerError) -> ConduitErrorCode {
    match error {
        ConnectionManagerError::LcuHttp(_)
        | ConnectionManagerError::LiveClientHttp(_)
        | ConnectionManagerError::LcuWebSocket(_) => ConduitErrorCode::LcuUnavailable,
        ConnectionManagerError::RiftHub(_) | ConnectionManagerError::RiftHttp(_) => {
            ConduitErrorCode::RelayUnreachable
        }
        ConnectionManagerError::InvalidRegisterResponse => ConduitErrorCode::RegistrationFailed,
        ConnectionManagerError::Persistence(_) | ConnectionManagerError::Crypto(_) => {
            ConduitErrorCode::ServerError
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

    let response: RegisterResponse =
        serde_json::from_str(&text).map_err(|_| ConnectionManagerError::InvalidRegisterResponse)?;

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
        .title("Sho'ma Conduit")
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
