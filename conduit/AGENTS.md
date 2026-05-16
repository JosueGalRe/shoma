# conduit KNOWLEDGE BASE

**Generated:** 2026-05-13

## OVERVIEW

Next-gen desktop bridge for Sho'ma. Tauri/Rust application that watches the League Client lockfile, connects to the LCU, and tunnels encrypted mobile sessions through `leyline`. Legacy version lives in `legacy/conduit/`.

## STRUCTURE

```
conduit/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs           # Entry: Tauri builder + plugin registration
│   │   ├── lib.rs            # App library exports
│   │   ├── manager.rs        # Connection lifecycle orchestrator
│   │   ├── crypto.rs         # RSA keypair generation
│   │   ├── protocol.rs       # Mobile frame protocol
│   │   ├── persistence.rs    # Settings + approved-devices storage
│   │   ├── tray.rs           # System tray + menu
│   │   ├── lcu/
│   │   │   ├── lockfile.rs   # League client detection
│   │   │   ├── http.rs       # LCU HTTP proxy client
│   │   │   └── websocket.rs  # LCU WebSocket proxy client
│   │   ├── mobile/
│   │   │   ├── session.rs    # Per-device encrypted session
│   │   │   └── approval.rs   # Device approval dialog logic
│   │   └── rift/
│   │       ├── hub.rs        # Rift hub WebSocket client
│   │       └── mod.rs        # Rift module exports
│   ├── tests/
│   │   └── integration.rs    # Rust integration tests
│   └── Cargo.toml            # Rust deps + Tauri features
├── src/                      # Frontend (React + Vite)
│   ├── main.tsx
│   ├── App.tsx
│   └── i18n/
└── vite.config.ts
```

## WHERE TO LOOK

| Task                    | Location                          | Notes                                                               |
| ----------------------- | --------------------------------- | ------------------------------------------------------------------- |
| Connection lifecycle    | `src-tauri/src/manager.rs`        | Lockfile events create LCU HTTP/WebSocket clients and Rift sessions |
| LCU HTTP client         | `src-tauri/src/lcu/http.rs`       | Manual reqwest client using lockfile credentials                    |
| LCU WebSocket client    | `src-tauri/src/lcu/websocket.rs`  | Manual tungstenite client using lockfile credentials                |
| Lockfile watcher        | `src-tauri/src/lcu/lockfile.rs`   | Drives connect/reconnect lifecycle                                  |
| Mobile protocol session | `src-tauri/src/mobile/session.rs` | Encrypts/decrypts frames and proxies LCU requests                   |
| Crypto                  | `src-tauri/src/crypto.rs`         | RSA keypair generation for handshake                                |
| Tray                    | `src-tauri/src/tray.rs`           | System tray icon + context menu                                     |
| Frontend                | `src/App.tsx`                     | React UI for status, code, QR                                       |
| Build config            | `src-tauri/tauri.conf.json`       | Window, bundle, and dev server settings                             |

## CONVENTIONS

- **LCU runtime:** use `LcuHttpClient` and `LcuWebSocketClient` from `lcu/http.rs` and `lcu/websocket.rs` for production LCU traffic. These use lockfile credentials directly.
- **Lockfile watcher:** `lcu/lockfile.rs` is active and drives the connect/reconnect lifecycle.
- **Verification:** run `cargo test` from `conduit/src-tauri` after Rust changes.
