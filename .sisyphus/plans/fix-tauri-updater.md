# Fix Tauri v2 Updater (Conduit)

## TL;DR
> **Summary**: Fix critical blockers and architectural flaws in Conduit's Tauri v2 auto-updater. Unify competing Rust/frontend flows into an event-driven hybrid, add missing permissions/plugins, split CI from signed releases.
> **Deliverables**: Updated capabilities/config, refactored Rust updater to event emitter, frontend update UI with confirmation+progress, split CI/release workflow, E2E smoke test checklist.
> **Effort**: Short
> **Parallel**: YES — 4 waves
> **Critical Path**: Wave 1 (config+plugins) → Wave 2 (Rust+frontend refactor) → Wave 3 (UI+workflow) → Wave 4 (integration) → Wave 5 (smoke+verify)

## Context
### Original Request
Revisar la implementación actual del updater de Tauri v2 en Sho'ma contra la documentación oficial, identificar errores, y crear un plan de trabajo.

### Interview Summary
- **Dueño**: Híbrido — Rust detecta y emite evento, frontend decide e instala.
- **UX**: Confirmación explícita + progreso visual. No auto-install silencioso.
- **Pipeline**: Separar CI (PR/push = unsigned build+test) de release (tags `conduit-v*` = signed).
- **Canales**: Solo stable.
- **Plataformas**: macOS ARM64 + Windows x64 intencional.
- **Smoke test**: Sí, E2E manual/automated checklist.
- **Prioridad**: Media.

### Metis Review (gaps addressed)
- Event contract entre Rust y frontend definido.
- Supresión de updater en dev builds incluida.
- Failure UX para check/download/install/relaunch.
- CI artifact strategy: PRs build unsigned, releases tag-only signed.
- E2E smoke como release checklist, no CI automation bloqueante.

## Work Objectives
### Core Objective
Hacer que el updater de Conduit funcione de manera confiable, segura y con buena UX, siguiendo las best practices de Tauri v2.

### Deliverables
1. `conduit/src-tauri/capabilities/*.json` (all files targeting window `main`) — agrega `updater:default` y `process:default`.
2. `conduit/src-tauri/tauri.conf.json` — agrega `windows.installMode: "passive"`.
3. `conduit/src-tauri/Cargo.toml` — agrega `tauri-plugin-process`.
4. `conduit/src-tauri/src/main.rs` — refactored updater a event emitter, dev-safe.
5. `conduit/src/App.tsx` — quita auto-install, agrega listener de evento de update.
6. `conduit/src/components/update-prompt.tsx` — nuevo componente UI para confirmación+progreso.
7. `.github/workflows/conduit.yml` — separa CI de release firmada.
8. E2E smoke test checklist documentado.

### Definition of Done (verifiable conditions with commands)
- `cargo check --manifest-path conduit/src-tauri/Cargo.toml` exits 0.
- `pnpm --filter conduit run typecheck` exits 0.
- `pnpm --filter conduit run typecheck` exits 0.
- `cargo check --manifest-path conduit/src-tauri/Cargo.toml` exits 0.
- Capabilities incluyen `updater:default` y `process:default`.
- `main.rs` registra ambos plugins y no tiene `spawn_daily_update_check` como está.
- `App.tsx` no llama `downloadAndInstall()` desde `useEffect` de montaje.
- PR workflow no referencia `TAURI_SIGNING_PRIVATE_KEY`.
- Release workflow solo corre en tags `conduit-v*`.

### Must Have
- Capabilities fijas.
- Plugin process registrado en Rust.
- Flujo unificado event-driven.
- Frontend con confirmación y progreso.
- CI separado de release.
- Dev-safe (no updater checks en dev).

### Must NOT Have (guardrails)
- NO auto-install silencioso.
- NO background install desde Rust.
- NO `releaseDraft: true` en release workflow (bloquea updater).
- NO releases firmadas desde PR/push.
- NO cambios a `loom/`, `leyline/`, `legacy/`, `packages/`.
- NO beta/canales adicionales.
- NO Linux/macOS x64 nuevos.

## Verification Strategy
- **Test decision**: Tests-after (project usa Bun native test runner, pero el plan usa verificación estática + QA scenarios agent-executable)
- **QA policy**: Cada task tiene agent-executed scenarios happy + failure path
- **Evidence**: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves

**Wave 1: Foundation (config + permissions + plugins)**
- Task 1: Fix capabilities and config
- Task 2: Add tauri-plugin-process to Rust

