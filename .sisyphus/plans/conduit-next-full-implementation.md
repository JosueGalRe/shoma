# Plan: Conduit-Next Full Implementation

## TL;DR
> **Summary**: Replace the placeholder frontend shell in conduit-next with a complete, attractive, frameless UI that displays connection status, access code, and QR code. Remove native app menu. Integrate with the already-complete Rust backend via Tauri commands/events.
> **Deliverables**: Frameless window config, custom titlebar, main UI component, tray integration, Tauri capabilities, working IPC bridge
> **Effort**: Medium (5-8 tasks)
> **Parallel**: YES - Wave 1: config + permissions (no deps), Wave 2: UI + tray (depends on Wave 1)
> **Critical Path**: Window config → Titlebar → Main UI → IPC bridge → Tray

## Context
### Original Request
User wants conduit-next to:
1. Implement same functionality as old C# Conduit
2. Have an attractive design inspired by League of Legends
3. Be a frameless window (no ugly native app menu)
4. Replace the old Conduit completely

### Interview Summary
- Frameless window confirmed
- LoL-inspired dark theme confirmed (colors provided)
- Window size: **400x320** (changed from 360x240 for QR scan reliability)
- Must display: connection status, access code, QR code
- Backend is complete in Rust, frontend is placeholder only
- **Frontend stack: React** (same as web-next)
- **Scope v1: Full parity** = main window + tray + About + notifications + settings

### Metis Review (gaps addressed)
- **Gap**: Backend state not exposed to frontend → Add Tauri commands/events
- **Gap**: Tray scope undefined → Tray shows code + status, menu has Show/Quit
- **Gap**: Frameless edge cases → Close hides to tray, not quits
- **Gap**: Small window hierarchy → Priority: status > code > QR > actions
- **Gap**: QR generation undefined → Frontend generates from code + URL
- **Gap**: Permissions missing → Add Tauri v2 capabilities for window+tray
- **Gap**: Connection states undefined → 5 states: starting, waiting, connected, paired, error
- **Gap**: Settings scope → Settings IN SCOPE for v1 (user confirmed full parity)
- **Gap**: Frontend stack undefined → React (same as web-next)
- **Gap**: Window size feasibility → 400x320 (changed from 360x240)
- **Gap**: QR content undefined → `https://remote.mimic.lol/{code}`
- **Gap**: Connection states undefined → 5 states confirmed: starting, waiting, connected, paired, error

## Work Objectives
### Core Objective
Create a complete, functional, attractive frontend for conduit-next that replaces the old C# Conduit, with frameless window, LoL-inspired design, and full backend integration.

### Deliverables
1. Frameless window configuration (`decorations: false`)
2. Native menu removal
3. Custom HTML titlebar with drag region and controls
4. Main UI showing connection status, access code, QR code
5. Tray integration with live code/status updates
6. Tauri commands/events for frontend-backend communication
7. Tauri v2 capabilities/permissions configuration

### Definition of Done (verifiable conditions)
- [ ] `cargo tauri dev` launches a 360x240 frameless window
- [ ] No native app menu is visible
- [ ] Window has custom titlebar with Mimic logo/title and minimize/close buttons
- [ ] Window is draggable via titlebar
- [ ] Main UI shows live connection status with color-coded indicator
- [ ] Main UI shows current 6-digit access code in large text
- [ ] Main UI shows scannable QR code
- [ ] Tray icon exists with right-click menu (Show, Quit)
- [ ] Tray tooltip shows current status/code
- [ ] Close button hides window to tray (not quit)
- [ ] All Tauri v2 permissions are configured
- [ ] Frontend receives state updates from backend (not hardcoded)

