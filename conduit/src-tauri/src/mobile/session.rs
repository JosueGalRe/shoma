use std::{
    collections::HashMap,
    future::Future,
    pin::Pin,
    sync::{Arc, Mutex},
};

use base64::{engine::general_purpose::STANDARD, Engine as _};
use regex::Regex;
use reqwest::Method;
use rsa::RsaPrivateKey;
use serde::Deserialize;
use serde_json::{json, Value};
use thiserror::Error;

use crate::{
    crypto::{decrypt_aes, decrypt_rsa, encrypt_aes},
    lcu::{
        http::{LcuHttpClient, LcuHttpError},
        websocket::{LcuEvent, LcuEventType},
    },
    persistence,
    protocol::{MobileFrame, MobileOpcode},
    rift::hub::PeerHandler,
};

pub type SendMobileMessage = Arc<dyn Fn(Value) + Send + Sync>;
pub type DeviceApprovalCallback = Arc<dyn Fn(&str, &str) -> bool + Send + Sync>;
pub type MobileHttpFuture<'a> =
    Pin<Box<dyn Future<Output = Result<MobileHttpResponse>> + Send + 'a>>;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MobileHttpResponse {
    pub status_code: u16,
    pub body: Value,
}

pub trait MobileHttpClient: Send + Sync {
    fn request<'a>(
        &'a self,
        method: &'a str,
        path: &'a str,
        body: Option<Value>,
    ) -> MobileHttpFuture<'a>;
}