**Wave 2: Core Refactor (Rust + frontend base)**
- Task 3: Refactor Rust updater to event emitter
- Task 4: Refactor frontend App.tsx (remove auto-install, add event listener)

**Wave 3: UI + Pipeline**
- Task 5: Create update-prompt component
- Task 6: Split CI and release workflow

**Wave 4: Integration**
- Task 7: Wire UI into App.tsx and test event flow

**Wave 5: Smoke Test + Final Verification**
- Task 8: Document and run E2E smoke test
- F1-F4: Final verification agents

### Dependency Matrix
| Task | Blocks | Blocked By |
|------|--------|------------|
| T1 | T3, T4 | — |
| T2 | T3, T4 | — |
| T3 | T7 | T1, T2 |
| T4 | T7 | T1, T2 |
| T5 | T7 | T4 |
| T6 | — | — |
| T7 | T8 | T3, T4, T5 |
| T8 | — | T7 |

### Agent Dispatch Summary
| Wave | Tasks | Categories |
|------|-------|------------|
| W1 | T1, T2 | quick |
| W2 | T3, T4 | unspecified-high |
| W3 | T5, T6 | visual-engineering (T5), quick (T6) |
| W4 | T7 | unspecified-high |
| W5 | T8, F1-F4 | unspecified-high, oracle, deep |

## TODOs

- [x] 1. Fix capabilities and updater config

  **What to do**:
  1. Check `conduit/src-tauri/capabilities/` for all JSON files. Add `"updater:default"` to the `permissions` array of EVERY capability file that targets window `"main"` (this includes `default.json` and `main.json` if both exist and target `main`).
  2. Add `"process:default"` to the same capability files (needed for `relaunch()`).
  3. Add `"windows": { "installMode": "passive" }` inside `plugins.updater` in `tauri.conf.json`.
  4. Verify no capability file targeting `main` is missing these permissions.

  **Must NOT do**: Do not add permissions to the wrong window scope. Do not change any other config. Do not assume only one capability file exists.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: Simple config additions, no logic.
  - Skills: `tanstack-router-best-practices` — not needed. `react-patterns` — not needed.
  - Omitted: `effect-ts` — not needed.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T3, T4 | Blocked By: —

  **References**:
  - Pattern: `conduit/src-tauri/capabilities/default.json` — add permissions to `"main"` scope.
  - Pattern: `conduit/src-tauri/tauri.conf.json` — add `windows.installMode` under `plugins.updater`.
  - External: https://v2.tauri.app/plugin/updater/ — `installMode` and capabilities requirements.

  **Acceptance Criteria**:
  - [ ] `grep -l '"updater:default"' conduit/src-tauri/capabilities/*.json` lists all capability files targeting `main`.
  - [ ] `grep -l '"process:default"' conduit/src-tauri/capabilities/*.json` lists the same files.
  - [ ] `grep 'installMode.*passive' conduit/src-tauri/tauri.conf.json` returns match.
  - [ ] No capability file targeting `main` lacks `updater:default`.

  **QA Scenarios**:
  ```
  Scenario: Capabilities have updater permission
    Tool: Bash
    Steps: for f in conduit/src-tauri/capabilities/*.json; do echo "$f:"; grep -c 'updater:default' "$f"; done
    Expected: Every file targeting main shows count >= 1
    Evidence: .sisyphus/evidence/task-1-capabilities.txt

  Scenario: Failure — permission missing in one capability file
    Tool: Bash
    Steps: Check if any capability file targeting main lacks updater:default
    Expected: None missing; if found, fix before proceeding
    Evidence: .sisyphus/evidence/task-1-missing-perm.txt
  ```

  **Commit**: YES | Message: `fix(conduit): add updater and process permissions to capabilities` | Files: `conduit/src-tauri/capabilities/default.json`, `conduit/src-tauri/capabilities/main.json` (if it exists and targets main), `conduit/src-tauri/tauri.conf.json`