### Must Have
- Frameless window with custom controls
- Dark LoL-inspired theme (#010A13 bg, #C8AA6E gold accents)
- Connection status display (5 states with colors)
- Access code display (large, copyable)
- QR code display
- Tray with live updates
- Tauri IPC bridge

### Must NOT Have (guardrails)
- No settings panel in main window (out of scope)
- No native app menu
- No external LoL copyrighted assets (use CSS only)
- No polling from frontend (use Tauri events)
- No complex flows in 360x240 window

## Verification Strategy
- **Test decision**: Tests-after + agent QA
- **QA policy**: Every task has agent-executed scenarios
- **Evidence**: .sisyphus/evidence/task-{N}-{slug}.{ext}

## Execution Strategy
### Parallel Execution Waves

**Wave 1: Foundation (config + permissions)**
- T1: Configure frameless window
- T2: Remove native menu
- T3: Configure Tauri capabilities/permissions

**Wave 2: UI + Integration**
- T4: Create custom titlebar component
- T5: Create main UI component (status + code + QR)
- T6: Wire frontend to backend via Tauri IPC

**Wave 3: Polish**
- T7: Tray integration with live updates
- T8: Final styling and QA

### Dependency Matrix
| Task | Depends On | Blocks |
|------|-----------|--------|
| T1 | - | T4 |
| T2 | - | - |
| T3 | - | T6, T7 |
| T4 | T1 | T5 |
| T5 | T4 | T6 |
| T6 | T3, T5 | T7 |
| T7 | T3, T6 | T8 |
| T8 | T7 | - |

## TODOs

- [ ] T1. Configure frameless window

  **What to do**: Set `decorations: false` in `tauri.conf.json`, add window permissions
  **Must NOT do**: Change window size (keep 360x240), do not add resize handles

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T4 | Blocked By: -

  **References**:
  - Config: `apps/conduit-next/src-tauri/tauri.conf.json`
  - Tauri docs: `app.windows` section with `decorations: false`

  **Acceptance Criteria**:
  - [ ] `tauri.conf.json` has `"decorations": false` in `app.windows[0]`
  - [ ] `cargo tauri dev` opens window without native borders

  **QA Scenarios**:
  ```
  Scenario: Window is frameless
    Tool: Bash
    Steps: cd apps/conduit-next && cargo tauri dev
    Expected: Window opens without Windows title bar or borders
    Evidence: .sisyphus/evidence/task-1-frameless.png
  ```

  **Commit**: YES | Message: `feat(conduit): make window frameless` | Files: `apps/conduit-next/src-tauri/tauri.conf.json`

- [ ] T2. Remove native application menu

  **What to do**: Call `window.remove_menu()` in Rust setup, ensure no menu is created
  **Must NOT do**: Do not add custom menu items, completely remove menu

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: - | Blocked By: -

  **References**:
  - Code: `apps/conduit-next/src-tauri/src/main.rs`
  - Tauri API: `window.remove_menu()`

  **Acceptance Criteria**:
  - [ ] `main.rs` calls `window.remove_menu()` in setup
  - [ ] No menu bar visible in window

  **QA Scenarios**:
  ```
  Scenario: No menu bar
    Tool: Bash
    Steps: Run app, check for menu bar
    Expected: No File/Edit/View menu visible
    Evidence: .sisyphus/evidence/task-2-no-menu.png
  ```

  **Commit**: YES | Message: `feat(conduit): remove native menu bar` | Files: `apps/conduit-next/src-tauri/src/main.rs`

- [ ] T3. Configure Tauri v2 capabilities/permissions

  **What to do**: Create capability file with permissions for window controls, tray
  **Must NOT do**: Do not add unnecessary permissions (security principle)

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T6, T7 | Blocked By: -

  **References**:
  - Dir: `apps/conduit-next/src-tauri/capabilities/`
  - Tauri docs: capabilities schema

  **Acceptance Criteria**:
  - [ ] Capability file exists with `core:window:allow-*` permissions
  - [ ] Capability file has `tray:default` permission
  - [ ] App compiles without permission errors

  **QA Scenarios**:
  ```
  Scenario: Permissions valid
    Tool: Bash
    Steps: cargo check in src-tauri/
    Expected: Compiles without permission errors
    Evidence: .sisyphus/evidence/task-3-permissions.txt
  ```

  **Commit**: YES | Message: `feat(conduit): add Tauri capabilities for window and tray` | Files: `apps/conduit-next/src-tauri/capabilities/*.json`

- [ ] T4. Create custom titlebar component

  **What to do**: HTML/CSS titlebar with app title, minimize button, close button. Use `data-tauri-drag-region` for dragging.
  **Must NOT do**: Do not use native window controls, keep titlebar height ≤ 32px

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T5 | Blocked By: T1

  **References**:
  - File: `apps/conduit-next/src/main.ts` (replace placeholder)
  - Tauri API: `getCurrentWindow()` for minimize/close
  - CSS: `data-tauri-drag-region`

  **Acceptance Criteria**:
  - [ ] Titlebar shows "Mimic Conduit" text
  - [ ] Minimize button works
  - [ ] Close button hides to tray (not quit)
  - [ ] Titlebar is draggable
  - [ ] Height is ≤ 32px

  **QA Scenarios**:
  ```
  Scenario: Titlebar controls work
    Tool: Playwright
    Steps: Click minimize, click close
    Expected: Minimize minimizes window, close hides to tray
    Evidence: .sisyphus/evidence/task-4-titlebar.mp4
  ```

  **Commit**: YES | Message: `feat(conduit): add custom titlebar` | Files: `apps/conduit-next/src/main.ts`, `apps/conduit-next/src/style.css`

- [ ] T5. Create main UI component (status + code + QR)

  **What to do**: Create HTML structure for status indicator, access code, QR code. Use LoL colors.
  **Must NOT do**: Do not add settings/about in main window, keep minimal

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T6 | Blocked By: T4

  **References**:
  - File: `apps/conduit-next/src/main.ts`
  - Colors: bg #010A13, gold #C8AA6E, connected #0AC8B9, disconnected #E84057
  - QR library: `qrcode` (already in package.json dependencies)

  **Acceptance Criteria**:
  - [ ] Status indicator shows 5 states with correct colors:
    - Starting (gray)
    - Waiting for League (yellow)
    - Connected (teal #0AC8B9)
    - Paired/Mobile connected (green)
    - Error (red #E84057)
  - [ ] Access code displayed in large text (≥24px)
  - [ ] QR code rendered below code
  - [ ] All fits in 360x240 window

  **QA Scenarios**:
  ```
  Scenario: UI renders correctly
    Tool: Playwright
    Steps: Open app, check layout
    Expected: Status dot, code, QR all visible and not overlapping
    Evidence: .sisyphus/evidence/task-5-ui.png
  ```

  **Commit**: YES | Message: `feat(conduit): add main UI with status, code, and QR` | Files: `apps/conduit-next/src/main.ts`, `apps/conduit-next/src/style.css`

- [ ] T6. Wire frontend to backend via Tauri IPC

  **What to do**: Add Tauri commands in Rust to expose: connection state, access code. Add event listeners in frontend.
  **Must NOT do**: Do not poll, use events only

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: []

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T7 | Blocked By: T3, T5

  **References**:
  - Rust: `apps/conduit-next/src-tauri/src/main.rs` (add commands)
  - Frontend: `apps/conduit-next/src/main.ts` (invoke commands, listen events)
  - Manager: `apps/conduit-next/src-tauri/src/manager.rs` (emit events)

  **Acceptance Criteria**:
  - [ ] Rust exposes `get_connection_state()` command
  - [ ] Rust exposes `get_access_code()` command
  - [ ] Rust emits `connection-state-changed` event
  - [ ] Rust emits `access-code-changed` event
  - [ ] Frontend listens to events and updates UI
  - [ ] Frontend calls commands on mount

  **QA Scenarios**:
  ```
  Scenario: IPC bridge works
    Tool: Bash
    Steps: Run app, verify UI shows real data
    Expected: UI updates when backend state changes
    Evidence: .sisyphus/evidence/task-6-ipc.txt
  ```

  **Commit**: YES | Message: `feat(conduit): wire frontend to backend via Tauri IPC` | Files: `apps/conduit-next/src-tauri/src/main.rs`, `apps/conduit-next/src/main.ts`

- [ ] T7. Tray integration with live updates

  **What to do**: Update tray.rs to show current code in tooltip, add menu items
  **Must NOT do**: Do not make tray a secondary UI

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: []

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: T8 | Blocked By: T3, T6

  **References**:
  - File: `apps/conduit-next/src-tauri/src/tray.rs`
  - Tauri API: `TrayIconBuilder`, `set_tooltip`

  **Acceptance Criteria**:
  - [ ] Tray tooltip shows "Mimic Conduit - Code: ######"
  - [ ] Tray menu has "Show" and "Quit" items
  - [ ] Left-click on tray shows window
  - [ ] Tray tooltip updates when code changes

  **QA Scenarios**:
  ```
  Scenario: Tray works
    Tool: Bash
    Steps: Check tray icon, click menu items
    Expected: Show reveals window, Quit exits app
    Evidence: .sisyphus/evidence/task-7-tray.txt
  ```

  **Commit**: YES | Message: `feat(conduit): update tray with live code and menu` | Files: `apps/conduit-next/src-tauri/src/tray.rs`

- [ ] T8. Final styling and QA

  **What to do**: Polish CSS, ensure all states look good, run final build check
  **Must NOT do**: Do not add new features, polish only

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: - | Blocked By: T7

  **References**:
  - Files: All frontend files

  **Acceptance Criteria**:
  - [ ] All 5 connection states render correctly
  - [ ] QR code is scannable
  - [ ] No layout overflow in 360x240
  - [ ] `cargo tauri dev` runs without errors
  - [ ] `bun run build` compiles frontend

  **QA Scenarios**:
  ```
  Scenario: Final QA
    Tool: Playwright
    Steps: Test all states, scan QR
    Expected: All states visible, QR scans to correct URL
    Evidence: .sisyphus/evidence/task-8-final.mp4
  ```

  **Commit**: YES | Message: `style(conduit): polish UI and final QA` | Files: Multiple

## Final Verification Wave (MANDATORY)
- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ Playwright)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy
- Atomic commits per task
- Clear commit messages following conventional commits
- Each commit should be deployable independently

## Success Criteria
1. App launches as frameless 360x240 window
2. No native menu
3. Custom titlebar with working controls
4. Main UI shows status, code, QR
5. Tray shows live code and has menu
6. Frontend receives real data from backend
7. All builds pass
