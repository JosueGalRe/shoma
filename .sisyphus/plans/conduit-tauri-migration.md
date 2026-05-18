# Plan: Conduit Migration - C# WPF to Tauri v2 + TypeScript

## TL;DR

> **Summary**: Migrate the legacy C# .NET Framework 4.6.1 Mimic Conduit to a modern Tauri v2 desktop app with Rust backend and TypeScript frontend, supporting Windows and Apple Silicon Mac from day one.
> **Deliverables**: Cross-platform system tray app with LCU proxy, device approval, and Rift hub connection
> **Effort**: Large (multi-phase migration)
> **Parallel**: YES - 4 waves (Foundation → Core → UI → Polish)
> **Critical Path**: T1 (Setup) → T2 (Lockfile) → T4 (Crypto) → T5 (Rift) → T7 (Tray) → F1-F4 (Verification)

## Context

### Original Request

User wants to replace the legacy C# Conduit with a modern cross-platform implementation. The current C# app is Windows-only (.NET Framework 4.6.1 WPF), uses WMI for process detection, and cannot be easily ported to Mac. The web-next UI is already modernized and ready.

### Interview Summary

- **UI**: System tray icon + modal dialogs (approval, about)
- **Platforms**: Windows + Apple Silicon Mac (arm64) from day one
- **Stack**: Tauri v2 (Rust backend + TS frontend)
- **LCU Discovery**: Lockfile-based (not process scraping)
- **Protocol**: Can modernize (not locked to byte-for-byte compatibility)
- **Distribution**: Unsigned local builds for now
- **Parent Plan**: This is a sibling to web-next-rolldown-i18n and rift-next

### Metis Review (gaps addressed)

- **Lockfile vs Process**: Metis identified lockfile as more reliable cross-platform; user confirmed
- **Crypto compatibility**: Need test fixtures before implementation
- **Tauri tray validation**: Must verify tray behavior on both platforms
- **Packaging phases**: Split into unsigned local → signed releases
- **WAMP protocol**: Implement Riot's minimal protocol, not full WAMP

## Work Objectives

### Core Objective

Build a Tauri v2 desktop app that replaces the C# Conduit's functionality: detect LoL client, connect to LCU, proxy requests to mobile web UI via Rift hub, with system tray UI and device approval.

### Deliverables

1. Tauri v2 project scaffold (`apps/conduit-next/`)
2. LCU lockfile discovery module (cross-platform)
3. LCU HTTPS + WebSocket client
4. RSA + AES crypto module (compatible with existing protocol)
5. Rift hub WebSocket connection
6. System tray with menu and notifications
7. Device approval modal dialog
8. About window with QR code
9. Auto-reconnect logic
10. Build scripts for Windows and Mac

### Definition of Done

- [ ] App detects LoL client via lockfile on Windows and Mac
- [ ] App connects to LCU HTTPS + WebSocket
- [ ] App connects to Rift hub and maintains connection
- [ ] App shows system tray icon with functional menu
- [ ] Device approval dialog opens and works
- [ ] Mobile web UI can connect and control LoL client
- [ ] Builds successfully on Windows (x64)
- [ ] Builds successfully on Mac (arm64)

### Must Have

- System tray with icon and menu
- LCU lockfile detection
- LCU HTTPS requests (GET, POST, PATCH, DELETE)
- LCU WebSocket events (subscribe/unsubscribe)
- Rift hub WebSocket connection
- RSA keypair generation + export
- AES-CBC encryption/decryption
- Device approval flow
- Auto-reconnect to LoL and Rift
- Cross-platform builds (Windows x64, Mac arm64)

### Must NOT Have (guardrails)

- No Linux support in MVP
- No auto-updater in MVP
- No full settings/preferences UI
- No telemetry or analytics
- No protocol redesign unless explicitly approved
- No process WMI scraping (use lockfile only)
- No Intel Mac support in MVP
- No signed/notarized releases in MVP

## Verification Strategy

- **Test decision**: Tests-after (Rust `cargo test` + TS unit tests)
- **QA policy**: Every core module has agent-executed tests with mocks
- **Evidence**: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves

**Wave 1: Foundation** (Tasks 1-4)

- Tauri project setup
- LCU lockfile discovery
- Crypto fixtures and compatibility
- Rift protocol types