- [x] 2. Add tauri-plugin-process to Rust

  **What to do**:
  1. Add `tauri-plugin-process = "2"` to `[dependencies]` in `conduit/src-tauri/Cargo.toml`.
  2. In `main.rs`, add `.plugin(tauri_plugin_process::init())` to the app builder (before or after updater plugin).
  3. Verify `cargo check --manifest-path conduit/src-tauri/Cargo.toml` exits 0.

  **Must NOT do**: Do not use a different version than `"2"` to match the updater plugin. Do not forget to register the plugin in the builder.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: Dependency addition + plugin registration, no complex logic.
  - Skills: [] — Reason: Straightforward Rust/Tauri config.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T3, T4 | Blocked By: —

  **References**:
  - API: `conduit/src-tauri/Cargo.toml` — add dependency alongside `tauri-plugin-updater`.
  - Pattern: `conduit/src-tauri/src/main.rs` — add `.plugin(tauri_plugin_process::init())` in builder chain.
  - External: https://v2.tauri.app/plugin/process/ — plugin registration.

  **Acceptance Criteria**:
  - [ ] `grep 'tauri-plugin-process' conduit/src-tauri/Cargo.toml` returns match.
  - [ ] `grep 'tauri_plugin_process' conduit/src-tauri/src/main.rs` returns match.
  - [ ] `cargo check --manifest-path conduit/src-tauri/Cargo.toml` exits 0.
  - [ ] `grep 'tauri-plugin-process' conduit/src-tauri/Cargo.lock` returns match (lockfile updated).

  **QA Scenarios**:
  ```
  Scenario: Process plugin compiles
    Tool: Bash
    Steps: cargo check --manifest-path conduit/src-tauri/Cargo.toml
    Expected: Exit code 0, no errors
    Evidence: .sisyphus/evidence/task-2-cargo-check.txt
  ```

  **Commit**: YES | Message: `fix(conduit): register tauri-plugin-process for relaunch` | Files: `conduit/src-tauri/Cargo.toml`, `conduit/src-tauri/Cargo.lock`, `conduit/src-tauri/src/main.rs`

- [x] 3. Refactor Rust updater to event emitter

  **What to do**:
  1. Replace `spawn_daily_update_check` with a function that:
     - Checks if running in dev mode; if so, skip updater logic entirely.
     - Builds an updater using `app.updater_builder().build()`.
     - Calls `updater.check().await`.
     - If `Some(update)`: emit a Tauri event named `"conduit://update-available"` with a serializable DTO payload:
       ```rust
       #[derive(Serialize)]
       struct UpdateAvailablePayload {
         version: String,
         date: Option<String>,
         notes: Option<String>,
       }
       // usage:
       // app.emit("conduit://update-available", UpdateAvailablePayload {
       //   version: update.version.to_string(),
       //   date: update.date.map(|d| d.to_string()),
       //   notes: update.body.clone(),
       // });
       ```
     - Does NOT download, install, or relaunch. Does NOT show notification.
     - Handles errors gracefully (log only).
  2. Call this function once on `setup` (after plugins registered), then schedule a re-check every 24h using `tokio::time::interval`.
  3. Remove any old notification builder code related to updater.
  4. Verify `cargo check` passes.

  **Must NOT do**: Do NOT call `download_and_install` or `app.restart()` from Rust. Do NOT show OS notifications about updates. Do NOT run updater checks in dev builds.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: Refactoring existing Rust async logic with event emission.
  - Skills: [] — Reason: Standard Tauri v2 Rust patterns.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T7 | Blocked By: T1, T2

  **References**:
  - Pattern: `conduit/src-tauri/src/main.rs` — existing `spawn_daily_update_check`.
  - API: `tauri::AppHandle::emit()` — event emission to frontend.
  - External: https://v2.tauri.app/plugin/updater/ — Rust `check()` API.

  **Acceptance Criteria**:
  - [ ] `cargo check --manifest-path conduit/src-tauri/Cargo.toml` exits 0.
  - [ ] `grep 'conduit://update-available' conduit/src-tauri/src/main.rs` returns match.
  - [ ] `grep 'download_and_install' conduit/src-tauri/src/main.rs` returns NO match.
  - [ ] `grep 'app.restart()\|app.restart();' conduit/src-tauri/src/main.rs` returns NO match (outside other contexts if any).
  - [ ] Dev suppression logic exists (e.g., checking `cfg!(debug_assertions)` or `app.config().app.env`).

  **QA Scenarios**:
  ```
  Scenario: Rust emits event on update available
    Tool: Bash + interactive_bash / Tauri dev
    Steps:
      1. Temporarily disable dev suppression in main.rs (comment out the `cfg!(debug_assertions)` guard).
      2. Start local server: python3 -m http.server 8765 --directory /tmp
      3. Write /tmp/latest.json with a version higher than current app version.
      4. Temporarily change endpoint in tauri.conf.json to "http://localhost:8765/latest.json".
      5. Run: cargo tauri dev
      6. Check frontend console for event payload.
    Expected: Console shows "conduit://update-available" event with version from latest.json
    Evidence: .sisyphus/evidence/task-3-event-emission.txt
    Cleanup: Revert endpoint change and dev suppression after test.

  Scenario: Rust does not auto-install
    Tool: Bash
    Steps: grep -E 'download_and_install|app\.restart' conduit/src-tauri/src/main.rs
    Expected: No matches in updater-related code
    Evidence: .sisyphus/evidence/task-3-no-auto-install.txt

  Scenario: Dev build suppresses updater check
    Tool: Bash
    Steps: grep -E 'debug_assertions' conduit/src-tauri/src/main.rs
    Expected: Logic exists and guards updater builder
    Evidence: .sisyphus/evidence/task-3-dev-suppress.txt

  Scenario: Failure — endpoint unreachable
    Tool: interactive_bash / Tauri dev
    Steps:
      1. Temporarily set endpoint in tauri.conf.json to "http://localhost:65535/nonexistent".
      2. Run: cargo tauri dev
    Expected: App starts normally, no panic, error logged gracefully
    Evidence: .sisyphus/evidence/task-3-offline.txt
    Cleanup: Revert endpoint change.
  ```

  **Commit**: YES | Message: `refactor(conduit): make Rust updater an event emitter only` | Files: `conduit/src-tauri/src/main.rs`

