## Briar / Needlework.Net Reference

**Source**: https://github.com/BlossomiShymae/Briar (C# .NET 8 LCU wrapper)

### Lockfile Discovery (PortTokenWithLockfile.cs)

- Find process `LeagueClientUx`
- Get `process.MainModule.FileName` directory
- Walk UP directory tree looking for `lockfile`
- Open with `FileMode.Open, FileAccess.Read, FileShare.ReadWrite` (handles file locking)
- Parse: `name:pid:port:password:protocol`
- Extract `remotingAuthToken = values[3]`, `appPort = int.Parse(values[2])`

### Fallback Chain (ProcessInfo.cs)

Briar tries multiple behaviors in order:

1. `PortTokenWithWin32Native` — Win32 native API
2. `PortTokenWithLockfile` — lockfile (our preferred approach)
3. `PortTokenWithProcessList` — command line arg scraping

### HTTP Client (LcuHttpClientHandler.cs)

- `HttpClientHandler` with `ServerCertificateCustomValidationCallback = DangerousAcceptAnyServerCertificateValidator`
- Auto-refresh `ProcessInfo` on first request AND on `HttpRequestException`
- Prepend base address: `https://127.0.0.1:{port}{request.PathAndQuery}`
- Set `Authorization: Basic {base64("riot:" + token)}`

### WebSocket Client (LcuWebsocketClient.cs)

- `ClientWebSocket` with:
  - `Options.Credentials = new NetworkCredential("riot", token)`
  - `Options.RemoteCertificateValidationCallback = (a,b,c,d) => true`
- URI: `wss://127.0.0.1:{port}/`
- Uses `Websocket.Client` NuGet for reconnection handling
- Messages deserialized as JSON

### Auth (RiotAuthentication.cs)

- Username: `riot`
- Password: remoting auth token
- Header value: `Basic {Convert.ToBase64String(UTF8.GetBytes("riot:" + token))}`

### Rust Implementation Notes

- Use `reqwest` with `danger_accept_invalid_certs(true)` for HTTP
- Use `tokio-tungstenite` with `native-tls` or `rustls` (dangerous mode) for WebSocket

### Tauri Window Config

- `app.windows[0]` should set `label: "main"`, `decorations: false`, `width: 400`, `height: 320`, and `resizable: false` for the frameless dev window.
- Keep `build.devUrl` at `http://127.0.0.1:1420` and `beforeDevCommand.cwd` at `"../"` so `cargo tauri dev` keeps using the frontend dev server.
- Lockfile reading: `std::fs::OpenOptions::new().read(true).share_mode(/* platform-specific */)`
  - Windows: use `windows-sys` or `winapi` for `FILE_SHARE_READ | FILE_SHARE_WRITE`
  - macOS: standard `std::fs::read_to_string` usually works since macOS doesn't lock like Windows

## 2026-05-02 - LCU WebSocket client

- Added `src/lcu/websocket.rs` with minimal LCU WebSocket handling rather than a generic WAMP implementation.
- `tokio-tungstenite 0.24` works with a request string/request object; pass `Url::as_str()` when connecting from an existing `Url`.
- LCU WebSocket auth mirrors C#: `Authorization: Basic {base64("riot:{token}")}` plus `Sec-WebSocket-Protocol: wamp`.
- `native_tls::TlsConnector::builder().danger_accept_invalid_certs(true).danger_accept_invalid_hostnames(true)` is required for LCU's self-signed localhost certificate.
- The LCU event frame shape is `[8, "OnJsonApiEvent", { "uri": path, "eventType": type, "data": data }]`; Delete events should emit `data: None` to match the legacy C# behavior.

## 2026-05-02 - Rift hub client