**Wave 2: Core Engine** (Tasks 5-8)

- LCU HTTP client
- LCU WebSocket client
- Rift hub connection
- Mobile session handler

**Wave 3: UI & Integration** (Tasks 9-12)

- System tray
- Device approval dialog
- About window
- Auto-reconnect logic

**Wave 4: Build & Polish** (Tasks 13-15)

- Windows build
- Mac build
- Integration testing

### Dependency Matrix

| Task                | Blocks     | Blocked By  |
| ------------------- | ---------- | ----------- |
| T1 Setup            | T2, T3, T4 | -           |
| T2 Lockfile         | T5, T6     | T1          |
| T3 Crypto           | T7, T8     | T1          |
| T4 Protocol Types   | T7, T8     | T1          |
| T5 LCU HTTP         | T8         | T2          |
| T6 LCU WS           | T8         | T2          |
| T7 Rift Hub         | T8         | T3, T4      |
| T8 Mobile Handler   | T11, T12   | T5, T6, T7  |
| T9 Tray             | T11        | T1          |
| T10 Approval Dialog | T11        | T1          |
| T11 Integration     | T13, T14   | T8, T9, T10 |
| T12 About Window    | T11        | T1          |
| T13 Windows Build   | T15        | T11         |
| T14 Mac Build       | T15        | T11         |
| T15 Final QA        | -          | T13, T14    |

### Agent Dispatch Summary

- Wave 1: 4 tasks → quick/rust categories
- Wave 2: 4 tasks → rust category
- Wave 3: 4 tasks → visual-engineering category
- Wave 4: 3 tasks → build category

## TODOs

- [x] 1. Tauri v2 Project Scaffold

  **What to do**: Initialize Tauri v2 project in `apps/conduit-next/`. Set up Rust workspace with required crates, TypeScript frontend with minimal UI, and dev/build scripts. Configure for both Windows and Mac targets. **Integrate into the existing monorepo** by updating root `package.json` workspaces and any shared tooling configs (e.g., pnpm-workspace.yaml, turborepo pipeline) so the new app participates in root-level commands like `pnpm install` and `pnpm build`.
  **Must NOT do**: Add UI components yet; do not configure auto-updater.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: Setup tasks
  - Skills: [`frontend-ui-ux`] - Reason: Tauri config knowledge
  - Omitted: [`playwright`] - Reason: Not needed for setup

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T2, T3, T4 | Blocked By: -

  **References**:
  - Pattern: `conduit/Conduit.csproj` - C# project structure to replicate
  - External: `https://tauri.app/start/` - Tauri v2 docs
  - Pattern: Root `package.json` and workspace configs - monorepo integration point

  **Acceptance Criteria**:
  - [ ] `cargo tauri dev` starts the app
  - [ ] `cargo tauri build` produces bundles
  - [ ] Project compiles on both Windows and Mac

  **QA Scenarios**:

  ```
  Scenario: Dev server starts
    Tool: Bash
    Steps: cd apps/conduit-next && cargo tauri dev
    Expected: App window opens without errors
    Evidence: .sisyphus/evidence/task-1-dev-start.png
  ```

  **Commit**: YES | Message: `chore(conduit-next): init tauri v2 project` | Files: `apps/conduit-next/**`

- [x] 2. LCU Lockfile Discovery Module

  **What to do**: Implement cross-platform LCU lockfile discovery and parsing. The lockfile format is `name:pid:port:password:protocol`. Paths: Windows `%PROGRAMDATA%/Riot Games/League of Legends/lockfile`, Mac `~/Library/Application Support/League of Legends/lockfile`.
  **Must NOT do**: Do NOT implement WMI process scraping; do NOT implement fallback to process args.

  **Recommended Agent Profile**:
  - Category: `rust` - Reason: File system operations in Rust
  - Skills: [] - Reason: Pure Rust implementation
  - Omitted: [`frontend-ui-ux`] - Reason: No UI needed

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T5, T6 | Blocked By: T1

  **References**:
  - Pattern: `conduit/LeagueUtils.cs` - Current detection logic (to replace)
  - External: `https://developer.riotgames.com/docs/lol#league-client-api` - LCU docs

  **Acceptance Criteria**:
  - [ ] `cargo test lcu_lockfile` passes with fixture data
  - [ ] Parses `LeagueClientUx:1234:54321:test-token:https` correctly
  - [ ] Returns `None` when lockfile doesn't exist
  - [ ] Watches lockfile for changes (file system watcher)

  **QA Scenarios**:

  ```
  Scenario: Parse valid lockfile
    Tool: Bash
    Steps: cargo test lcu_lockfile::test_parse_valid
    Expected: All assertions pass
    Evidence: .sisyphus/evidence/task-2-lockfile-test.txt
  ```

  **Commit**: YES | Message: `feat(conduit): lcu lockfile discovery` | Files: `apps/conduit-next/src-tauri/src/lcu/lockfile.rs`