- [x] 4. Refactor frontend App.tsx

  **What to do**:
  1. Remove the existing `useEffect` that calls `check()` and `downloadAndInstall()` on mount.
  2. Add a `useEffect` that listens for the Tauri event `"conduit://update-available"` using `listen()` from `@tauri-apps/api/event`.
  3. When event fires: store update info (version, date, notes) in component state to trigger UI display.
  4. Keep `getVersion()` / `getTauriVersion()` display if it exists.
  5. Verify TypeScript compiles.

  **Must NOT do**: Do NOT call `downloadAndInstall()` anywhere in App.tsx. Do NOT call `relaunch()` anywhere in App.tsx. Do NOT add manual check functions (scope).

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: Refactoring existing React logic, event listeners, state management.
  - Skills: `react-patterns` — Reason: Event listener cleanup, state management.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T7 | Blocked By: T1, T2

  **References**:
  - Pattern: `conduit/src/App.tsx` — existing updater useEffect.
  - API: `@tauri-apps/api/event` — `listen()` for Tauri events.
  - External: https://v2.tauri.app/plugin/updater/ — JS `check()` API.

  **Acceptance Criteria**:
  - [ ] `pnpm --filter conduit run typecheck` exits 0.
  - [ ] `grep 'downloadAndInstall' conduit/src/App.tsx` returns NO match anywhere.
  - [ ] `grep 'relaunch' conduit/src/App.tsx` returns NO match anywhere.
  - [ ] `grep 'conduit://update-available' conduit/src/App.tsx` returns match.
  - [ ] `grep 'listen' conduit/src/App.tsx` returns match.

  **QA Scenarios**:
  ```
  Scenario: No auto-install on mount
    Tool: Bash
    Steps: grep -c 'downloadAndInstall' conduit/src/App.tsx && grep -c 'relaunch' conduit/src/App.tsx
    Expected: Both return 0
    Evidence: .sisyphus/evidence/task-4-no-auto-install.txt

  Scenario: Event listener registered and cleaned up
    Tool: Bash
    Steps: grep -n 'listen' conduit/src/App.tsx && grep -n 'unlisten\|return.*cleanup' conduit/src/App.tsx
    Expected: Contains listen registration for conduit://update-available and cleanup in useEffect return
    Evidence: .sisyphus/evidence/task-4-event-listener.txt
  ```

  **Commit**: YES | Message: `refactor(conduit): remove auto-install, add update event listener` | Files: `conduit/src/App.tsx`

