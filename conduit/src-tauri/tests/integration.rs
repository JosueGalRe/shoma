use std::{
    future::Future,
    sync::{Arc, Mutex},
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use base64::{engine::general_purpose::STANDARD, Engine as _};
use conduit::{
    crypto::{decrypt_aes, encrypt_aes},
    lcu::{
        http::LcuHttpClient,
        lockfile::{parse_lockfile, LockfileEvent, LockfileInfo},
        websocket::{LcuEvent, LcuEventType},
    },
    manager::{check_jwt_with_client, register_jwt_with_client},
    mobile::session::{MobileHttpClient, MobileHttpFuture, MobileHttpResponse, MobileSession},
    protocol::{RiftFrame, RiftOpcode},
    rift::hub::{PeerHandlerFactory, RiftHubClient},
};
use futures::{SinkExt, StreamExt};
use reqwest::Client;
use rsa::{Oaep, RsaPrivateKey, RsaPublicKey};
use serde_json::{json, Value};
use sha1::Sha1;
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::TcpListener,
    sync::{mpsc, oneshot},
};
use tokio_tungstenite::{accept_async, tungstenite::Message};

#[tokio::test]
async fn lockfile_detection_triggers_lcu_http_client_creation() {
    let path = temp_path("lockfile-detection");
    std::fs::write(&path, "LeagueClient:1234:40123:secret:https\n").unwrap();

    let lockfile = parse_lockfile(&path).unwrap();
    let event = LockfileEvent::Appeared(lockfile.clone());
    let client = match event {
        LockfileEvent::Appeared(info) | LockfileEvent::Changed(info) => {
            LcuHttpClient::with_refresher(info, || Ok(lockfile_info(40123))).unwrap()
        }
        LockfileEvent::Disappeared => panic!("temp lockfile should appear"),
    };

    let request = client.get("/test");
    drop(request);
    std::fs::remove_file(path).unwrap();
}

#[tokio::test]
async fn jwt_validation_uses_mock_rift_http_server_for_true_and_false() {
    let valid_server = MockHttpServer::spawn("true", "text/plain").await;
    let invalid_server = MockHttpServer::spawn("false", "text/plain").await;

    assert!(
        check_jwt_with_client(&Client::new(), &valid_server.url(), "good.jwt")
            .await
            .unwrap()
    );
    assert!(
        !check_jwt_with_client(&Client::new(), &invalid_server.url(), "bad.jwt")
            .await
            .unwrap()
    );

    assert!(valid_server
        .request()
        .await
        .contains("GET /check?token=good.jwt HTTP/1.1"));
    assert!(invalid_server
        .request()
        .await
        .contains("GET /check?token=bad.jwt HTTP/1.1"));
}

