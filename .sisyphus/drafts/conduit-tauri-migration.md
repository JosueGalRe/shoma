# Draft: Conduit Migration - C# to Tauri + TypeScript

## Status
**FINALIZED** — See `.sisyphus/plans/conduit-tauri-migration.md` for the complete work plan.

## User Requirements (Confirmed)
- **UI**: System tray icon + modal dialogs (device approval, about window)
- **Platforms**: Windows + Mac (Apple Silicon arm64) from day one
- **Stack**: Tauri v2 (Rust backend) + TypeScript frontend
- **Goal**: Replace the legacy C# Conduit with a modern cross-platform version

## Technical Decisions (Final)
- **Framework**: Tauri v2 (latest stable)
- **Process Detection**: Lockfile-based (NOT WMI/ps)
  - Windows: `%PROGRAMDATA%/Riot Games/League of Legends/lockfile`
  - Mac: `~/Library/Application Support/League of Legends/lockfile`
- **LCU Connection**: HTTPS + WebSocket to localhost (same as now)
- **Crypto**: Rust `rsa` + `aes` crates, compatible with existing C# RSA-OAEP + AES-CBC (PKCS7 padding)
- **Storage**: `tauri-plugin-store` or local JSON file
- **System Tray**: `tauri::tray` (native Tauri v2 tray API)
- **Protocol**: Port `@mimic/protocol-contract` types to Rust by hand

## Key Challenges
1. **Cross-platform lockfile discovery**: Different paths on Windows vs Mac
2. **Crypto compatibility**: Maintain byte-for-byte compatibility with C# RSA-OAEP + AES-CBC
3. **System tray events**: Handle clicks, menus, native notifications on both platforms
4. **Auto-reconnect**: Exponential backoff for LCU and Rift connections

## Scope Boundaries
- **INCLUDE**: 
  - Conduit desktop app (tray, dialogs, LCU proxy)
  - Compatibility with current protocol (Rift server)
  - Migration of crypto (RSA + AES)
- **EXCLUDE**:
  - Rift server (already exists in Node/Express at `/rift` and `/apps/rift-next`)
  - web-next UI (already done)
  - Linux support in MVP
  - Auto-updater in MVP
  - Code signing in MVP

## Open Questions
- [x] All resolved in final plan