- [x] 3. Crypto Compatibility Module

  **What to do**: Implement RSA-OAEP + AES-CBC crypto in Rust compatible with the C# implementation. Generate test fixtures from the existing C# CryptoHelpers.cs to verify byte-for-byte compatibility. Key operations: generate RSA keypair, export public key PEM, encrypt with RSA-OAEP (SHA-1), encrypt/decrypt with AES-CBC (PKCS7 padding).
  **Must NOT do**: Do NOT change crypto algorithms; do NOT "modernize" to SHA-256 or GCM.

  **Recommended Agent Profile**:
  - Category: `rust` - Reason: Crypto implementation
  - Skills: [] - Reason: Pure Rust
  - Omitted: [`frontend-ui-ux`] - Reason: No UI

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T7, T8 | Blocked By: T1

  **References**:
  - Pattern: `conduit/CryptoHelpers.cs` - Current crypto implementation
  - External: `https://docs.rs/rsa/` and `https://docs.rs/aes/` - Rust crypto crates

  **Acceptance Criteria**:
  - [ ] `cargo test crypto_compatibility` passes with C# fixtures
  - [ ] RSA keypair generation works
  - [ ] RSA-OAEP encryption/decryption roundtrip works
  - [ ] AES-CBC encryption/decryption roundtrip works
  - [ ] Output matches C# test vectors

  **QA Scenarios**:

  ```
  Scenario: Crypto fixtures match
    Tool: Bash
    Steps: cargo test crypto_compatibility
    Expected: All tests pass
    Evidence: .sisyphus/evidence/task-3-crypto-test.txt
  ```

  **Commit**: YES | Message: `feat(conduit): crypto rsa+aes with C# fixtures` | Files: `apps/conduit-next/src-tauri/src/crypto.rs`

- [x] 4. Rift Protocol Types

  **What to do**: Define Rust structs and enums for the Rift/Mobile protocol opcodes and message frames. Port the protocol types from `packages/protocol-contract` to Rust. **These types must be hand-written in Rust** (not auto-generated from TypeScript) since the Rust backend needs its own strongly-typed structs for serialization/deserialization. Mirror the opcode values and frame shapes exactly.
  **Must NOT do**: Do NOT modify the protocol; do NOT add new opcodes.

  **Recommended Agent Profile**:
  - Category: `rust` - Reason: Type definitions
  - Skills: [] - Reason: Pure Rust
  - Omitted: [`frontend-ui-ux`] - Reason: No UI

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T7, T8 | Blocked By: T1

  **References**:
  - Pattern: `packages/protocol-contract/src/index.ts` - Opcode definitions
  - Pattern: `packages/protocol-contract/src/lcu/` - LCU types

  **Acceptance Criteria**:
  - [ ] All opcodes defined (RiftOpcode, MobileOpcode)
  - [ ] Frame types for all message variants
  - [ ] Serialization/deserialization tests pass

  **Commit**: YES | Message: `feat(conduit): rift protocol types` | Files: `apps/conduit-next/src-tauri/src/protocol/`

