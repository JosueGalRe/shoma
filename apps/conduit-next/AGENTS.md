# apps/conduit-next KNOWLEDGE BASE

**Generated:** 2026-05-04

## OVERVIEW
Next-gen desktop bridge for Mimic. It is a Tauri/Rust application that watches the League Client lockfile, connects to the LCU, and tunnels encrypted mobile sessions through `apps/rift-next`.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Connection lifecycle | `src-tauri/src/manager.rs` | Lockfile events create Irelia-backed LCU clients and Rift sessions |
| LCU HTTP adapter | `src-tauri/src/lcu/irelia_http.rs` | Wraps `irelia::rest::LCUClient` for `MobileSession` requests |
| LCU WebSocket adapter | `src-tauri/src/lcu/irelia_websocket.rs` | Wraps `irelia::ws::LCUWebSocket` and emits existing `LcuEvent` values |
| Lockfile watcher | `src-tauri/src/lcu/lockfile.rs` | Still active; drives connect/reconnect lifecycle |
| Mobile protocol session | `src-tauri/src/mobile/session.rs` | Encrypts/decrypts frames and proxies LCU requests |

## CONVENTIONS
- **LCU runtime:** use `IreliaHttpAdapter` and `IreliaWebSocketAdapter` from `src-tauri/src/lcu/` for production LCU traffic.
- **Legacy manual LCU modules:** `lcu/http.rs` and `lcu/websocket.rs` are retained for compatibility, shared event/error types, and unit coverage; do not remove them unless those references are migrated first.
- **Verification:** run `cargo test` from `apps/conduit-next/src-tauri` after Rust changes.
