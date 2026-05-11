## 2026-05-03
- `conduit-next` now uses `@vitejs/plugin-react`, `react`, and `react-dom` with `jsx: react-jsx` in `tsconfig.json`.
- Guarding the React mount behind `typeof document !== "undefined"` keeps Bun tests from failing on module import.
- `vite.config.ts` should only reference existing HTML entry points; the missing `about.html` input was removed so builds succeed.

## 2026-05-03 - Tauri IPC frontend wiring
- Tauri v2 async commands that accept `tauri::State` must return `Result`; clone managed state before awaiting to avoid holding the request-bound state reference across `.await`.
- `ConnectionManager` can be registered with `app.manage(connection_manager.clone())` before `spawn()` so commands can read current state while the running manager owns another clone.
- Frontend uses `listen` from `@tauri-apps/api/event` and `invoke` from `@tauri-apps/api/core`; keep unlisten cleanup guarded for async setup races.
- Passing the hub URL through `ConnectionSnapshot` lets the frontend build QR codes for whichever server the backend is actually using.

## 2026-05-03 - Startup Rift access code registration
- `ConnectionManager::ensure_registered_access_code()` can run the existing JWT validation/register flow without an LCU lockfile, then emit `access-code-changed` so the frontend can show the persisted code on startup.
- Tauri setup can spawn this registration task independently before/alongside `connection_manager.spawn()`, preserving lockfile watching and League connection behavior.

## 2026-05-03 - Rift URL and League lockfile debugging
- `ConnectionManager::run()` starts `lockfile::watch_lockfile()` with a 2-second poll interval and receives appeared/changed/disappeared events over an unbounded channel.
- Windows lockfile discovery already checked `%PROGRAMDATA%` and common install directories, but was missing `%LOCALAPPDATA%\\Riot Games\\League of Legends\\lockfile`.
- In Rust tests on Linux, `PathBuf::join()` appends platform separators even for Windows-looking path strings, so lockfile path tests should build expected paths with `join()` too.
