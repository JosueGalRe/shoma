Updated Conduit Tauri config to match updater/capability expectations.

- `conduit/src-tauri/capabilities/default.json` and `main.json` now include `updater:default` and `process:default` for the `main` window scope.
- `conduit/src-tauri/tauri.conf.json` now sets `plugins.updater.windows.installMode` to `passive`.
- Verification target is `grep -l '"updater:default"' conduit/src-tauri/capabilities/*.json` to confirm every main-targeting capability carries the updater permission.
- `lsp_diagnostics` is blocked here because the configured `biome` LSP is not installed in the workspace environment.
- Adding `tauri-plugin-process` also surfaced a pre-existing Linux build issue in `irelia`; target-gating that dependency to Windows/macOS let `cargo check --manifest-path conduit/src-tauri/Cargo.toml` finish cleanly on this host.

- Refactored `conduit/src-tauri/src/main.rs` updater check to skip debug builds, emit `conduit://update-available` with a cloneable serializable DTO, and leave download/install/restart decisions to the frontend.
- `cargo check --manifest-path conduit/src-tauri/Cargo.toml` passes on this host; only pre-existing `APP_ID`/`APP_NAME` dead-code warnings remain.
- Grep verification found no `download_and_install` or `app.restart()` calls in `main.rs`; the remaining `notification()` call is the existing `show_notification` command, not updater logic.

- `conduit/src/App.tsx` now treats Rust updater notifications as event-driven UI state: listen for `conduit://update-available`, store `{ version, date, notes }`, and never call frontend `downloadAndInstall()` or `relaunch()` from React.

- Split `.github/workflows/conduit.yml` into a PR/push CI job and a tag-only release job.
- CI now runs `cargo check --manifest-path conduit/src-tauri/Cargo.toml`, `pnpm --filter conduit run typecheck`, `pnpm --filter @shoma/conduit exec vite build`, and lint without any signing secrets.
- Release is gated to `conduit-v*` tags and keeps `TAURI_SIGNING_PRIVATE_KEY` / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` only in the `tauri-apps/tauri-action@v0` job with `releaseDraft: false`.

- Created `conduit/src/components/update-prompt.tsx` to handle the updater UI. It listens for user interaction to trigger `check()`, `downloadAndInstall()`, and `relaunch()`.
- Used `@shoma/design-system` components (`Card`, `Button`, `Icon`) and Tailwind v4 utility classes to match the existing UI.
- Implemented a progress bar for the download phase using the `Started`, `Progress`, and `Finished` events from the updater.

- Wired `UpdatePrompt` into `conduit/src/App.tsx`; the app now stores update event payloads in `updateInfo`, skips versions matching `localStorage['conduit-dismissed-version']`, and renders the prompt with version/date/notes plus a dismiss handler.
- Kept install ownership inside `UpdatePrompt`; `App.tsx` has no `downloadAndInstall` or `relaunch` calls.
- `pnpm --filter conduit run typecheck` passes after the wiring change.

- Wired `UpdatePrompt` into `conduit/src/App.tsx`: the existing `conduit://update-available` listener now skips versions stored under `conduit-dismissed-version`, renders the prompt from `updateInfo`, and dismissing stores the version plus clears state.
- Verification: `pnpm --filter conduit run typecheck` passes, `lsp_diagnostics` on `conduit/src/App.tsx` reports no diagnostics, and `grep -c` found 0 `downloadAndInstall` / 0 `relaunch` references in `App.tsx`.

## 2026-05-15 - Updater smoke test doc

- Added `conduit/UPDATER_SMOKE_TEST.md` as the manual updater E2E runbook. It documents the N-1 to N release flow, prompt behavior checks, install/relaunch verification, and fallback `latest.json` metadata/signature validation.
## 2026-05-15 Final Verification F3

- `cargo check --manifest-path conduit/src-tauri/Cargo.toml` exits 0; only existing dead-code warnings for `APP_ID` and `APP_NAME` on non-Windows builds.
- `pnpm --filter conduit run typecheck` exits 0 via `tsc --noEmit -p tsconfig.json`.
- Updater happy path traced: `spawn_daily_update_check` emits `conduit://update-available`, `App.tsx` listens and renders `UpdatePrompt`, and `UpdatePrompt` only calls `check().downloadAndInstall()` after the user clicks Install now.
- Dismiss path traced: Later/X stores `conduit-dismissed-version`, clears `updateInfo`, and future matching update events are ignored before rendering.
- Error path traced: install errors set visible error text, reset `isInstalling`, and the primary button changes to Retry, invoking the same install path again.
- CI PR job uses only cargo check/typecheck/build/lint; signing secrets are scoped to the tag-only release job.

## F4 Scope Fidelity Check - 2026-05-15
- Required diff stat command shows tracked changes only in conduit/ plus .github/workflows/conduit.yml.
- git status also shows untracked conduit/UPDATER_SMOKE_TEST.md and conduit/src/components/, still within allowed scope.
- No tracked/untracked changes detected under loom/, leyline/, legacy/, or packages/.
- Guardrails checked: no beta/canary channels, no Linux/macOS x64 release targets added, no Rust background install, no App.tsx mount auto-install, no PR/push signed release, and releaseDraft is false.
- T1-T8 are represented in the working tree, including the smoke-test checklist at conduit/UPDATER_SMOKE_TEST.md.