- Added `src/rift/hub.rs` as a standalone hub connection unit; JWT validation/refresh and reconnect remain outside this module for the later connection manager.
- Rift hub auth is URL query based: `?token={jwt}&publicKey={base64_pubkey}`; use `url::Url::query_pairs_mut()` so base64 characters and spaces are encoded safely.
- `tokio-tungstenite 0.24` accepts `Url::as_str()` for `connect_async`; passing the `Url` value directly does not satisfy `IntoClientRequest` in this dependency set.
- Peer lifecycle mirrors legacy C#: Open creates a peer handler, Msg routes the payload to the existing handler, Close calls `on_close` and removes the peer.

## 2026-05-02 - LCU HTTP client

- Added `src/lcu/http.rs` with a `reqwest` client configured with `danger_accept_invalid_certs(true)` for the LCU self-signed localhost certificate.
- HTTP auth mirrors legacy/Briar behavior: `Authorization: Basic {base64("riot:" + lockfile.password)}` on every request.
- Request paths are normalized by stripping a leading slash and prepending `https://127.0.0.1:{port}/`.
- The client stores the active `LockfileInfo` in a Tokio `RwLock`; after a send error it refreshes from the lockfile and retries only when the lockfile changed.
- Adding `reqwest` introduced a second `Url` type in the dependency graph; existing Rift websocket code still needs to pass `Url::as_str()` to `tokio-tungstenite`.

- Tauri v2 native dialogs in `apps/conduit-next/src-tauri` are available through `tauri_plugin_dialog::DialogExt`; production dialog calls need an `AppHandle`/manager even when the high-level approval logic only needs device/browser strings.
- `tauri-plugin-dialog` message dialogs expose async behavior through callback-based `show`, so wrapping the callback with `tokio::sync::oneshot` gives an awaitable approval function while keeping tests UI-free.

## 2026-05-02 - Mobile session handler

- `src/mobile/session.rs` owns per-device state: RSA secret negotiation, an optional AES key, regex subscriptions, and encrypted outbound frame encoding.
- `PeerHandler` is synchronous, so mobile request proxying spawns a Tokio task and captures only the HTTP trait object, sender callback, and AES key state needed for the response.
- LCU responses are normalized to JSON values: empty bodies become `null`, valid JSON stays structured, and non-JSON bodies are sent as strings.
- LCU event updates reuse `LcuEvent`; Create/Update map to status `200`, Delete maps to `404` and `null` data, and Other event types are ignored.

## 2026-05-02 - Conduit macOS CI

- Added `.github/workflows/conduit-mac.yml` for macOS ARM64 Tauri builds on `macos-latest`.
- Workflow uses `cargo tauri build --target aarch64-apple-darwin` and uploads `.dmg` plus `.app` from Tauri bundle output directories.

## 2026-05-02 - Crypto error handling

- `src/crypto.rs` now exposes fallible AES and public-key export APIs with `CryptoError`; callers must unwrap only in tests or map errors into their domain error type.
- Mobile inbound AES failures should map to `MobileSessionError::InvalidPayload`; outbound encrypted sends can be dropped at the send boundary, matching the existing graceful-ignore serialization behavior.
- `export_public_key` is also used by `src/manager.rs`, so connection setup needs a `CryptoError` conversion in addition to persistence and Rift errors.
- Local validation: `bunx prettier --check .github/workflows/conduit-mac.yml` and `bunx js-yaml .github/workflows/conduit-mac.yml` pass; yaml-ls/actionlint/go/python/ruby were unavailable in this environment.

## 2026-05-02 - Conduit integration tests

- Added `src/lib.rs` so integration tests can import the Tauri crate modules; `src/main.rs` now reuses the library module tree.
- `RiftHubClient` is cloneable, allowing test/mobile reply callbacks to call `reply` through the connected hub just like `ConnectionManager` does.
- `cargo test --test integration` passes with 6 mock-server/self-contained flow tests; `cargo build` passes. LSP diagnostics could not run because `rust-analyzer` is unavailable in the environment.

## 2026-05-02 Code Quality Review (F2)