#[tokio::test]
async fn jwt_registration_stores_mock_rift_token() {
    let config_dir = temp_dir("jwt-registration-config");
    std::env::set_var("XDG_CONFIG_HOME", &config_dir);
    let server = MockHttpServer::spawn(
        r#"{"ok":true,"token":"mock.jwt.token"}"#,
        "application/json",
    )
    .await;

    let token = register_jwt_with_client(&Client::new(), &server.url(), "public-key")
        .await
        .unwrap();
    conduit::persistence::set_hub_token(&token).unwrap();

    assert_eq!(token, "mock.jwt.token");
    assert_eq!(
        conduit::persistence::get_hub_token().unwrap(),
        Some("mock.jwt.token".to_string())
    );
    let request = server.request().await;
    assert!(request.contains("POST /register HTTP/1.1"));
    assert!(request.contains(r#"{"pubkey":"public-key"}"#));

    std::fs::remove_dir_all(config_dir).unwrap();
}

#[tokio::test]
async fn mobile_handshake_through_rift_hub_responds_for_approved_device() {
    let mut rng = rand::rngs::OsRng;
    let private_key = RsaPrivateKey::new(&mut rng, 2048).unwrap();
    let aes_key = vec![9; 32];
    let secret = encrypted_secret(&private_key, &aes_key, "approved-device");
    let server = MockRiftServer::spawn(vec![
        RiftFrame::new(RiftOpcode::Open, vec![json!("peer-1")]),
        RiftFrame::new(RiftOpcode::Msg, vec![json!("peer-1"), json!([1, secret])]),
    ])
    .await;
    let hub_slot = Arc::new(Mutex::new(None));
    let factory = mobile_session_factory(
        private_key,
        MockMobileHttpClient::ok(json!("unused")),
        true,
        Arc::clone(&hub_slot),
    );

    let hub = RiftHubClient::connect(server.url(), "jwt", "pubkey", factory, None)
        .await
        .unwrap();
    *hub_slot.lock().unwrap() = Some(hub.clone());

    let reply = server.next_reply().await;
    assert_eq!(reply, json!([7, "peer-1", [2, true]]));
}

#[tokio::test]
async fn lcu_request_proxying_returns_mobile_response_through_rift_hub() {
    let mut rng = rand::rngs::OsRng;
    let private_key = RsaPrivateKey::new(&mut rng, 2048).unwrap();
    let aes_key = vec![7; 32];
    let secret = encrypted_secret(&private_key, &aes_key, "approved-device");
    let encrypted_request =
        encrypt_aes(&aes_key, &json!([7, 1, "/test", "GET", null]).to_string()).unwrap();
    let server = MockRiftServer::spawn(vec![
        RiftFrame::new(RiftOpcode::Open, vec![json!("peer-1")]),
        RiftFrame::new(RiftOpcode::Msg, vec![json!("peer-1"), json!([1, secret])]),
        RiftFrame::new(
            RiftOpcode::Msg,
            vec![json!("peer-1"), json!(encrypted_request)],
        ),
    ])
    .await;
    let http = MockMobileHttpClient::ok(json!("body"));
    let captured = Arc::clone(&http.captured);
    let hub_slot = Arc::new(Mutex::new(None));
    let factory = mobile_session_factory(private_key, http, true, Arc::clone(&hub_slot));

    let hub = RiftHubClient::connect(server.url(), "jwt", "pubkey", factory, None)
        .await
        .unwrap();
    *hub_slot.lock().unwrap() = Some(hub.clone());

    assert_eq!(server.next_reply().await, json!([7, "peer-1", [2, true]]));
    let encrypted_reply = server.next_reply().await;
    let payload = encrypted_reply[2].as_str().unwrap();
    let mobile_response: Value =
        serde_json::from_str(&decrypt_aes(&aes_key, payload).unwrap()).unwrap();

    assert_eq!(mobile_response, json!([8, 1, 200, "body"]));
    assert_eq!(
        captured.lock().unwrap().as_slice(),
        &[("GET".to_string(), "/test".to_string(), Some(Value::Null))]
    );
}

#[tokio::test]
async fn lcu_event_forwarding_sends_updates_to_subscribed_mobile_clients() {
    let mut rng = rand::rngs::OsRng;
    let private_key = RsaPrivateKey::new(&mut rng, 2048).unwrap();
    let aes_key = vec![5; 32];
    let secret = encrypted_secret(&private_key, &aes_key, "approved-device");
    let sent = Arc::new(Mutex::new(Vec::new()));
    let sent_clone = Arc::clone(&sent);
    let session = MobileSession::with_approval_checker(
        private_key,
        Arc::new(MockMobileHttpClient::ok(json!(null))),
        Arc::new(move |payload| sent_clone.lock().unwrap().push(payload)),
        |_| true,
    );

    session.handle_mobile_payload(json!([1, secret])).unwrap();
    session
        .handle_mobile_payload(Value::String(
            encrypt_aes(&aes_key, &json!([5, "^/lol-test/.*"]).to_string()).unwrap(),
        ))
        .unwrap();
    session.handle_lcu_event(LcuEvent {
        path: "/lol-test/event".to_string(),
        event_type: LcuEventType::Update,
        data: Some(json!({"value": 1})),
    });

    let messages = sent.lock().unwrap();
    let update: Value =
        serde_json::from_str(&decrypt_aes(&aes_key, messages[1].as_str().unwrap()).unwrap())
            .unwrap();
    assert_eq!(update, json!([9, "/lol-test/event", 200, {"value": 1}]));
}

struct MockHttpServer {
    address: std::net::SocketAddr,
    request_rx: Mutex<Option<oneshot::Receiver<String>>>,
}

impl MockHttpServer {
    async fn spawn(body: &'static str, content_type: &'static str) -> Self {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();
        let (request_tx, request_rx) = oneshot::channel();

        tokio::spawn(async move {
            let (mut socket, _) = listener.accept().await.unwrap();
            let mut buffer = vec![0_u8; 4096];
            let bytes = socket.read(&mut buffer).await.unwrap();
            let request = String::from_utf8_lossy(&buffer[..bytes]).to_string();
            let _ = request_tx.send(request);
            let response = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: {content_type}\r\nContent-Length: {}\r\n\r\n{body}",
                body.len()
            );
            socket.write_all(response.as_bytes()).await.unwrap();
        });

        Self {
            address,
            request_rx: Mutex::new(Some(request_rx)),
        }
    }

    fn url(&self) -> String {
        format!("http://{}", self.address)
    }

    async fn request(&self) -> String {
        let request_rx = self.request_rx.lock().unwrap().take().unwrap();
        request_rx.await.unwrap()
    }
}

struct MockRiftServer {
    address: std::net::SocketAddr,
    replies_rx: Mutex<mpsc::UnboundedReceiver<Value>>,
}

impl MockRiftServer {
    async fn spawn(frames: Vec<RiftFrame>) -> Self {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();
        let (replies_tx, replies_rx) = mpsc::unbounded_channel();

        tokio::spawn(async move {
            let (stream, _) = listener.accept().await.unwrap();
            let mut websocket = accept_async(stream).await.unwrap();
            for frame in frames {
                websocket
                    .send(Message::Text(serde_json::to_string(&frame).unwrap()))
                    .await
                    .unwrap();
            }

            while let Some(message) = websocket.next().await {
                if let Ok(Message::Text(text)) = message {
                    let payload: Value = serde_json::from_str(&text).unwrap();
                    let _ = replies_tx.send(payload);
                }
            }
        });

        Self {
            address,
            replies_rx: Mutex::new(replies_rx),
        }
    }

    fn url(&self) -> String {
        format!("ws://{}", self.address)
    }

    async fn next_reply(&self) -> Value {
        poll_until(|| async { self.replies_rx.lock().unwrap().try_recv().ok() }).await
    }
}

#[derive(Clone)]
struct MockMobileHttpClient {
    response: MobileHttpResponse,
    captured: Arc<Mutex<Vec<(String, String, Option<Value>)>>>,
}

impl MockMobileHttpClient {
    fn ok(body: Value) -> Self {
        Self {
            response: MobileHttpResponse {
                status_code: 200,
                body,
            },
            captured: Arc::new(Mutex::new(Vec::new())),
        }
    }
}

impl MobileHttpClient for MockMobileHttpClient {
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

fn mobile_session_factory(
    private_key: RsaPrivateKey,
    http_client: MockMobileHttpClient,
    approved: bool,
    hub_slot: Arc<Mutex<Option<RiftHubClient>>>,
) -> PeerHandlerFactory {
    Arc::new(move |peer_id| {
        let peer_id = peer_id.to_string();
        let hub_slot = Arc::clone(&hub_slot);
        let send = Arc::new(move |payload: Value| {
            let deadline = std::time::Instant::now() + Duration::from_secs(2);
            loop {
                if let Some(hub) = hub_slot.lock().unwrap().clone() {
                    hub.reply(peer_id.clone(), payload).unwrap();
                    break;
                }
                assert!(
                    std::time::Instant::now() < deadline,
                    "timed out waiting for connected Rift hub"
                );
                std::thread::sleep(Duration::from_millis(1));
            }
        });
        Arc::new(MobileSession::with_approval_checker(
            private_key.clone(),
            Arc::new(http_client.clone()),
            send,
            move |_| approved,
        ))
    })
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

fn lockfile_info(port: u16) -> LockfileInfo {
    LockfileInfo {
        name: "LeagueClient".to_string(),
        pid: 1234,
        port,
        password: "secret".to_string(),
        protocol: "https".to_string(),
    }
}

async fn poll_until<T, F, Fut>(mut f: F) -> T
where
    F: FnMut() -> Fut,
    Fut: Future<Output = Option<T>>,
{
    let deadline = tokio::time::Instant::now() + Duration::from_secs(2);
    loop {
        if let Some(value) = f().await {
            return value;
        }
        assert!(
            tokio::time::Instant::now() < deadline,
            "timed out waiting for async test event"
        );
        tokio::time::sleep(Duration::from_millis(10)).await;
    }
}

fn temp_path(name: &str) -> std::path::PathBuf {
    std::env::temp_dir().join(format!("mimic-{name}-{}", unique_suffix()))
}

fn temp_dir(name: &str) -> std::path::PathBuf {
    let path = temp_path(name);
    std::fs::create_dir_all(&path).unwrap();
    path
}

fn unique_suffix() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos()
}