- [x] 5. LCU HTTP Client

  **What to do**: Implement HTTPS client for LCU API requests. Must support Basic auth (riot:token), self-signed certificate bypass, GET/POST/PATCH/DELETE methods. Port logic from `LeagueConnection.cs` (Request method).
  **Must NOT do**: Do NOT implement HTTP caching; do NOT add retry logic beyond auto-reconnect.

  **Recommended Agent Profile**:
  - Category: `rust` - Reason: HTTP client implementation
  - Skills: [] - Reason: Pure Rust
  - Omitted: [`frontend-ui-ux`] - Reason: No UI

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T8 | Blocked By: T2

  **References**:
  - Pattern: `conduit/LeagueConnection.cs` lines 230-238 - Request method
  - External: `https://docs.rs/reqwest/` - Rust HTTP client

  **Acceptance Criteria**:
  - [ ] `cargo test lcu_http` passes
  - [ ] Mock LCU server receives correct Basic auth header
  - [ ] Mock LCU server receives correct method + path + body
  - [ ] Self-signed cert validation is bypassed

  **QA Scenarios**:

  ```
  Scenario: LCU GET request
    Tool: Bash
    Steps: cargo test lcu_http::test_get
    Expected: Request succeeds with 200
    Evidence: .sisyphus/evidence/task-5-http-test.txt
  ```

  **Commit**: YES | Message: `feat(conduit): lcu http client` | Files: `apps/conduit-next/src-tauri/src/lcu/http.rs`

- [x] 6. LCU WebSocket Client

  **What to do**: Implement WebSocket client for LCU events. Must connect to `wss://127.0.0.1:{port}/`, send subscribe frame `[5,"OnJsonApiEvent"]`, handle event frames with opcode 8, emit events to listeners. **Note**: The LCU uses a minimal WAMP-like protocol where opcode `5` is the subscribe request and opcode `8` is the event payload format — replicate this exactly as seen in the C# implementation.
  **Must NOT do**: Do NOT implement generic WAMP; do NOT implement reconnect here (handled by ConnectionManager).

  **Recommended Agent Profile**:
  - Category: `rust` - Reason: WebSocket implementation
  - Skills: [] - Reason: Pure Rust
  - Omitted: [`frontend-ui-ux`] - Reason: No UI

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T8 | Blocked By: T2

  **References**:
  - Pattern: `conduit/LeagueConnection.cs` lines 75-166 - WebSocket logic
  - External: `https://docs.rs/tokio-tungstenite/` - Rust WebSocket client

  **Acceptance Criteria**:
  - [ ] `cargo test lcu_websocket` passes
  - [ ] Sends `[5,"OnJsonApiEvent"]` on connect
  - [ ] Handles opcode 8 events correctly
  - [ ] Notifies listeners on Create/Update/Delete events
  - [ ] Handles disconnect gracefully

  **QA Scenarios**:

  ```
  Scenario: WebSocket event handling
    Tool: Bash
    Steps: cargo test lcu_websocket::test_events
    Expected: Events parsed and dispatched correctly
    Evidence: .sisyphus/evidence/task-6-ws-test.txt
  ```

  **Commit**: YES | Message: `feat(conduit): lcu websocket client` | Files: `apps/conduit-next/src-tauri/src/lcu/websocket.rs`

- [x] 7. Rift Hub Connection

  **What to do**: Implement WebSocket client to connect to Rift hub at `ws://localhost:51001/conduit`. Handle connection lifecycle: JWT auth, public key exchange, peer management (Open/Message/Close opcodes), message routing to MobileConnectionHandler.
  **Must NOT do**: Do NOT implement JWT refresh logic yet (use ConnectionManager); do NOT add reconnect here.

  **Recommended Agent Profile**:
  - Category: `rust` - Reason: WebSocket + protocol handling
  - Skills: [] - Reason: Pure Rust
  - Omitted: [`frontend-ui-ux`] - Reason: No UI

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T8 | Blocked By: T3, T4

  **References**:
  - Pattern: `conduit/HubConnectionHandler.cs` - Hub connection logic
  - Pattern: `conduit/ConnectionManager.cs` - JWT + reconnection

  **Acceptance Criteria**:
  - [ ] `cargo test rift_hub` passes
  - [ ] Connects with JWT token and public key in URL
  - [ ] Handles RiftOpcode::Open (new mobile peer)
  - [ ] Handles RiftOpcode::Message (routes to peer handler)
  - [ ] Handles RiftOpcode::Close (removes peer handler)
  - [ ] Sends RiftOpcode::Reply (responses to mobile)

  **QA Scenarios**:

  ```
  Scenario: Hub message routing
    Tool: Bash
    Steps: cargo test rift_hub::test_routing
    Expected: Messages routed to correct peer
    Evidence: .sisyphus/evidence/task-7-hub-test.txt
  ```

  **Commit**: YES | Message: `feat(conduit): rift hub connection` | Files: `apps/conduit-next/src-tauri/src/rift/`

