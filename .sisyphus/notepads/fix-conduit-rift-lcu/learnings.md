 - Added `@hasagi/types@16.8.1` to `packages/protocol-contract` and refreshed the workspace lockfiles with `bun install`.
 - `tsc --noEmit` in `packages/protocol-contract` required a local `baseUrl: "."` in that package's `tsconfig.json` because the shared root config uses `paths`.
 - Verified `node_modules/@hasagi/types/dist/index.d.ts` exists after install.

## 2026-05-04 - irelia dependency resolution
- Added `irelia` to `apps/conduit-next/src-tauri/Cargo.toml`, but the requested `0.9.x` line failed on Linux because `process_info` constants are not available under the current target.
- `cargo check` succeeded with `irelia = { version = "0.1.2", features = ["ws"] }`, and the lockfile recorded `irelia` plus its older websocket/http transitive dependencies.
- Verification note: `cargo check` passed in `apps/conduit-next/src-tauri`; the repo still emits existing dead-code warnings for `APP_ID` and `APP_NAME`.

## 2026-05-04 - MobileSession event forwarding regression test
- Added `event_forward_regression` in `apps/conduit-next/src-tauri/src/mobile/session.rs` using `session_with_approval`, an AES key, and an active `^/lol-lobby/.*` subscription.
- The test verifies unobserved LCU paths emit no frame and observed Create/Update/Delete events decrypt to exact `[MobileOpcode::Update, path, status, data]` frames with statuses 200/200/404.
- Verification note: `rustfmt --edition 2021 --check src/mobile/session.rs` passed. `cargo test event_forward_regression` is blocked on Linux by transitive `irelia` unresolved process-name constants; `lsp_diagnostics` is blocked because rust-analyzer is not installed.

## MobileSession request proxy regression - 2026-05-04
- Added `request_proxy_regression_encrypts_request_and_response_frames` in `apps/conduit-next/src-tauri/src/mobile/session.rs` using `session_with_client`, `encrypted()`, and `decrypt_sent()` to cover encrypted REQUEST through mock HTTP client to encrypted RESPONSE.
- Local `cargo test request_proxy_regression` on Linux is blocked before crate tests by `irelia` process-name constants being cfg-gated to Windows/macOS. `rust-analyzer` is also unavailable in this environment.

## 2026-05-04 - Irelia websocket adapter
- Added `apps/conduit-next/src-tauri/src/lcu/irelia_websocket.rs` as a standalone `IreliaWebSocketAdapter` that reuses existing `LcuEvent`, `LcuEventType`, and `LcuWebSocketError` shapes while reading `irelia::ws::LCUWebSocket.client_reciver` into a `broadcast::channel(128)` stream.
- The irelia websocket receiver yields parsed `serde_json::Value` frames, so the adapter parser accepts `[8, "OnJsonApiEvent", { "uri", "eventType", "data" }]` directly instead of reparsing text. Delete events still force `data: None`.
- Verification note: `rustfmt --edition 2021 --check src/lcu/irelia_websocket.rs`, `cargo test`, and `cargo build` passed in `apps/conduit-next/src-tauri`; `lsp_diagnostics` remains blocked because `rust-analyzer` is not installed.

## 2026-05-04 - Irelia mobile HTTP adapter
- Added `src/lcu/irelia_http.rs` as a self-contained `IreliaHttpAdapter` around `irelia::rest::LCUClient` implementing `MobileHttpClient`; it maps GET/POST/PATCH/DELETE to irelia JSON methods and converts `Option<Value>` into mobile responses.
- irelia 0.1.2 does not expose HTTP status codes from REST helpers, so successful JSON responses use 200 and empty responses use 204; LCU availability errors map to 503 and other irelia errors to 500.
- Verification: `rustfmt --edition 2021 --check src/lcu/irelia_http.rs` passed; `cargo test` passed 64 unit tests and 6 integration tests. `lsp_diagnostics` remains blocked by missing rust-analyzer.

## 2026-05-04 - Manager Irelia adapter wiring
- `ConnectionManager` can store/pass `IreliaHttpAdapter` behind `Arc` because the adapter itself is not `Clone`, while `MobileSession::with_approval_callback` accepts `Arc<dyn MobileHttpClient>` and coerces from `Arc<IreliaHttpAdapter>`.
- `irelia::rest::LCUClient::new()` auto-discovers LCU but returns `irelia::Error`, which does not implement `Display`/`std::error::Error`; mapping it into the existing `ConnectionManagerError::LcuHttp` variant requires formatting with `Debug`.

