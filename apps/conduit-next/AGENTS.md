# apps/conduit-next KNOWLEDGE BASE

**Generated:** 2026-05-04

## OVERVIEW
Next-gen desktop bridge for Mimic. It is a Tauri/Rust application that watches the League Client lockfile, connects to the LCU, and tunnels encrypted mobile sessions through `apps/rift-next`.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Connection lifecycle | `src-tauri/src/manager.rs` | Lockfile events create LCU HTTP/WebSocket clients and Rift sessions |
| LCU HTTP client | `src-tauri/src/lcu/http.rs` | Manual reqwest client using lockfile credentials |
| LCU WebSocket client | `src-tauri/src/lcu/websocket.rs` | Manual tungstenite client using lockfile credentials |
| Lockfile watcher | `src-tauri/src/lcu/lockfile.rs` | Drives connect/reconnect lifecycle |
| Mobile protocol session | `src-tauri/src/mobile/session.rs` | Encrypts/decrypts frames and proxies LCU requests |

## CONVENTIONS
- **LCU runtime:** use `LcuHttpClient` and `LcuWebSocketClient` from `lcu/http.rs` and `lcu/websocket.rs` for production LCU traffic. These use lockfile credentials directly.
- **Lockfile watcher:** `lcu/lockfile.rs` is active and drives the connect/reconnect lifecycle.
- **Verification:** run `cargo test` from `apps/conduit-next/src-tauri` after Rust changes.