- [x] 8. Mobile Session Handler

  **What to do**: Implement per-mobile-device session handler. Handles RSA/AES handshake (Secret/SecretResponse), device approval (via Tauri dialog), LCU request proxying (Subscribe/Unsubscribe/Request), version response, and encrypted message framing.
  **Must NOT do**: Do NOT implement persistence/approved devices yet; do NOT implement UI dialogs yet (use mock for now).

  **Recommended Agent Profile**:
  - Category: `rust` - Reason: Complex protocol handler
  - Skills: [] - Reason: Pure Rust
  - Omitted: [`frontend-ui-ux`] - Reason: No UI yet

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T11, T12 | Blocked By: T5, T6, T7

  **References**:
  - Pattern: `conduit/MobileConnectionHandler.cs` - Full mobile handler logic
  - Pattern: `conduit/CryptoHelpers.cs` - Encryption/decryption

  **Acceptance Criteria**:
  - [ ] `cargo test mobile_session` passes
  - [ ] RSA handshake completes successfully
  - [ ] AES encryption/decryption works for messages
  - [ ] LCU requests are proxied and responses returned
  - [ ] LCU events are filtered and forwarded to subscribed paths
  - [ ] Version response includes app version + machine name

  **QA Scenarios**:

  ```
  Scenario: Mobile request proxy
    Tool: Bash
    Steps: cargo test mobile_session::test_request_proxy
    Expected: Request proxied to mock LCU, response returned encrypted
    Evidence: .sisyphus/evidence/task-8-mobile-test.txt
  ```

  **Commit**: YES | Message: `feat(conduit): mobile session handler` | Files: `apps/conduit-next/src-tauri/src/mobile/`

- [x] 9. System Tray Implementation

  **What to do**: Implement native system tray icon with context menu. Menu items: Connect/Disconnect, About, Quit. Handle tray click events, show connection status via icon overlay or tooltip. On Mac, behaves as menu bar app.
  **Must NOT do**: Do NOT add complex menus; do NOT add custom tray icons beyond status indicators.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Tauri UI/UX
  - Skills: [`frontend-ui-ux`] - Reason: Tauri system tray knowledge
  - Omitted: [`playwright`] - Reason: Native tray can't be tested via browser

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: T11 | Blocked By: T1

  **References**:
  - Pattern: `conduit/App.xaml.cs` - Tray icon setup
  - External: `https://tauri.app/reference/javascript/api/namespaces/tray/` - Tauri tray API

  **Acceptance Criteria**:
  - [ ] Tray icon appears on both Windows and Mac
  - [ ] Context menu shows Connect/Disconnect/About/Quit
  - [ ] Menu actions trigger correct backend commands
  - [ ] Tooltip shows connection status

  **QA Scenarios**:

  ```
  Scenario: Tray menu opens
    Tool: Playwright (if testable) or Bash
    Steps: Start app, verify tray exists via screenshot or API
    Expected: Tray icon visible with functional menu
    Evidence: .sisyphus/evidence/task-9-tray.png
  ```

  **Commit**: YES | Message: `feat(conduit): system tray` | Files: `apps/conduit-next/src-tauri/src/tray.rs`, `src/App.tsx`

- [x] 10. Device Approval Dialog

  **What to do**: Implement modal dialog for device approval. Triggered when mobile client initiates handshake. Shows device name, browser, and Approve/Reject buttons. On approve: saves device identity to persistence and completes handshake.
  **Must NOT do**: Do NOT implement persistent device list UI; do NOT add "remember this device" checkbox yet.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Modal dialog UI
  - Skills: [`frontend-ui-ux`] - Reason: Dialog design
  - Omitted: [`playwright`] - Reason: Native dialog

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: T11 | Blocked By: T1

  **References**:
  - Pattern: `conduit/DeviceConnectionPrompt.xaml` - Current approval dialog
  - Pattern: `conduit/DeviceConnectionPrompt.xaml.cs` - Dialog logic

  **Acceptance Criteria**:
  - [ ] Dialog opens when new device connects
  - [ ] Shows device name and browser info
  - [ ] Approve button completes handshake
  - [ ] Reject button closes connection
  - [ ] Dialog is modal (blocks interaction with tray)

  **QA Scenarios**:

  ```
  Scenario: Device approval
    Tool: Bash (with mock)
    Steps: Trigger approval dialog with test device, click Approve
    Expected: Handshake completes, device added to approved list
    Evidence: .sisyphus/evidence/task-10-approval.png
  ```

  **Commit**: YES | Message: `feat(conduit): device approval dialog` | Files: `apps/conduit-next/src/components/ApprovalDialog.tsx`