- [x] 5. Create update-prompt UI component

  **What to do**:
  1. Create directory `conduit/src/components/` if it does not exist. Create `conduit/src/components/update-prompt.tsx`.
  2. Component props: `version: string`, `date?: string`, `notes?: string`, `onDismiss: () => void`.
  3. Component owns the ENTIRE install flow internally:
     - On "Install now": call `check()` to get the update object, then `update.downloadAndInstall((event) => { ... })` with progress callback, then `relaunch()`.
     - On error at any stage: show error message and "Retry" button.
  4. UI must show:
     - Title: "Update available: v{version}"
     - Release date and notes (if provided).
     - "Install now" button and "Later" button.
  5. Progress state: show progress bar/indicator using callback events `Started`, `Progress`, `Finished`.
  6. On "Later" click: call `onDismiss()`, component unmounts/hides. Store "dismissed version" in localStorage so it doesn't re-prompt for the same version in the same session.
  7. Use project UI conventions (Tailwind v4, design-system if applicable).

  **Must NOT do**: Do NOT install without explicit user click. Do NOT block the entire app with a modal if the design system has non-blocking alternatives. Do NOT use external UI libraries not in the project.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: Frontend UI component with state management, progress callbacks, error handling.
  - Skills: `react-patterns`, `web-design-guidelines` — Reason: Component composition, accessibility, progress feedback.
  - Omitted: `effect-ts` — not needed.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: T7 | Blocked By: T4

  **References**:
  - Pattern: `conduit/src/App.tsx` — how other components are imported and used.
  - API: `@tauri-apps/plugin-updater` — `check()`, `downloadAndInstall(callback)`.
  - API: `@tauri-apps/plugin-process` — `relaunch()`.
  - External: https://v2.tauri.app/plugin/updater/ — JS API examples.

  **Acceptance Criteria**:
  - [ ] Component file exists at `conduit/src/components/update-prompt.tsx`.
  - [ ] `pnpm --filter conduit run typecheck` exits 0.
  - [ ] Component exports a React component with props `version`, `date?`, `notes?`, `onDismiss`.
  - [ ] `grep 'downloadAndInstall' conduit/src/components/update-prompt.tsx` returns match inside install handler.
  - [ ] `grep 'relaunch' conduit/src/components/update-prompt.tsx` returns match inside install handler.
  - [ ] `grep 'onDismiss' conduit/src/components/update-prompt.tsx` returns match.

  **QA Scenarios**:
  ```
  Scenario: Happy path — UI triggers install handlers
    Tool: interactive_bash / Tauri dev
    Steps:
      1. Serve latest.json from local server with a higher version.
      2. Run app, wait for event, verify prompt appears.
      3. Click "Install now", verify UI enters progress state and calls downloadAndInstall (check console logs or spy).
    Expected: UI shows progress state; `downloadAndInstall` called. Full download+install+relaunch requires signed artifact; verified in smoke test (T8).
    Evidence: .sisyphus/evidence/task-5-install-ui.txt

  Scenario: Dismiss update
    Tool: interactive_bash / Tauri dev
    Steps:
      1. Serve latest.json with higher version from local server.
      2. Run app, click "Later" in prompt.
    Expected: Prompt disappears, no install triggered
    Evidence: .sisyphus/evidence/task-5-dismiss.txt

  Scenario: Error handling — download fails
    Tool: interactive_bash / Tauri dev
    Steps:
      1. Serve latest.json with url pointing to non-existent file (e.g., http://localhost:8765/missing.zip).
      2. Run app, trigger event, click "Install now".
    Expected: Error message shown, "Retry" button available
    Evidence: .sisyphus/evidence/task-5-error-download.txt

  Scenario: Error handling — relaunch fails
    Tool: interactive_bash / Tauri dev
    Steps:
      1. Serve valid latest.json + artifact from local server.
      2. Run app, click Install.
      3. If relaunch fails (e.g., permission denied), verify UI handles it.
    Expected: Error shown gracefully; app does not crash
    Evidence: .sisyphus/evidence/task-5-error-relaunch.txt
  ```

  **Commit**: YES | Message: `feat(conduit): add update prompt component with progress` | Files: `conduit/src/components/update-prompt.tsx`