## 2026-05-04 - LCU typed events helper
- Added `packages/protocol-contract/src/lcu/typed-events.ts` as a type-only wrapper around `@hasagi/types`, re-exporting `LCUWebSocketEvents` and providing `LcuEventPayload<TEventName>`.
- Added `LcuEventNames` for the common Mimic event set: gameflow phase/session, lobby, champ-select session, current summoner, and chat/me.
- Verification note: `lsp_diagnostics` passed for the new file, but `bunx tsc --noEmit -p tsconfig.json` is currently blocked by pre-existing `src/lcu/typed-endpoints.ts` generic indexing errors unrelated to the new module.

## 2026-05-04 - protocol-contract typed LCU endpoints
- `packages/protocol-contract/src/lcu/typed-endpoints.ts` can safely re-export `@hasagi/types` helpers directly from the package-local install at `packages/protocol-contract/node_modules/@hasagi/types`.
- The generated `LCUEndpoints[Path][Method]` entries need conditional extraction (`extends { response: infer ... }`) for `response`, `body`, and `params`; direct indexed access triggers TS2536 under `tsc --noEmit`.
- Verification note: `bunx tsc --noEmit -p tsconfig.json` and `bun run build` both passed in `packages/protocol-contract`.

## 2026-05-04 - protocol-contract barrel export split
- `src/index.ts` needs `export type` for the typed LCU helpers under `isolatedModules`; only `TypedLcuPaths` and `LcuEventNames` stay as runtime exports.
- The package-local compiler path (`bunx tsc --noEmit -p tsconfig.json`) is the reliable verification route here; the newer global `tsc` reports a deprecated `baseUrl` warning from the shared config.

## 2026-05-04 - web-next typed LCU response inference
- `LcuResponse<Path, Method>` in `@mimic/protocol-contract` keys off lowercase endpoint methods, so web-next helpers need `Extract<Lowercase<METHOD>, keyof LCUEndpoints[Path]>` to stay type-safe.
- Backward-compatible typed overloads work best when the old `useLCURequest<TContent>(path: string, ...)` signature stays first; typed path inference can sit behind it without changing runtime behavior.

## 2026-05-04 - final Irelia + hasagi-types integration verification
- Required verification passed: `cargo test` in `apps/conduit-next/src-tauri` reported 64 unit tests and 6 integration tests passing; `bun test` passed in `apps/rift-next` with 29 tests and `apps/web-next` with 70 tests; `bunx tsc --noEmit -p tsconfig.json` passed in `packages/protocol-contract`.
- `lcu/lockfile.rs` remains production-active through `ConnectionManager` lockfile events and reconnect lifecycle.
- `lcu/http.rs` and `lcu/websocket.rs` are retained rather than removed because production code still references compatibility/shared types (`MobileSession::new`/`MobileHttpClient` impl and `LcuEvent`/`LcuWebSocketError`); `lcu/mod.rs` now documents that runtime connection setup uses the Irelia adapters.
- Created `apps/conduit-next/AGENTS.md` documenting Irelia HTTP/WebSocket adapter usage and the retained legacy module boundaries.

## 2026-05-04 Manual QA
- Targeted MobileSession regressions passed: request_proxy_regression_encrypts_request_and_response_frames and event_forward_regression.
- Targeted WebSocket event flow passed: cargo test irelia_websocket (4/4 including broadcasts_parsed_events) and lcu_event_forwarding_sends_updates_to_subscribed_mobile_clients.
- Targeted reconnect coverage passed: lockfile_detection_triggers_lcu_http_client_creation.
- Full suites passed: conduit-next cargo test (64 unit + 6 integration), rift-next bun test (29), web-next bun test (70), protocol-contract bunx tsc --noEmit.
- QA verdict: APPROVE.

## 2026-05-04 - F3 Real Manual QA
- QA verdict: APPROVE. Required targeted Rust commands passed: request_proxy_regression (1/1), event_forward_regression (1/1), lcu_event_forwarding_sends_updates_to_subscribed_mobile_clients (1/1), lockfile_detection_triggers_lcu_http_client_creation (1/1), lcu_request_proxying_returns_mobile_response_through_rift_hub (1/1), irelia_websocket (4/4), and irelia_http (5/5).
- Full integration coverage passed with cargo test --test integration: 6/6, including HTTP proxy through Rift hub and LCU event forwarding to subscribed mobile clients.
- Manager connection-state coverage passed: reconnect_delay_is_immediate_then_five_seconds and lockfile_events_map_to_connection_actions.
- web-next bun test passed: 68/68 tests across 16 files. conduit-next cargo build passed with existing APP_ID/APP_NAME dead-code warnings only.
- Rust lsp_diagnostics could not run because rust-analyzer is not installed in this environment.