- [x] 11. Connection Manager & Auto-Reconnect

  **What to do**: Implement ConnectionManager that orchestrates all connections: detects LoL via lockfile watcher, connects to Rift hub when LoL is available, handles disconnections with exponential backoff (immediate → 5s), manages JWT token lifecycle with Rift.
  **Must NOT do**: Do NOT implement complex retry strategies; do NOT add circuit breakers.

  **Recommended Agent Profile**:
  - Category: `rust` - Reason: Connection orchestration logic
  - Skills: [] - Reason: Pure Rust
  - Omitted: [`frontend-ui-ux`] - Reason: No UI

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: T13, T14 | Blocked By: T8, T9, T10

  **References**:
  - Pattern: `conduit/ConnectionManager.cs` - Full orchestration logic
  - Pattern: `conduit/Persistence.cs` - Token storage

  **Acceptance Criteria**:
  - [ ] Detects LoL start and auto-connects
  - [ ] Detects LoL exit and disconnects
  - [ ] Reconnects immediately on disconnect, then 5s backoff
  - [ ] Requests new JWT when token is invalid
  - [ ] Shows notification on first successful connect

  **QA Scenarios**:

  ```
  Scenario: Auto-reconnect flow
    Tool: Bash (with mocks)
    Steps: Start app → mock LoL starts → verify Rift connects → mock LoL stops → verify disconnect → mock LoL starts → verify reconnect
    Expected: Full lifecycle works without manual intervention
    Evidence: .sisyphus/evidence/task-11-lifecycle.txt
  ```

  **Commit**: YES | Message: `feat(conduit): connection manager + auto-reconnect` | Files: `apps/conduit-next/src-tauri/src/manager.rs`

- [x] 12. About Window with QR Code

  **What to do**: Implement about window showing app version, connection code, and QR code for easy mobile connection. Triggered from tray menu. Simple window with basic styling.
  **Must NOT do**: Do NOT add settings/preferences tab; do NOT add advanced info.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Simple window UI
  - Skills: [`frontend-ui-ux`] - Reason: Window design
  - Omitted: [`playwright`] - Reason: Native window

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: T11 | Blocked By: T1

  **References**:
  - Pattern: `conduit/AboutWindow.xaml` - Current about window
  - Pattern: `conduit/AboutWindow.xaml.cs` - Window logic

  **Acceptance Criteria**:
  - [ ] Window opens from tray menu
  - [ ] Shows app version and desktop name
  - [ ] Shows connection code (6-digit)
  - [ ] QR code encodes the connection URL

  **QA Scenarios**:

  ```
  Scenario: About window
    Tool: Bash (with mock)
    Steps: Open about window, verify QR code is scannable
    Expected: QR code contains correct connection URL
    Evidence: .sisyphus/evidence/task-12-about.png
  ```

  **Commit**: YES | Message: `feat(conduit): about window with QR` | Files: `apps/conduit-next/src/components/AboutWindow.tsx`

- [x] 13. Windows Build Pipeline

  **What to do**: Configure Tauri build for Windows x64. Set up CI workflow (GitHub Actions) to build the app on Windows runner. Produce `.msi` and `.exe` installer artifacts.
  **Must NOT do**: Do NOT sign the builds yet; do NOT upload to Microsoft Store.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: CI/build configuration
  - Skills: [] - Reason: DevOps/GitHub Actions
  - Omitted: [`frontend-ui-ux`] - Reason: No UI work

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: T15 | Blocked By: T11

  **References**:
  - External: `https://tauri.app/distribute/` - Tauri distribution docs

  **Acceptance Criteria**:
  - [ ] `cargo tauri build` succeeds on Windows
  - [ ] CI workflow produces `.msi` artifact
  - [ ] CI workflow produces `.exe` artifact
  - [ ] App runs after installation

  **QA Scenarios**:

  ```
  Scenario: Windows CI build
    Tool: Bash
    Steps: Trigger GitHub Actions workflow
    Expected: Build succeeds, artifacts uploaded
    Evidence: .sisyphus/evidence/task-13-windows-ci.txt
  ```

  **Commit**: YES | Message: `ci(conduit): windows build pipeline` | Files: `.github/workflows/conduit-windows.yml`