- [x] 6. Split CI and release workflow

  **What to do**:
  1. Modify `.github/workflows/conduit.yml`:
     - PR/push job: run `cargo check`, `pnpm --filter conduit run typecheck`, frontend-only build (`pnpm --filter @shoma/conduit exec vite build` or equivalent frontend-only script), and lint. Do NOT run `cargo tauri build` (signs/bundles) or reference `TAURI_SIGNING_PRIVATE_KEY`. Do NOT create releases.
     - Create a separate release job that ONLY runs on tags matching `conduit-v*`:
       - Uses `tauri-apps/tauri-action@v0`.
       - Has `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (if applicable) in env.
       - `releaseDraft: false` ONLY (drafts break the updater endpoint).
       - `tagName: conduit-v__VERSION__`.
  2. Ensure PR workflow runs on `pull_request` without signing secrets.
  3. Ensure push-to-main workflow does build/test but no release.
  4. Document behavior in workflow comments or README.

  **Must NOT do**: Do NOT leave `TAURI_SIGNING_PRIVATE_KEY` in PR workflow. Do NOT create releases from push-to-main. Do NOT change tag format unexpectedly.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: YAML workflow reorganization, no application code.
  - Skills: [] — Reason: GitHub Actions knowledge is sufficient.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: — | Blocked By: — (workflow is independent)

  **References**:
  - Pattern: `.github/workflows/conduit.yml` — existing workflow.
  - External: https://v2.tauri.app/plugin/updater/ — release requirements.

  **Acceptance Criteria**:
  - [ ] PR job does not reference `TAURI_SIGNING_PRIVATE_KEY`.
  - [ ] Release job only triggers on `tags: ['conduit-v*']`.
  - [ ] Release job references signing secret.

  **QA Scenarios**:
  ```
  Scenario: PR workflow is secret-safe
    Tool: Bash
    Steps: grep 'TAURI_SIGNING_PRIVATE_KEY' .github/workflows/conduit.yml
    Expected: Only appears in tag-release job, not in PR job
    Evidence: .sisyphus/evidence/task-6-pr-safe.txt

  Scenario: Release triggers on tag
    Tool: Bash
    Steps: grep -A2 'on:' .github/workflows/conduit.yml | grep 'conduit-v'
    Expected: Tag pattern match exists in release trigger
    Evidence: .sisyphus/evidence/task-6-tag-trigger.txt

  Scenario: Failure — releaseDraft must be false
    Tool: Bash
    Steps: grep -i 'releaseDraft' .github/workflows/conduit.yml
    Expected: Only `releaseDraft: false` appears in release job; no `releaseDraft: true`
    Evidence: .sisyphus/evidence/task-6-no-drafts.txt
  ```

  **Commit**: YES | Message: `ci(conduit): separate PR builds from signed tag releases` | Files: `.github/workflows/conduit.yml`

- [x] 7. Wire update-prompt into App.tsx and verify event flow

  **What to do**:
  1. In `App.tsx`, before setting update state from the event, check `localStorage` for a dismissed version. If the event's version matches the dismissed version, skip showing the prompt.
  2. Import and conditionally render `<UpdatePrompt />` when update info state is set.
  3. Ensure the event listener from T4 sets the state that triggers the prompt (after the localStorage check).
  4. Pass an `onDismiss` handler that: (a) clears the update state (hiding the prompt), and (b) stores the dismissed version in `localStorage`. The install logic lives entirely inside `UpdatePrompt`; App.tsx does NOT pass an install handler.
  5. Verify TypeScript compiles.
  6. Do a dev run to confirm: no auto-install on startup, event triggers prompt, dismiss works, install path works.
  7. If dev builds suppress updater checks (T3), manually test by temporarily disabling suppression or by building a test binary.

  **Must NOT do**: Do NOT add more than one listener for the same event. Do NOT leave dead code from old auto-install. Do NOT pass install handler from App.tsx to UpdatePrompt.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: Integration wiring between Rust events and React UI.
  - Skills: `react-patterns` — Reason: State lifting, conditional rendering, event cleanup.

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: T8 | Blocked By: T3, T4, T5

  **References**:
  - Pattern: `conduit/src/App.tsx` — event listener state and component rendering.
  - Pattern: `conduit/src/components/update-prompt.tsx` — component API.

  **Acceptance Criteria**:
  - [ ] `pnpm --filter conduit run typecheck` exits 0.
  - [ ] `grep 'UpdatePrompt' conduit/src/App.tsx` returns match.
  - [ ] `grep 'downloadAndInstall' conduit/src/App.tsx` returns NO match.
  - [ ] `grep 'relaunch' conduit/src/App.tsx` returns NO match.
  - [ ] `grep 'onDismiss' conduit/src/App.tsx` returns match (prop passed to UpdatePrompt).

  **QA Scenarios**:
  ```
  Scenario: End-to-end event → prompt → dismiss
    Tool: interactive_bash / Tauri dev
    Steps:
      1. Serve latest.json with higher version from local server.
      2. Start app, wait for event, verify prompt appears.
      3. Click Later, verify prompt gone.
    Expected: Prompt appears and dismisses cleanly; localStorage stores dismissed version
    Evidence: .sisyphus/evidence/task-7-e2e-dismiss.txt

  Scenario: End-to-end event → prompt → install UI triggers
    Tool: interactive_bash / Tauri dev
    Steps:
      1. Serve latest.json from local server with a higher version.
      2. Start app, verify prompt appears.
      3. Click Install, verify progress UI appears and downloadAndInstall is called.
    Expected: UI shows progress; install handlers triggered. Full artifact download+relaunch verified in T8 smoke test.
    Evidence: .sisyphus/evidence/task-7-e2e-install.txt

  Scenario: Failure — stale event shows error gracefully
    Tool: interactive_bash / Tauri dev
    Steps:
      1. Serve latest.json with higher version from local server.
      2. Start app, verify prompt appears.
      3. Stop server or delete latest.json.
      4. Click Install.
    Expected: UpdatePrompt shows download error with retry option
    Evidence: .sisyphus/evidence/task-7-e2e-stale.txt
  ```

  **Commit**: YES | Message: `feat(conduit): wire update prompt into app event flow` | Files: `conduit/src/App.tsx`

- [x] 8. Document and run E2E smoke test

  **What to do**:
  1. Create `conduit/UPDATER_SMOKE_TEST.md` documenting the manual E2E steps:
     - Build and install version N-1 (e.g., tag `conduit-v0.1.0`).
     - Create and push tag `conduit-v0.1.1` with a small version bump in `tauri.conf.json`.
     - Wait for release workflow to publish.
     - Open installed v0.1.0.
     - Verify it detects v0.1.1.
     - Verify prompt shows correct version.
     - Click Install.
     - Verify download progress.
     - Verify app relaunches.
     - Verify running version is v0.1.1.
  2. Actually perform the smoke test if possible (requires two version tags).
  3. If not possible in the current session, document the steps clearly enough for the next release engineer.

  **Must NOT do**: Do NOT skip documenting the smoke test. Do NOT use `releaseDraft: true` for the smoke test release (updater won't see it).

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: End-to-end validation across build, release, install, and runtime.
  - Skills: [] — Reason: Manual QA with documented steps.

  **Parallelization**: Can Parallel: NO | Wave 5 | Blocks: — | Blocked By: T7

  **References**:
  - Pattern: `.github/workflows/conduit.yml` — release workflow steps.
  - External: https://v2.tauri.app/plugin/updater/ — expected JSON format and flow.

  **Acceptance Criteria**:
  - [ ] Document `conduit/UPDATER_SMOKE_TEST.md` exists.
  - [ ] Document includes steps for building vN-1, pushing vN, and verifying update.
  - [ ] If smoke test performed: evidence file exists.

  **QA Scenarios**:
  ```
  Scenario: Smoke test checklist complete
    Tool: Bash
    Steps: cat conduit/UPDATER_SMOKE_TEST.md
    Expected: All steps from build to relaunch are documented
    Evidence: .sisyphus/evidence/task-8-smoke-checklist.txt

  Scenario: Failure — smoke test cannot be performed now
    Tool: Bash
    Steps: Verify document includes fallback: "If unable to run live, validate latest.json format and artifact signatures manually"
    Expected: Fallback validation steps documented
    Evidence: .sisyphus/evidence/task-8-smoke-fallback.txt
  ```

  **Commit**: YES | Message: `docs(conduit): add updater E2E smoke test checklist` | Files: `conduit/UPDATER_SMOKE_TEST.md`

## Final Verification Wave
- [x] F1. Plan Compliance Audit — oracle
- [x] F2. Code Quality Review — unspecified-high
- [x] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [x] F4. Scope Fidelity Check — unspecified-high

## Commit Strategy
- Commits individuales por wave o task para facilitar rollback.
- Mensajes: `fix(conduit): ...`, `feat(conduit): ...`, `ci(conduit): ...`
- No squash hasta final verification.

## Success Criteria
- Capabilities incluyen `updater:default` y `process:default`.
- Rust no tiene flujo de updater que compita con frontend.
- Frontend muestra UI de confirmación con versión y notas.
- Progreso de descarga visible.
- Release solo por tags `conduit-v*` con firma.
- Smoke test pasa: vN-1 detecta update, descarga, instala, reinicia.