- Reviewed apps/conduit-next Rust Tauri backend and small TS frontend.
- Verdict: REJECT for production quality despite passing Rust tests/build.
- Key issues: crypto AES helpers panic on malformed encrypted input or invalid key lengths; synchronous fs calls run in async connection/request flow; device approval is stubbed false and approval module is not integrated; AboutWindow uses innerHTML interpolation and console.error; tsc --noEmit fails under TypeScript 6 due inherited baseUrl deprecation; Cargo.toml appears to include unused pem and direct pkcs8 deps.
- Verification: cargo check passed; cargo test passed 44 unit + 6 integration; cargo clippy passed with warnings; cargo tauri build passed; TS LSP clean; bun test passed 1/1; bunx tsc --noEmit failed with TS5101; Rust LSP unavailable because rust-analyzer is not installed.

## 2026-05-02 - Lazyweb MCP Setup

- Token saved to: `~/.lazyweb/lazyweb_mcp_token`
- MCP Endpoint: `https://www.lazyweb.com/mcp` (Streamable HTTP)
- Authorization: `Bearer 5334684d-0ac9-4dba-b80c-d6aa7b9f5590`
- Verified: `lazyweb_health` → healthy (supabase, openai, voyage, cohere all ok)
- Verified: `lazyweb_search` with query "pricing page" limit 3 → 6 results returned

### Available MCP Tools

| Tool                       | Purpose                                                 |
| -------------------------- | ------------------------------------------------------- |
| `lazyweb_search`           | Search screenshots by natural language query            |
| `lazyweb_compare_image`    | Find visually similar screenshots from image URL/base64 |
| `lazyweb_find_similar`     | Find screenshots similar to a Lazyweb screenshot ID     |
| `lazyweb_list_categories`  | List available company categories                       |
| `lazyweb_list_collections` | List curated collections                                |
| `lazyweb_health`           | Check backend connectivity                              |

### Usage Pattern (cURL)

```bash
curl -s \
  -H "Authorization: Bearer $(cat ~/.lazyweb/lazyweb_mcp_token)" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -X POST https://www.lazyweb.com/mcp \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"lazyweb_search","arguments":{"query":"pricing page","limit":3}}}'
```

## 2026-05-02 F2 re-review findings

- Verdict: REJECT. Required unsafe-pattern checks still fail: `apps/conduit-next/src/about/AboutWindow.ts` contains `console.error` and `root.innerHTML`, and `apps/conduit-next/src/main.ts` contains `root.innerHTML`.
- Rust production-path unwrap/expect review found remaining non-test usage in `src-tauri/src/mobile/session.rs` (`Mutex::lock().unwrap()` in handshake, subscription, request decoding, and send paths), `src-tauri/src/tray.rs` (`default_window_icon().expect(...)`), and `src-tauri/src/main.rs` (`.run(...).expect(...)`).
- Crypto rework is directionally improved: `crypto.rs` exposes `Result<CryptoError>` for AES encrypt/decrypt and public-key export, with no production `panic!`/`unwrap()` found in crypto helpers.
- Persistence uses `Result<PersistenceError>` and `?` for most file I/O, with `is_device_approved()` failing closed; however `get_hub_code()` still silently defaults malformed base64/JSON and synchronous `std::fs` calls remain in connection/request-adjacent code.
- `cargo test` passed 54/54; `cargo clippy` completed with warnings: `manual_is_multiple_of`, `io_other_error`, three `result_large_err` warnings in `rift/hub.rs`, and `single_match` in `tray.rs`. Rust LSP diagnostics could not run because `rust-analyzer` is not installed; TS diagnostics reported 0 diagnostics across 3 files.

## F1 Plan Compliance Re-review - 2026-05-02