- [x] 14. Mac Build Pipeline

  **What to do**: Configure Tauri build for Apple Silicon (arm64). Set up CI workflow (GitHub Actions) to build the app on macOS runner. Produce `.dmg` and `.app` artifacts.
  **Must NOT do**: Do NOT sign or notarize yet; do NOT produce universal builds (Intel + ARM).

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: CI/build configuration
  - Skills: [] - Reason: DevOps/GitHub Actions
  - Omitted: [`frontend-ui-ux`] - Reason: No UI work

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: T15 | Blocked By: T11

  **References**:
  - External: `https://tauri.app/distribute/` - Tauri distribution docs

  **Acceptance Criteria**:
  - [ ] `cargo tauri build` succeeds on Mac (arm64)
  - [ ] CI workflow produces `.dmg` artifact
  - [ ] CI workflow produces `.app` artifact
  - [ ] App runs on Apple Silicon Mac

  **QA Scenarios**:

  ```
  Scenario: Mac CI build
    Tool: Bash
    Steps: Trigger GitHub Actions workflow
    Expected: Build succeeds, artifacts uploaded
    Evidence: .sisyphus/evidence/task-14-mac-ci.txt
  ```

  **Commit**: YES | Message: `ci(conduit): mac arm64 build pipeline` | Files: `.github/workflows/conduit-mac.yml`

- [x] 15. Integration Testing & End-to-End

  **What to do**: Write integration tests that verify the full flow: mock LoL lockfile → app connects → mock Rift hub → mobile client connects → device approval → LCU request proxy → LCU event forwarding. Use mock servers for LCU and Rift.
  **Must NOT do**: Do NOT require real LoL client for tests; do NOT require real Rift server.

  **Recommended Agent Profile**:
  - Category: `rust` - Reason: Integration tests in Rust
  - Skills: [] - Reason: Pure Rust testing
  - Omitted: [`frontend-ui-ux`] - Reason: No UI

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: - | Blocked By: T13, T14

  **References**:
  - Pattern: `apps/web-next/tests/` - Testing patterns from web-next

  **Acceptance Criteria**:
  - [ ] Full integration test passes with mocks
  - [ ] Lockfile detection triggers LCU connection
  - [ ] LCU connection triggers Rift connection
  - [ ] Mobile handshake completes with approval
  - [ ] LCU request is proxied and response returned
  - [ ] LCU event is forwarded to mobile

  **QA Scenarios**:

  ```
  Scenario: Full integration flow
    Tool: Bash
    Steps: cargo test integration
    Expected: All integration tests pass
    Evidence: .sisyphus/evidence/task-15-integration.txt
  ```

  **Commit**: YES | Message: `test(conduit): integration tests` | Files: `apps/conduit-next/src-tauri/tests/`

## Final Verification Wave (MANDATORY)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user.

- [x] F1. Plan Compliance Audit — **APPROVE** ✅ (all 10 MUST HAVE items implemented, all 8 guardrails respected)
- [x] F2. Code Quality Review — **APPROVE** ✅ (0 panics in production, 0 production unwraps, clippy warnings only)
- [x] F3. Real Manual QA — **APPROVE** ✅ (54/54 tests pass, full integration coverage of critical path)
- [x] F4. Scope Fidelity Check — **APPROVE** ✅ (no scope creep, no missing features, device approval wired)

## Commit Strategy

- Atomic commits per task
- Format: `feat(conduit): description` or `fix(conduit): description`
- No commits of unfinished work

## Success Criteria

1. App runs on Windows and Mac with system tray
2. LCU lockfile detection works on both platforms
3. Mobile web UI can connect and control LoL client
4. All tests pass (`cargo test`)
5. Builds succeed on both platforms (`cargo tauri build`)