#[derive(Debug, Error)]
pub enum MobileSessionError {
    #[error("invalid mobile frame")]
    InvalidFrame,
    #[error("invalid mobile payload")]
    InvalidPayload,
    #[error("invalid regex subscription: {0}")]
    InvalidRegex(#[from] regex::Error),
    #[error("LCU request failed: {0}")]
    Lcu(#[from] LcuHttpError),
    #[error("failed to persist device approval: {0}")]
    Persistence(#[from] persistence::PersistenceError),
}

pub type Result<T> = std::result::Result<T, MobileSessionError>;

pub struct MobileSession {
    rsa_private_key: RsaPrivateKey,
    http_client: Arc<dyn MobileHttpClient>,
    send: SendMobileMessage,
    is_device_approved: Arc<dyn Fn(&str) -> bool + Send + Sync>,
    approval_callback: DeviceApprovalCallback,
    aes_key: Arc<Mutex<Option<Vec<u8>>>>,
    observed_paths: Arc<Mutex<HashMap<String, Regex>>>,
}

#[derive(Deserialize)]
struct SecretPayload {
    secret: String,
    identity: String,
    device: String,
    browser: String,
}

impl MobileSession {
    pub fn new(
        rsa_private_key: RsaPrivateKey,
        http_client: LcuHttpClient,
        send: SendMobileMessage,
    ) -> Self {
        Self::with_http_client(rsa_private_key, Arc::new(http_client), send)
    }

    pub fn with_http_client(
        rsa_private_key: RsaPrivateKey,
        http_client: Arc<dyn MobileHttpClient>,
        send: SendMobileMessage,
    ) -> Self {
        Self::with_approval_callback(rsa_private_key, http_client, send, |_, _| false)
    }

    pub fn with_approval_callback(
        rsa_private_key: RsaPrivateKey,
        http_client: Arc<dyn MobileHttpClient>,
        send: SendMobileMessage,
        approval_callback: impl Fn(&str, &str) -> bool + Send + Sync + 'static,
    ) -> Self {
        Self::with_approval_checker(rsa_private_key, http_client, send, |identity| {
            persistence::is_device_approved(identity)
        })
        .with_device_approval_callback(Arc::new(approval_callback))
    }

    pub fn with_approval_checker(
        rsa_private_key: RsaPrivateKey,
        http_client: Arc<dyn MobileHttpClient>,
        send: SendMobileMessage,
        is_device_approved: impl Fn(&str) -> bool + Send + Sync + 'static,
    ) -> Self {
        Self {
            rsa_private_key,
            http_client,
            send,
            is_device_approved: Arc::new(is_device_approved),
            approval_callback: Arc::new(|_, _| false),
            aes_key: Arc::new(Mutex::new(None)),
            observed_paths: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    fn with_device_approval_callback(mut self, approval_callback: DeviceApprovalCallback) -> Self {
        self.approval_callback = approval_callback;
        self
    }

    pub fn handle_mobile_payload(&self, payload: Value) -> Result<()> {
        let frame = self.decode_mobile_frame(payload)?;
        self.handle_mobile_frame(frame)
    }

    pub fn handle_lcu_event(&self, event: LcuEvent) {
        if !self.matches_observed_path(&event.path) {
            return;
        }

        let status = match event.event_type {
            LcuEventType::Create | LcuEventType::Update => 200,
            LcuEventType::Delete => 404,
            LcuEventType::Other(_) => return,
        };
        let data = if status == 404 {
            Value::Null
        } else {
            event.data.unwrap_or(Value::Null)
        };

        self.send_encrypted_frame(MobileFrame::new(
            MobileOpcode::Update,
            vec![json!(event.path), json!(status), data],
        ));
    }

    pub fn is_observing(&self, path: &str) -> bool {
        self.observed_paths.lock().unwrap().contains_key(path)
    }

    fn handle_mobile_frame(&self, frame: MobileFrame) -> Result<()> {
        match frame.opcode {
            MobileOpcode::Secret => self.handle_secret(&frame.args),
            MobileOpcode::Subscribe => self.handle_subscribe(&frame.args),
            MobileOpcode::Unsubscribe => self.handle_unsubscribe(&frame.args),
            MobileOpcode::Request => self.handle_request(&frame.args),
            MobileOpcode::Version => {
                self.send_encrypted_frame(MobileFrame::new(
                    MobileOpcode::VersionResponse,
                    vec![json!("0.1.0"), json!(machine_name())],
                ));
                Ok(())
            }
            _ => Ok(()),
        }
    }

    fn handle_secret(&self, args: &[Value]) -> Result<()> {
        tracing::info!("mobile session handling SECRET");
        let encrypted = args
            .first()
            .and_then(Value::as_str)
            .ok_or(MobileSessionError::InvalidFrame)?;
        let Some(secret_json) = decrypt_rsa(&self.rsa_private_key, encrypted) else {
            tracing::warn!("mobile session failed to decrypt SECRET");
            self.send_raw_frame(MobileFrame::new(
                MobileOpcode::SecretResponse,
                vec![json!(false)],
            ));
            return Ok(());
        };
        let payload: SecretPayload =
            serde_json::from_str(&secret_json).map_err(|_| MobileSessionError::InvalidPayload)?;

        if !(self.is_device_approved)(&payload.identity) {
            tracing::info!(device = %payload.device, browser = %payload.browser, "device approval requested");
            if !(self.approval_callback)(&payload.device, &payload.browser) {
                tracing::info!(device = %payload.device, "device approval denied by user");
                self.send_raw_frame(MobileFrame::new(
                    MobileOpcode::SecretResponse,
                    vec![json!(false)],
                ));
                return Ok(());
            }

            if let Err(error) = persistence::approve_device(&payload.identity) {
                tracing::error!(identity = %payload.identity, "failed to persist device approval: {error}");
                self.send_raw_frame(MobileFrame::new(
                    MobileOpcode::SecretResponse,
                    vec![json!(false)],
                ));
                return Err(error.into());
            }
            tracing::info!(identity = %payload.identity, "device approved and persisted");
        }

        let key = STANDARD
            .decode(payload.secret)
            .map_err(|_| MobileSessionError::InvalidPayload)?;
        tracing::info!("mobile session sending SECRET_RESPONSE true");
        self.send_raw_frame(MobileFrame::new(
            MobileOpcode::SecretResponse,
            vec![json!(true)],
        ));
        tracing::info!("mobile session AES key set");
        *self.aes_key.lock().unwrap() = Some(key);

        Ok(())
    }

    fn handle_subscribe(&self, args: &[Value]) -> Result<()> {
        let path = args
            .first()
            .and_then(Value::as_str)
            .ok_or(MobileSessionError::InvalidFrame)?;
        let regex = Regex::new(path)?;
        self.observed_paths
            .lock()
            .unwrap()
            .entry(path.to_string())
            .or_insert(regex);
        Ok(())
    }

    fn handle_unsubscribe(&self, args: &[Value]) -> Result<()> {
        let path = args
            .first()
            .and_then(Value::as_str)
            .ok_or(MobileSessionError::InvalidFrame)?;
        self.observed_paths.lock().unwrap().remove(path);
        Ok(())
    }

    fn handle_request(&self, args: &[Value]) -> Result<()> {
        let id = args
            .first()
            .cloned()
            .ok_or(MobileSessionError::InvalidFrame)?;
        let path = args
            .get(1)
            .and_then(Value::as_str)
            .ok_or(MobileSessionError::InvalidFrame)?
            .to_string();
        let method = args
            .get(2)
            .and_then(Value::as_str)
            .ok_or(MobileSessionError::InvalidFrame)?
            .to_string();
        let body = args.get(3).cloned();
        let http_client = Arc::clone(&self.http_client);
        let send = Arc::clone(&self.send);
        let aes_key = Arc::clone(&self.aes_key);

        tokio::spawn(async move {
            if let Ok(response) = http_client.request(&method, &path, body).await {
                send_encrypted_frame_with(
                    &send,
                    &aes_key,
                    MobileFrame::new(
                        MobileOpcode::Response,
                        vec![id, json!(response.status_code), response.body],
                    ),
                );
            }
        });

        Ok(())
    }

    fn decode_mobile_frame(&self, payload: Value) -> Result<MobileFrame> {
        let payload = match payload {
            Value::String(encrypted) => {
                let key = self
                    .aes_key
                    .lock()
                    .unwrap()
                    .clone()
                    .ok_or(MobileSessionError::InvalidPayload)?;
                let decrypted = decrypt_aes(&key, &encrypted)
                    .map_err(|_| MobileSessionError::InvalidPayload)?;
                serde_json::from_str(&decrypted).map_err(|_| MobileSessionError::InvalidPayload)?
            }
            other => other,
        };

        serde_json::from_value(payload).map_err(|_| MobileSessionError::InvalidFrame)
    }

    fn matches_observed_path(&self, path: &str) -> bool {
        self.observed_paths
            .lock()
            .unwrap()
            .values()
            .any(|regex| regex.is_match(path))
    }

    fn send_raw_frame(&self, frame: MobileFrame) {
        if let Ok(payload) = serde_json::to_value(&frame) {
            tracing::info!(opcode = ?frame.opcode, payload_len = payload.to_string().len(), "mobile session send_raw_frame");
            (self.send)(payload);
        } else {
            tracing::error!("mobile session failed to serialize frame");
        }
    }

    fn send_encrypted_frame(&self, frame: MobileFrame) {
        send_encrypted_frame_with(&self.send, &self.aes_key, frame);
    }
}

impl PeerHandler for MobileSession {
    fn handle_message(&self, payload: Value) {
        let _ = self.handle_mobile_payload(payload);
    }
}

fn send_encrypted_frame_with(
    send: &SendMobileMessage,
    aes_key: &Mutex<Option<Vec<u8>>>,
    frame: MobileFrame,
) {
    let Ok(payload) = serde_json::to_string(&frame) else {
        return;
    };
    let Some(key) = aes_key.lock().unwrap().clone() else {
        if let Ok(payload) = serde_json::to_value(frame) {
            send(payload);
        }
        return;
    };

    if let Ok(encrypted) = encrypt_aes(&key, &payload) {
        send(Value::String(encrypted));
    }
}

impl MobileHttpClient for LcuHttpClient {
    fn request<'a>(
        &'a self,
        method: &'a str,
        path: &'a str,
        body: Option<Value>,
    ) -> MobileHttpFuture<'a> {
        Box::pin(async move {
            let method = method
                .parse::<Method>()
                .map_err(|_| MobileSessionError::InvalidPayload)?;
            let response = self.request(method, path, body).await?;
            let status_code = response.status().as_u16();
            let text = response.text().await.map_err(LcuHttpError::Request)?;
            let body = parse_response_body(&text);

            Ok(MobileHttpResponse { status_code, body })
        })
    }
}

fn parse_response_body(text: &str) -> Value {
    if text.is_empty() {
        Value::Null
    } else {
        serde_json::from_str(text).unwrap_or_else(|_| Value::String(text.to_string()))
    }
}

fn machine_name() -> String {
    whoami::fallible::hostname().unwrap_or_else(|_| std::env::consts::OS.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rsa::{Oaep, RsaPublicKey};
    use sha1::Sha1;
    use std::fs;

    #[derive(Clone)]
    struct MockHttpClient {
        response: MobileHttpResponse,
        captured: Arc<Mutex<Vec<(String, String, Option<Value>)>>>,
    }

    impl MobileHttpClient for MockHttpClient {
        fn request<'a>(
            &'a self,
            method: &'a str,
            path: &'a str,
            body: Option<Value>,
        ) -> MobileHttpFuture<'a> {
            self.captured
                .lock()
                .unwrap()
                .push((method.to_string(), path.to_string(), body));
            let response = self.response.clone();
            Box::pin(async move { Ok(response) })
        }
    }

    #[test]
    fn secret_handshake_with_approved_device_sets_key_and_accepts() {
        let (session, sent, private_key, aes_key) = session_with_approval(true);
        let secret = encrypted_secret(&private_key, &aes_key, "device-1");

        session
            .handle_mobile_payload(json!([1, secret]))
            .expect("handshake should succeed");

        assert_eq!(sent.lock().unwrap().as_slice(), &[json!([2, true])]);
        assert_eq!(*session.aes_key.lock().unwrap(), Some(aes_key));
    }

    #[test]
    fn secret_handshake_with_rejected_device_fails_without_key() {
        let (session, sent, private_key, aes_key) = session_with_approval(false);
        let secret = encrypted_secret(&private_key, &aes_key, "device-1");

        session
            .handle_mobile_payload(json!([1, secret]))
            .expect("rejected handshake should be handled");

        assert_eq!(sent.lock().unwrap().as_slice(), &[json!([2, false])]);
        assert_eq!(*session.aes_key.lock().unwrap(), None);
    }

    #[test]
    fn secret_handshake_calls_approval_callback_and_persists_approved_device() {
        let _guard = persistence::device_path_test_guard();
        let temp_dir = std::env::temp_dir().join(format!(
            "mimic-session-approval-test-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock should be after epoch")
                .as_nanos()
        ));
        persistence::set_device_path_override(Some(temp_dir.join("Mimic").join("devices")));
        let approvals = Arc::new(Mutex::new(Vec::new()));
        let approvals_clone = Arc::clone(&approvals);
        let (session, sent, private_key, aes_key) = session_with_handlers(
            Arc::new(MockHttpClient {
                response: MobileHttpResponse {
                    status_code: 201,
                    body: json!({"ok": true}),
                },
                captured: Arc::new(Mutex::new(Vec::new())),
            }),
            |_| false,
            move |device, browser| {
                approvals_clone
                    .lock()
                    .unwrap()
                    .push((device.to_string(), browser.to_string()));
                true
            },
        );
        let secret = encrypted_secret(&private_key, &aes_key, "device-approval");

        session
            .handle_mobile_payload(json!([1, secret]))
            .expect("approved handshake should succeed");

        assert_eq!(sent.lock().unwrap().as_slice(), &[json!([2, true])]);
        assert_eq!(
            approvals.lock().unwrap().as_slice(),
            &[("Pixel".to_string(), "Firefox".to_string())]
        );
        assert!(persistence::is_device_approved("device-approval"));

        persistence::set_device_path_override(None);
        fs::remove_dir_all(temp_dir).expect("temporary devices directory should be removed");
    }

    #[tokio::test]
    async fn request_proxying_uses_http_client_and_sends_response() {
        let captured = Arc::new(Mutex::new(Vec::new()));
        let (session, sent, _private_key, aes_key) = session_with_client(
            true,
            Arc::new(MockHttpClient {
                response: MobileHttpResponse {
                    status_code: 201,
                    body: json!({"ok": true}),
                },
                captured: Arc::clone(&captured),
            }),
        );
        *session.aes_key.lock().unwrap() = Some(aes_key.clone());

        session
            .handle_mobile_payload(encrypted(
                &aes_key,
                json!([7, 42, "/lol-test", "POST", {"ready": true}]),
            ))
            .expect("request should be accepted");
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;

        assert_eq!(
            captured.lock().unwrap().as_slice(),
            &[(
                "POST".to_string(),
                "/lol-test".to_string(),
                Some(json!({"ready": true}))
            )]
        );
        let decrypted = decrypt_sent(&sent.lock().unwrap()[0], &aes_key);
        assert_eq!(decrypted, json!([8, 42, 201, {"ok": true}]));
    }

    #[tokio::test]
    async fn request_proxy_regression_encrypts_request_and_response_frames() {
        let captured = Arc::new(Mutex::new(Vec::new()));
        let (session, sent, _private_key, aes_key) = session_with_client(
            true,
            Arc::new(MockHttpClient {
                response: MobileHttpResponse {
                    status_code: 202,
                    body: json!({"data": {"accepted": true}, "errors": []}),
                },
                captured: Arc::clone(&captured),
            }),
        );
        *session.aes_key.lock().unwrap() = Some(aes_key.clone());

        session
            .handle_mobile_payload(encrypted(
                &aes_key,
                json!([
                    MobileOpcode::Request,
                    99,
                    "/lol-regression/v1/action",
                    "PUT",
                    {"items": [1, 2, 3], "nested": {"ready": true}}
                ]),
            ))
            .expect("encrypted request should be accepted");
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;

        assert_eq!(
            captured.lock().unwrap().as_slice(),
            &[(
                "PUT".to_string(),
                "/lol-regression/v1/action".to_string(),
                Some(json!({"items": [1, 2, 3], "nested": {"ready": true}}))
            )]
        );
        let decrypted = decrypt_sent(&sent.lock().unwrap()[0], &aes_key);
        assert_eq!(
            decrypted,
            json!([
                MobileOpcode::Response,
                99,
                202,
                {"data": {"accepted": true}, "errors": []}
            ])
        );
    }

    #[test]
    fn subscribe_and_unsubscribe_track_regex_paths() {
        let (session, _sent, _private_key, aes_key) = session_with_approval(true);
        *session.aes_key.lock().unwrap() = Some(aes_key.clone());

        session
            .handle_mobile_payload(encrypted(&aes_key, json!([5, "^/lol-chat/.*"])))
            .expect("subscribe should succeed");
        assert!(session.is_observing("^/lol-chat/.*"));
        assert!(session.matches_observed_path("/lol-chat/v1/me"));

        session
            .handle_mobile_payload(encrypted(&aes_key, json!([6, "^/lol-chat/.*"])))
            .expect("unsubscribe should succeed");
        assert!(!session.is_observing("^/lol-chat/.*"));
    }

    #[test]
    fn version_response_uses_static_version_and_hostname() {
        let (session, sent, _private_key, aes_key) = session_with_approval(true);
        *session.aes_key.lock().unwrap() = Some(aes_key.clone());

        session
            .handle_mobile_payload(encrypted(&aes_key, json!([3])))
            .expect("version should succeed");

        let decrypted = decrypt_sent(&sent.lock().unwrap()[0], &aes_key);
        assert_eq!(decrypted[0], json!(4));
        assert_eq!(decrypted[1], json!("0.1.0"));
        assert!(decrypted[2].as_str().is_some());
    }

    #[test]
    fn event_filtering_uses_observed_regex_and_status_mapping() {
        let (session, sent, _private_key, aes_key) = session_with_approval(true);
        *session.aes_key.lock().unwrap() = Some(aes_key.clone());

        session
            .handle_mobile_payload(encrypted(&aes_key, json!([5, "^/lol-lobby/.*"])))
            .expect("subscribe should succeed");
        session.handle_lcu_event(LcuEvent {
            path: "/lol-chat/v1/me".to_string(),
            event_type: LcuEventType::Update,
            data: Some(json!({"ignored": true})),
        });
        session.handle_lcu_event(LcuEvent {
            path: "/lol-lobby/v2/lobby".to_string(),
            event_type: LcuEventType::Delete,
            data: Some(json!({"ignored": true})),
        });

        assert_eq!(sent.lock().unwrap().len(), 1);
        let decrypted = decrypt_sent(&sent.lock().unwrap()[0], &aes_key);
        assert_eq!(decrypted, json!([9, "/lol-lobby/v2/lobby", 404, null]));
    }

    #[test]
    fn event_forward_regression() {
        let (session, sent, _private_key, aes_key) = session_with_approval(true);
        *session.aes_key.lock().unwrap() = Some(aes_key.clone());

        session
            .handle_mobile_payload(encrypted(&aes_key, json!([5, "^/lol-lobby/.*"])))
            .expect("subscribe should succeed");
        session.handle_lcu_event(LcuEvent {
            path: "/lol-chat/v1/me".to_string(),
            event_type: LcuEventType::Create,
            data: Some(json!({"ignored": true})),
        });
        assert!(sent.lock().unwrap().is_empty());

        session.handle_lcu_event(LcuEvent {
            path: "/lol-lobby/v2/lobby".to_string(),
            event_type: LcuEventType::Create,
            data: Some(json!({"created": true})),
        });
        session.handle_lcu_event(LcuEvent {
            path: "/lol-lobby/v2/lobby/members".to_string(),
            event_type: LcuEventType::Update,
            data: Some(json!({"updated": true})),
        });
        session.handle_lcu_event(LcuEvent {
            path: "/lol-lobby/v2/lobby".to_string(),
            event_type: LcuEventType::Delete,
            data: Some(json!({"deleted": true})),
        });

        let sent = sent.lock().unwrap();
        assert_eq!(sent.len(), 3);
        assert_eq!(
            decrypt_sent(&sent[0], &aes_key),
            json!([MobileOpcode::Update as u8, "/lol-lobby/v2/lobby", 200, {"created": true}])
        );
        assert_eq!(
            decrypt_sent(&sent[1], &aes_key),
            json!([MobileOpcode::Update as u8, "/lol-lobby/v2/lobby/members", 200, {"updated": true}])
        );
        assert_eq!(
            decrypt_sent(&sent[2], &aes_key),
            json!([MobileOpcode::Update as u8, "/lol-lobby/v2/lobby", 404, null])
        );
    }

    #[test]
    fn encryption_roundtrip_decrypts_incoming_and_encrypts_outgoing() {
        let (session, sent, _private_key, aes_key) = session_with_approval(true);
        *session.aes_key.lock().unwrap() = Some(aes_key.clone());

        session
            .handle_mobile_payload(encrypted(&aes_key, json!([3])))
            .expect("encrypted version should succeed");

        assert!(sent.lock().unwrap()[0].is_string());
        assert_eq!(
            decrypt_sent(&sent.lock().unwrap()[0], &aes_key)[0],
            json!(4)
        );
    }

    fn session_with_approval(
        approved: bool,
    ) -> (
        Arc<MobileSession>,
        Arc<Mutex<Vec<Value>>>,
        RsaPrivateKey,
        Vec<u8>,
    ) {
        session_with_client(
            approved,
            Arc::new(MockHttpClient {
                response: MobileHttpResponse {
                    status_code: 201,
                    body: json!({"ok": true}),
                },
                captured: Arc::new(Mutex::new(Vec::new())),
            }),
        )
    }

    fn session_with_client(
        approved: bool,
        http_client: Arc<dyn MobileHttpClient>,
    ) -> (
        Arc<MobileSession>,
        Arc<Mutex<Vec<Value>>>,
        RsaPrivateKey,
        Vec<u8>,
    ) {
        let mut rng = rand::rngs::OsRng;
        let private_key = RsaPrivateKey::new(&mut rng, 2048).unwrap();
        let sent = Arc::new(Mutex::new(Vec::new()));
        let sent_clone = Arc::clone(&sent);
        let session = Arc::new(MobileSession::with_approval_checker(
            private_key.clone(),
            http_client,
            Arc::new(move |payload| sent_clone.lock().unwrap().push(payload)),
            move |_| approved,
        ));

        (session, sent, private_key, vec![7; 32])
    }

    fn session_with_handlers(
        http_client: Arc<dyn MobileHttpClient>,
        is_device_approved: impl Fn(&str) -> bool + Send + Sync + 'static,
        approval_callback: impl Fn(&str, &str) -> bool + Send + Sync + 'static,
    ) -> (
        Arc<MobileSession>,
        Arc<Mutex<Vec<Value>>>,
        RsaPrivateKey,
        Vec<u8>,
    ) {
        let mut rng = rand::rngs::OsRng;
        let private_key = RsaPrivateKey::new(&mut rng, 2048).unwrap();
        let sent = Arc::new(Mutex::new(Vec::new()));
        let sent_clone = Arc::clone(&sent);
        let session = Arc::new(
            MobileSession::with_approval_checker(
                private_key.clone(),
                http_client,
                Arc::new(move |payload| sent_clone.lock().unwrap().push(payload)),
                is_device_approved,
            )
            .with_device_approval_callback(Arc::new(approval_callback)),
        );

        (session, sent, private_key, vec![7; 32])
    }

    fn encrypted_secret(private_key: &RsaPrivateKey, aes_key: &[u8], identity: &str) -> String {
        let mut rng = rand::rngs::OsRng;
        let public_key = RsaPublicKey::from(private_key);
        let payload = json!({
            "secret": STANDARD.encode(aes_key),
            "identity": identity,
            "device": "Pixel",
            "browser": "Firefox"
        })
        .to_string();
        STANDARD.encode(
            public_key
                .encrypt(&mut rng, Oaep::new::<Sha1>(), payload.as_bytes())
                .unwrap(),
        )
    }

    fn encrypted(key: &[u8], frame: Value) -> Value {
        Value::String(encrypt_aes(key, &frame.to_string()).unwrap())
    }

    fn decrypt_sent(payload: &Value, key: &[u8]) -> Value {
        let encrypted = payload.as_str().expect("payload should be encrypted");
        serde_json::from_str(&decrypt_aes(key, encrypted).unwrap()).unwrap()
    }
}