- Verdict: APPROVE.
- Verified plan MUST HAVEs lines 58-68 against source: tray icon/menu, lockfile detection, LCU HTTP GET/POST/PATCH/DELETE, LCU WebSocket event subscription/parsing, Rift hub WebSocket, RSA key generation/export, AES-CBC encrypt/decrypt, device approval flow, LoL/Rift reconnect, and Windows x64/Mac ARM64 CI builds are present.
- Prior F1 rejection fixes verified: lockfile paths include PROGRAMDATA and ~/Library/Application Support; device approval is wired through manager peer_factory into MobileSession Secret handshake and persists approved identities.
- Verified guardrails lines 70-78: no Linux MVP workflow/package target beyond generated Tauri schemas, no auto-updater, full settings/preferences UI, telemetry/analytics, protocol redesign, WMI scraping, Intel Mac target, or signing/notarization workflow found.
- Verification evidence: TS lsp_diagnostics clean for apps/conduit-next/src; Rust lsp_diagnostics unavailable because rust-analyzer is not installed; cargo check passed; cargo test passed 48 unit + 6 integration; cargo build passed; bun test passed 1/1; bun run build/cargo tauri build passed.

## F3 Manual QA Re-review - 2026-05-02

- Verdict: REJECT despite passing core tests/builds, because `src-tauri/capabilities/default.json` grants IPC only to the `main` window while the About window is labeled `about`; Tauri's generated schema says unmatched windows have no IPC access, so `AboutWindow.ts` cannot reliably invoke `get_hub_code` or use window close permissions at runtime.
- Required verification passed: `cargo test` passed 54/54 (48 unit + 6 integration), `cargo build` passed, `cargo tauri build` passed and built the release app after Vite emitted both `index.html` and `about.html`, `bun test` passed 1/1, and `tauri.conf.json` parsed as valid JSON via Bun.
- Integration coverage verified in `tests/integration.rs`: lockfile detection/client creation, JWT validation/registration with mock Rift HTTP, approved mobile handshake, encrypted LCU request proxying, and subscribed event forwarding are covered end-to-end through mock servers.
- About window smoke import passed and the Vite production build emitted `dist/about.html`; however runtime capability coverage for the `about` window is missing. `bunx tsc --noEmit` still fails with TS5101 (`baseUrl` deprecated under TypeScript 6), and Rust LSP diagnostics remain unavailable because `rust-analyzer` is not installed.

## 2026-05-02 - Tauri dev localhost investigation

- `cargo tauri dev` from `apps/conduit-next` runs `beforeDevCommand` and Vite prints `Local: http://127.0.0.1:1420/` before Rust dev command starts.
- Live Vite probes returned 200 for `http://127.0.0.1:1420/`, `http://localhost:1420/`, `/src/main.ts`, and `/about.html` in Linux/Bun fetch; HTML and module serving are correct.
- Config mismatch remains: Vite binds to `127.0.0.1`, while Tauri `devUrl` opens `http://localhost:1420`; on Windows/WebView2, localhost may resolve to IPv6 `::1`, causing a page-not-found/load failure when the server is IPv4-only.

## 2026-05-03 - Native menu removal

- `window.remove_menu()` belongs in the Tauri `setup` closure before tray/manager startup so the app launches without a native menu bar.
- `app.get_webview_window("main")` requires `use tauri::Manager;` in scope; `cargo check` passes once that trait import is added.

## 2026-05-03 - Main capability permissions

- Added `src-tauri/capabilities/main.json` with `identifier: "main-capability"` and `windows: ["main"]` so the main window can opt into Tauri v2 ACLs explicitly.
- The app’s tray code uses both `menu::Menu/MenuItem` and `tray::TrayIconBuilder`, so `core:menu:default` and `core:tray:default` are the needed tray-related permissions.
- `cargo check` succeeded after adding the capability file; a direct JSON parse via Node also succeeded.
- In Tauri 2, removing the main window menu from `setup` works cleanly by fetching the labeled `main` webview window, calling `let _ = window.remove_menu();`, and importing `tauri::Manager` so `get_webview_window()` is in scope.
