# Mimic Web-Next Migration & Redesign Master Plan

## TL;DR

> **Summary**: Validate rift-next/conduit-next integration against live LoL, build horizontal LCU infrastructure in web-next, implement full feature parity (queue, ready check, invites, champ select with modern LoL mechanics), then redesign web-next using lazyweb research.
> **Deliverables**: Validated relay layer, complete web-next feature parity, modernized UX redesign, E2E test suite against real LoL client.
> **Effort**: XL
> **Parallel**: YES - 7 waves
> **Critical Path**: Validate rift-next (W1) → LCU Infrastructure (W2) → Queue/Ready Check/Invites (W3) → Champ Select (W4-W5) → Redesign (W6) → Final Verification (W7)

## Context

### Original Request

Migrate Mimic from legacy stack to next-gen across all three components (web-next, conduit-next, rift-next). Review legacy features at https://mimic.lol/faq, audit current web-next implementation, research modern LCU API for gaps, implement missing features, then redesign web-next functionality and UX using lazyweb research. Use oxlint, oxfmt, and tsc as quality gates. Add useful tests. Use Playwright MCP for real LoL client access (code 426729).

### Interview Summary

- **Product**: Mimic - remote League of Legends client controller via phone browser
- **Stack**: web-next (React 19 + TanStack Router + Tailwind v4), conduit-next (Tauri, functional complete), rift-next (Bun + Elysia, status uncertain)
- **Strategy**: Validate rift-first → horizontal layers (infra first, UI second) → parity → redesign
- **Legacy features to port**: lobby (partially done), queue, ready check, invites, champ select (pick/ban/runes/summoners/skins/ARAM)
- **Modern LoL adaptations**: ARAM now uses cards (not dice), runes are 3 presets + editable, summoners are role-locked (e.g., smite only jungle)
- **Testing**: Playwright MCP E2E against live LoL client, oxlint + oxfmt + tsc gates, Bun test for unit/integration
- **Redesign scope**: web-next only, inspired by remote gaming apps + LoL utilities
- **Priority**: quality over speed, no deadline, solo contributor

### Metis Review (gaps addressed)

- **Guardrail**: Hard gate - no redesign until all parity tests pass
- **Guardrail**: MUST NOT treat legacy Vue behavior as authoritative for current LoL behavior
- **Guardrail**: MUST NOT build generic LCU SDK abstractions unless required by 2+ features
- **Risk**: Unvalidated rift-next blocks everything → dedicated smoke-validation phase
- **Risk**: Feature parity scope creep → parity matrix required
- **Risk**: Live-client E2E fragility → layered tests (unit → mocked integration → live smoke)
- **Risk**: Modern LoL mechanics misunderstood → live LCU observation before implementing ARAM/runes/summoners
- **Assumption validated**: web-next lobby scaffolding may need refactoring → inspect before building on it

## Work Objectives

### Core Objective

Achieve complete feature parity in web-next with legacy Mimic web app, adapted to current League of Legends client behavior, with a validated rift-next backend, then deliver a redesigned UX based on lazyweb research.

### Deliverables

1. Validated rift-next + conduit-next integration against live LoL client
2. Feature parity matrix (legacy behavior × modern LoL behavior × implementation status)
3. Horizontal LCU infrastructure layer in web-next (typed observers, requests, state management)
4. Complete feature implementations: queue, ready check, invites, champ select (pick/ban/runas/summoners/skins/ARAM cards)
5. Redesigned web-next UX (lazyweb-informed)
6. E2E test suite with Playwright MCP against real LoL client
7. Quality gate compliance (oxlint, oxfmt, tsc green)

### Definition of Done (verifiable conditions with commands)

- `bun run lint:ox` passes with zero errors
- `bun run fmt:check` passes
- `bun run --filter @mimic/web-next build` passes (tsc green)
- `bun run --filter @mimic/web-next test` passes
- Playwright E2E scenarios pass against live LoL client (code 426729)
- All legacy features have passing happy-path + failure-path tests
- Redesign preserves all parity functionality

### Must Have

- rift-next smoke validation with real conduit-next + LoL
- LCU infrastructure layer (observer pattern, request/response, typed state)
- Queue management (select, start, cancel)
- Ready check (accept, decline, timeout)
- Invites (receive, accept, decline)
- Champ select: hover, pick, ban
- Champ select: rune presets (3) + editing
- Champ select: role-locked summoner spells
- Champ select: skin selection
- Champ select: ARAM card behavior (modern)
- End-to-end encryption handshake preserved
- Mobile-first responsive design
- PWA behavior maintained
- All tests automated (no manual QA gates)

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)

- MUST NOT redesign before parity is complete and tested
- MUST NOT port legacy Vue behavior 1:1 where current LoL behavior differs
- MUST NOT add new product features beyond legacy parity
- MUST NOT redesign conduit-next or rift-next
- MUST NOT implement speculative LoL APIs without live observation
- MUST NOT build generic LCU SDK abstractions unless used by 2+ features
- MUST NOT include desktop-first redesign work
- MUST NOT leave any `any` types (oxlint enforces `no-explicit-any`)
- MUST NOT use `console.log` for debugging (use structured logging)
- MUST NOT ignore websocket reconnect / stale state / error boundaries

## Verification Strategy

> ZERO HUMAN INTERVENTION - all verification is agent-executed.

- **Test decision**: Tests-after for infrastructure, TDD for features (RED-GREEN-REFACTOR for LCU integrations)
- **Framework**: Bun native test for unit/integration, Playwright for E2E
- **QA policy**: Every task has agent-executed scenarios (happy + failure paths)
- **Evidence**: `.sisyphus/evidence/task-{N}-{slug}.{ext}`
- **Quality gates**:
  - oxlint: `bun run lint:ox`
  - oxfmt: `bun run fmt:check`
  - tsc: `bun run --filter @mimic/web-next build`
  - tests: `bun run --filter @mimic/web-next test`
- **Live testing**: Playwright MCP against real LoL client with code 426729 (conduit-next running locally)

## Execution Strategy

### Parallel Execution Waves

> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.

**Wave 1: Foundation & Validation**
Validate the entire backend pipeline (rift-next + conduit-next + LoL) before building web-next features.

**Wave 2: LCU Infrastructure**
Build the horizontal layer: typed LCU client, observer pattern, request/response handling, state management.

**Wave 3: Core Gameflow Features**
Queue, ready check, invites - the non-champ-select gameplay flows.

**Wave 4: Champ Select Foundation**
Basic champ select: pick/ban/bench/hover, gameflow state transitions.

**Wave 5: Champ Select Advanced**
Runes, summoners, skins, ARAM cards - modern LoL mechanics.

**Wave 6: Redesign**
Lazyweb-informed UX redesign of web-next (post-parity gate).

**Wave 7: Final Verification**
Consolidated testing, quality gates, and sign-off.

### Dependency Matrix (full, all tasks)

| Task                            | Blocks                     | Blocked By   |
| ------------------------------- | -------------------------- | ------------ |
| W1-T1 (rift smoke)              | W1-T2, W2-T1               | -            |
| W1-T2 (LCU observation)         | W2-T2, W2-T3, W4-T3, W5-T1 | W1-T1        |
| W2-T1 (transport infra)         | W2-T2, W2-T3, W3-T1, W4-T1 | W1-T1        |
| W2-T2 (observer pattern)        | W3-T1, W4-T1, W4-T2        | W2-T1        |
| W2-T3 (state management)        | W3-T1, W4-T1, W4-T2, W5-T1 | W2-T1        |
| W3-T1 (queue)                   | W3-T2                      | W2-T2, W2-T3 |
| W3-T2 (ready check)             | W3-T3                      | W2-T2, W2-T3 |
| W3-T3 (invites)                 | W4-T1                      | W2-T2, W2-T3 |
| W4-T1 (champ select base)       | W4-T2, W4-T3               | W3-T3        |
| W4-T2 (gameflow transitions)    | W4-T3                      | W4-T1        |
| W4-T3 (pick/ban/bench)          | W5-T1                      | W1-T2, W4-T2 |
| W5-T1 (runes)                   | W5-T2                      | W4-T3, W1-T2 |
| W5-T2 (summoners + skins)       | W5-T3                      | W4-T3, W1-T2 |
| W5-T3 (ARAM cards)              | W6-T1                      | W4-T3, W1-T2 |
| W6-T1 (lazyweb research)        | W6-T2                      | W5-T3        |
| W6-T2 (redesign implementation) | W7-T1                      | W6-T1        |
| W7-T1 (final verification)      | -                          | W6-T2        |

### Agent Dispatch Summary (wave → task count → categories)

| Wave | Tasks | Categories                   | Notes                                |
| ---- | ----- | ---------------------------- | ------------------------------------ |
| W1   | 2     | deep, unspecified-high       | Validation requires real client      |
| W2   | 3     | deep, quick                  | Infrastructure, careful architecture |
| W3   | 3     | unspecified-high, quick      | Feature implementation               |
| W4   | 3     | unspecified-high, quick      | Feature implementation               |
| W5   | 3     | unspecified-high, quick      | Feature implementation               |
| W6   | 2     | visual-engineering, artistry | Design + implementation              |
| W7   | 1     | unspecified-high             | Verification                         |

## TODOs

> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 1. Rift-Next Smoke Validation

  **What to do**:
  1. Ensure rift-next is running locally (`bun run --filter @mimic/rift-next dev` or production build)
  2. Verify conduit-next connects to rift-next and obtains JWT + 6-digit code
  3. Verify LCU detection works (conduit-next detects LoL client, extracts lockfile)
  4. Verify websocket tunnel: mobile (web-next) can connect via `/mobile?code=...` and complete handshake
  5. Verify encrypted messaging: send a test message through the tunnel
  6. Document any parity deltas in `.sisyphus/evidence/task-1-rift-smoke-deltas.md`

  **Must NOT do**:
  - Do NOT modify rift-next or conduit-next logic unless blocking defects found
  - Do NOT proceed to web-next feature work if this task fails

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: requires understanding the full pipeline
  - Skills: `[]` - no special skills needed, but needs careful execution
  - Omitted: `visual-engineering` - not needed for validation

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: [2] | Blocked By: []

  **References**:
  - Config: `apps/rift-next/package.json` - startup commands
  - Config: `apps/conduit-next/package.json` - startup commands
  - Protocol: `packages/protocol-contract/src/lcu/lcu-paths.ts` - LCU endpoints
  - Protocol: `packages/protocol-contract/src/lcu/lcu-types.ts` - shared types
  - Legacy ref: `rift/src/sockets.ts` - websocket broker semantics
  - Legacy ref: `conduit/ConnectionManager.cs` - hub connection flow

  **Acceptance Criteria**:
  - [ ] `curl http://localhost:PORT/` returns health response (resolve actual port from rift-next config)
  - [ ] Conduit-next obtains JWT token from `/register`
  - [ ] Conduit-next connects to `/conduit` websocket successfully
  - [ ] Web-next connects to `/mobile?code=426729` and completes handshake
  - [ ] Encrypted test message round-trips successfully
  - [ ] All findings documented in evidence file

  **QA Scenarios**:

  ```
  Scenario: Happy path - full pipeline
    Tool: Bash + Playwright MCP
    Steps:
      1. Start rift-next: `bun run --filter @mimic/rift-next dev`
      2. Start conduit-next (already running per user)
      3. Open web-next in Playwright, navigate to connect page
      4. Enter code 426729, click connect
      5. Approve device in conduit-next if prompted
    Expected: Web-next shows "connected" state, no console errors
    Evidence: .sisyphus/evidence/task-1-rift-smoke-happy.png

  Scenario: Failure - rift-next not running
    Tool: Bash
    Steps:
      1. Stop rift-next
      2. Attempt conduit-next registration
    Expected: Connection refused error, graceful failure in conduit-next logs
    Evidence: .sisyphus/evidence/task-1-rift-smoke-error.log
  ```

  **Commit**: NO | Message: N/A | Files: N/A (validation only)

- [x] 2. Live LCU Observation & Feature Parity Matrix

  **What to do**:
  1. With conduit-next connected to live LoL client, observe LCU websocket events for all gameflow states
  2. Document current API endpoints and payloads for:
     - Lobby (`/lol-lobby/v2/lobby`, `/lol-lobby/v2/party`),
     - Queue (`/lol-gameflow/v1/gameflow-phase`, `/lol-matchmaking/v1/search`),
     - Ready check (`/lol-gameflow/v1/gameflow-phase`, `/lol-matchmaking/v1/ready-check`),
     - Invites (`/lol-lobby/v2/received-invitations`),
     - Champ select (`/lol-champ-select/v1/session`, `/lol-champ-select/v1/pickable-champion-ids`, `/lol-champ-select/v1/bannable-champion-ids`),
     - Runes (`/lol-perks/v1/currentpage`, `/lol-perks/v1/pages`),
     - Summoners (`/lol-champ-select/v1/session` → `spell1Id`, `spell2Id`),
     - Skins (`/lol-champ-select/v1/session` → `skinId`),
     - ARAM (`/lol-champ-select/v1/session` → bench/card data)
  3. Create parity matrix: legacy behavior × modern LoL behavior × LCU endpoint × implementation status
  4. Identify any endpoints that changed or no longer exist

  **Must NOT do**:
  - Do NOT modify any code during observation
  - Do NOT assume legacy endpoint paths work unchanged

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: requires deep LCU API knowledge
  - Skills: `[]` - careful observation and documentation
  - Omitted: `quick` - this is research, not implementation

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: [W4-T3, W5-T1, W5-T2, W5-T3] | Blocked By: [1]

  **References**:
  - LCU docs: `https://developer.riotgames.com/league-client-apis.html`
  - Community swagger: `https://lcu.kebs.dev/`
  - LCU wrapper reference (C#): `https://github.com/BlossomiShymae/Briar` - Briar wrapper for League Client API, useful for endpoint patterns and auth handling
  - Legacy observer: `web/src/components/root/root.ts` - observe/request patterns
  - Legacy lobby: `web/src/components/lobby/lobby.ts`
  - Legacy champ select: `web/src/components/champ-select/champ-select.ts`

  **Acceptance Criteria**:
  - [ ] Parity matrix document exists at `.sisyphus/evidence/task-2-parity-matrix.md`
  - [ ] Every legacy feature has mapped modern LCU endpoint(s)
  - [ ] Modern LoL changes documented (ARAM cards, rune presets, role-locked summoners)
  - [ ] Unknown/discrepant endpoints flagged for further investigation

  **QA Scenarios**:

  ```
  Scenario: Happy path - complete observation
    Tool: Playwright MCP + Bash
    Steps:
      1. Connect web-next to live LoL via conduit-next
      2. Navigate through each gameflow state (lobby → queue → ready check → champ select)
      3. Capture websocket events and HTTP responses
    Expected: All states produce observable LCU events with documented payloads
    Evidence: .sisyphus/evidence/task-2-lcu-observation.log

  Scenario: Edge case - LoL client closed mid-observation
    Tool: Bash
    Steps:
      1. Close LoL client while observing
      2. Document disconnect behavior and reconneсt sequence
    Expected: Clear documentation of disconnect/reconnect events
    Evidence: .sisyphus/evidence/task-2-lcu-disconnect.log
  ```

  **Commit**: NO | Message: N/A | Files: N/A (research only)

- [x] 3. LCU Transport Infrastructure Layer

  **What to do**:
  1. Inspect existing `apps/web-next/src/core/rift/` - determine what's reusable vs needs refactoring
  2. Add `test:e2e` script to `apps/web-next/package.json`: `"test:e2e": "playwright test"`
  3. Build framework-agnostic LCU transport module:
     - `createLCUClient()` - manages websocket connection to rift-next
     - `observe(path, handler)` - subscribes to LCU path regex, returns unsubscribe
     - `request(path, method, body)` - sends one-off LCU requests with promise-based response
     - `onDisconnect / onReconnect` callbacks
  4. Implement typed request/response wrappers using `packages/protocol-contract` types
  5. Add websocket reconnect logic with exponential backoff
  6. Add error handling for: connection refused, timeout, malformed response, LCU not available

  **Must NOT do**:
  - Do NOT couple transport to React lifecycle (keep it framework-agnostic)
  - Do NOT implement feature-specific logic here (only generic request/observer)

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: critical architecture foundation
  - Skills: `[]` - strong TypeScript and websocket knowledge required
  - Omitted: `visual-engineering` - no UI work

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [4, 5, 6, 7, 8, 9] | Blocked By: [1]

  **References**:
  - Existing transport: `apps/web-next/src/core/rift/rift-lcu-transport.ts`
  - Existing client: `apps/web-next/src/core/rift/lcu-client.ts`
  - Protocol types: `packages/protocol-contract/src/lcu/lcu-types.ts`
  - Legacy transport: `web/src/components/root/rift-socket.ts`
  - Legacy protocol: `web/src/components/root/root.ts`

  **Acceptance Criteria**:
  - [ ] `test:e2e` script added to `apps/web-next/package.json` and runs successfully
  - [ ] `bun test` passes for transport module
  - [ ] `observe()` correctly subscribes and dispatches events
  - [ ] `request()` returns typed promises with correct error handling
  - [ ] Reconnect logic tested with simulated disconnect
  - [ ] oxlint + oxfmt + tsc green

  **QA Scenarios**:

  ```
  Scenario: Happy path - request/response
    Tool: Bun test
    Steps:
      1. Mock websocket server
      2. Call `request('/lol-summoner/v1/current-summoner', 'GET')`
      3. Mock response with valid payload
    Expected: Promise resolves with typed data
    Evidence: .sisyphus/evidence/task-3-transport-happy.test.log

  Scenario: Failure - websocket disconnect
    Tool: Bun test
    Steps:
      1. Establish connection
      2. Force close websocket
      3. Attempt request during disconnect
    Expected: Promise rejects with specific error, reconnect attempts begin
    Evidence: .sisyphus/evidence/task-3-transport-error.test.log
  ```

  **Commit**: YES | Message: `feat(web-next): add lcu transport infrastructure` | Files: `apps/web-next/src/core/rift/*`, `apps/web-next/tests/integration/lcu-client.test.ts`, `apps/web-next/package.json`

- [x] 4. Typed LCU Observer Pattern

  **What to do**:
  1. Build typed observer registry on top of transport layer
  2. Support path patterns: exact (`/lol-lobby/v2/lobby`), wildcard (`/lol-champ-select/v1/session/*`)
  3. Implement event deduplication and throttling for high-frequency endpoints
  4. Add lifecycle hooks: `onSubscribe`, `onUnsubscribe`, `onError`
  5. Create typed hooks for React: `useLCUObserver(path)`, `useLCURequest()`
  6. Ensure memory leaks are prevented (unsubscribe on unmount)

  **Must NOT do**:
  - Do NOT implement feature stores here (just the observer mechanism)

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: reactive state architecture
  - Skills: `[]` - React + TypeScript expertise
  - Omitted: `visual-engineering` - no UI components

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [6, 7, 8, 9] | Blocked By: [3]

  **References**:
  - Legacy observer: `web/src/components/root/root.ts` lines 98-143
  - React Query: `apps/web-next/src/core/query/` - existing query client setup
  - Zustand: `apps/web-next/src/` - check for existing store patterns

  **Acceptance Criteria**:
  - [ ] `useLCUObserver` hook correctly subscribes/unsubscribes
  - [ ] Memory leak test passes (unmount → no active subscriptions)
  - [ ] Event deduplication works for rapid updates
  - [ ] oxlint + oxfmt + tsc green

  **QA Scenarios**:

  ```
  Scenario: Happy path - observer subscription
    Tool: Bun test + React Testing Library
    Steps:
      1. Render component with `useLCUObserver('/test/path')`
      2. Emit mock event
      3. Unmount component
    Expected: Hook receives event, subscription cleaned up after unmount
    Evidence: .sisyphus/evidence/task-4-observer-happy.test.log

  Scenario: Failure - memory leak
    Tool: Bun test
    Steps:
      1. Mount/unmount component 100 times
      2. Check active subscription count
    Expected: Zero active subscriptions after all unmounts
    Evidence: .sisyphus/evidence/task-4-observer-memory.test.log
  ```

  **Commit**: YES | Message: `feat(web-next): add typed lcu observer hooks` | Files: `apps/web-next/src/core/rift/observer.ts`, `apps/web-next/src/core/rift/hooks.ts`, `apps/web-next/tests/unit/observer.test.ts`

- [x] 5. Feature State Management & Gameflow Store

  **What to do**:
  1. Design Zustand store structure for gameflow state machine:
     - `disconnected` → `connecting` → `connected` → `lobby` → `queue` → `readyCheck` → `champSelect` → `inGame` → `postGame`
  2. Implement transitions driven by LCU `gameflow-phase` events
  3. Add derived state selectors: `isInQueue`, `canInvite`, `isChampSelectActive`
  4. Integrate with React Query for cache invalidation on state change
  5. Add optimistic updates for user actions (queue start, ready check accept)
  6. Implement error recovery: if state transition fails, refetch from LCU

  **Must NOT do**:
  - Do NOT implement UI components here (just state logic)
  - Do NOT add feature-specific state (queue details, champ select data) - that's in feature stores

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: state machine architecture
  - Skills: `[]` - state management expertise
  - Omitted: `visual-engineering` - no UI work

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [6, 7, 8, 9] | Blocked By: [3]

  **References**:
  - Legacy gameflow: `web/src/components/root/root.ts` - phase detection
  - Zustand: `apps/web-next/package.json` - already installed
  - React Query: `apps/web-next/package.json` - already installed
  - LCU gameflow: `/lol-gameflow/v1/gameflow-phase`

  **Acceptance Criteria**:
  - [ ] Store correctly transitions through all gameflow phases
  - [ ] Derived selectors return correct boolean states
  - [ ] Optimistic updates roll back on LCU rejection
  - [ ] oxlint + oxfmt + tsc green

  **QA Scenarios**:

  ```
  Scenario: Happy path - state transitions
    Tool: Bun test
    Steps:
      1. Initialize store in 'lobby' state
      2. Emit gameflow-phase 'Matchmaking'
      3. Emit gameflow-phase 'ReadyCheck'
      4. Emit gameflow-phase 'ChampSelect'
    Expected: Store transitions correctly, derived selectors update
    Evidence: .sisyphus/evidence/task-5-state-happy.test.log

  Scenario: Failure - LCU rejects optimistic update
    Tool: Bun test
    Steps:
      1. Optimistically transition to 'queue'
      2. Mock LCU rejection response
      3. Verify rollback
    Expected: Store rolls back to previous state with error flag
    Evidence: .sisyphus/evidence/task-5-state-error.test.log
  ```

  **Commit**: YES | Message: `feat(web-next): add gameflow state store` | Files: `apps/web-next/src/core/state/gameflow-store.ts`, `apps/web-next/tests/unit/gameflow-store.test.ts`

- [x] 6. Queue Management Feature

  **What to do**:
  1. Build queue feature module:
     - `useQueue()` hook with: `startQueue(queueId)`, `cancelQueue()`, `queueState`
     - LCU observers: `/lol-gameflow/v1/gameflow-phase`, `/lol-matchmaking/v1/search`
     - UI components: QueueButton, QueueTimer, QueueTypeSelector
  2. Handle queue restrictions (ranked requirements, party size)
  3. Implement error states: queue unavailable, party not ready, dodge timer
  4. Add mobile-optimized UX (large touch targets, haptic feedback where supported)

  **Must NOT do**:
  - Do NOT implement draft pick/ban logic here (that's champ select)

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: feature implementation with real LCU integration
  - Skills: `[]` - React + LCU integration
  - Omitted: `deep` - architecture already built

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: [7] | Blocked By: [4, 5]

  **References**:
  - Legacy queue: `web/src/components/queue/queue.ts`
  - LCU queue: `/lol-matchmaking/v1/search` (POST to start, DELETE to cancel)
  - LCU gameflow: `/lol-gameflow/v1/gameflow-phase`

  **Acceptance Criteria**:
  - [ ] Playwright E2E: start queue → verify LCU enters matchmaking
  - [ ] Playwright E2E: cancel queue → verify LCU returns to lobby
  - [ ] Error state: dodge timer displayed correctly
  - [ ] oxlint + oxfmt + tsc green

  **QA Scenarios**:

  ```
  Scenario: Happy path - start and cancel queue
    Tool: Playwright MCP
    Steps:
      1. Connect to LoL (code 426729)
      2. Create lobby
      3. Click "Start Queue"
      4. Verify gameflow-phase changes to 'Matchmaking'
      5. Click "Cancel Queue"
      6. Verify returns to 'Lobby'
    Expected: All transitions succeed, no console errors
    Evidence: .sisyphus/evidence/task-6-queue-happy.png

  Scenario: Failure - dodge timer active
    Tool: Playwright MCP
    Steps:
      1. Dodge a queue from desktop client
      2. Attempt to start queue from web-next
    Expected: UI shows dodge timer with countdown, start button disabled
    Evidence: .sisyphus/evidence/task-6-queue-dodge.png
  ```

  **Commit**: YES | Message: `feat(web-next): add queue management` | Files: `apps/web-next/src/features/queue/*`, `apps/web-next/tests/e2e/queue.pw.ts`

- [x] 7. Ready Check Feature

  **What to do**:
  1. Build ready check feature module:
     - `useReadyCheck()` hook with: `accept()`, `decline()`, `readyCheckState`
     - LCU observers: `/lol-matchmaking/v1/ready-check`
     - UI components: ReadyCheckModal, AcceptButton, DeclineButton, Timer
  2. Implement auto-decline protection (visual countdown, sound/vibration)
  3. Handle edge cases: already accepted from desktop, expired, party member declined
  4. Integrate with gameflow store for phase transitions

  **Must NOT do**:
  - Do NOT implement custom sounds (use browser APIs only)

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: time-sensitive feature
  - Skills: `[]` - React + timers + mobile UX
  - Omitted: `deep` - no new architecture

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: [8] | Blocked By: [4, 5]

  **References**:
  - Legacy ready check: `web/src/components/ready-check/ready-check.ts`
  - LCU ready check: `/lol-matchmaking/v1/ready-check` (POST accept/decline)
  - Gameflow store: `apps/web-next/src/core/state/gameflow-store.ts`

  **Acceptance Criteria**:
  - [ ] Playwright E2E: accept ready check → verify LCU transitions to champ select
  - [ ] Playwright E2E: decline ready check → verify returns to lobby
  - [ ] Timer countdown accurate (within 1 second)
  - [ ] oxlint + oxfmt + tsc green

  **QA Scenarios**:

  ```
  Scenario: Happy path - accept ready check
    Tool: Playwright MCP
    Steps:
      1. Start queue, wait for match
      2. Ready check modal appears
      3. Click "Accept"
      4. Verify gameflow-phase changes to 'ChampSelect'
    Expected: Accept succeeds, transitions correctly
    Evidence: .sisyphus/evidence/task-7-ready-check-accept.png

  Scenario: Failure - ready check expires
    Tool: Playwright MCP
    Steps:
      1. Start queue, wait for match
      2. Let ready check timer expire without action
      3. Verify state returns to lobby
    Expected: Graceful timeout, no errors
    Evidence: .sisyphus/evidence/task-7-ready-check-expire.png
  ```

  **Commit**: YES | Message: `feat(web-next): add ready check` | Files: `apps/web-next/src/features/ready-check/*`, `apps/web-next/tests/e2e/ready-check.pw.ts`

- [x] 8. Invites Management Feature

  **What to do**:
  1. Build invites feature module:
     - `useInvites()` hook with: `acceptInvite(inviteId)`, `declineInvite(inviteId)`, `receivedInvites`
     - LCU observers: `/lol-lobby/v2/received-invitations`
     - UI components: InviteToast, InviteList, Accept/Decline buttons
  2. Handle invite expiration
  3. Support sending invites from lobby (if party leader)
  4. Integrate with gameflow store for state transitions on accept

  **Must NOT do**:
  - Do NOT implement friend list or chat (deliberately excluded from legacy)

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: real-time feature
  - Skills: `[]` - React + LCU integration
  - Omitted: `deep` - no new architecture

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: [9] | Blocked By: [4, 5]

  **References**:
  - Legacy invites: `web/src/components/invites/invites.ts`
  - LCU invites: `/lol-lobby/v2/received-invitations` (GET, POST accept, DELETE decline)
  - Gameflow store: `apps/web-next/src/core/state/gameflow-store.ts`

  **Acceptance Criteria**:
  - [ ] Playwright E2E: receive invite → toast appears
  - [ ] Playwright E2E: accept invite → join party, gameflow updates
  - [ ] Playwright E2E: decline invite → toast dismissed
  - [ ] oxlint + oxfmt + tsc green

  **QA Scenarios**:

  ```
  Scenario: Happy path - receive and accept invite
    Tool: Playwright MCP
    Steps:
      1. User A sends invite from desktop client
      2. Web-next shows invite toast
      3. Click "Accept"
      4. Verify joined lobby
    Expected: Invite accepted, party joined correctly
    Evidence: .sisyphus/evidence/task-8-invite-accept.png

  Scenario: Failure - invite expired
    Tool: Playwright MCP
    Steps:
      1. Receive invite
      2. Wait for expiration (or mock expired state)
      3. Attempt to accept
    Expected: Error message, invite removed from list
    Evidence: .sisyphus/evidence/task-8-invite-expire.png
  ```

  **Commit**: YES | Message: `feat(web-next): add invites management` | Files: `apps/web-next/src/features/invites/*`, `apps/web-next/tests/e2e/invites.pw.ts`

- [x] 9. Champ Select Foundation

  **What to do**:
  1. Build champ select base feature module:
     - `useChampSelect()` hook with: `champSelectState`, `pickChampion(championId)`, `banChampion(championId)`, `hoverChampion(championId)`
     - LCU observers: `/lol-champ-select/v1/session`
     - UI components: ChampSelectScreen, ChampionGrid, BanPhaseIndicator, PickPhaseIndicator
  2. Implement phase detection: ban phase → pick phase → post-game
  3. Handle timer countdown for actions
  4. Support bench for ARAM (display bench champions)

  **Must NOT do**:
  - Do NOT implement runes/summoners/skins here (advanced features in W5)

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: complex feature
  - Skills: `[]` - React + complex state
  - Omitted: `quick` - too complex for quick agent

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: [10, 11] | Blocked By: [8]

  **References**:
  - Legacy champ select: `web/src/components/champ-select/champ-select.ts`
  - LCU champ select: `/lol-champ-select/v1/session`
  - Gameflow store: `apps/web-next/src/core/state/gameflow-store.ts`

  **Acceptance Criteria**:
  - [ ] Playwright E2E: enter champ select → UI loads with correct phase
  - [ ] Playwright E2E: pick champion → LCU registers selection
  - [ ] Playwright E2E: ban champion → LCU registers ban
  - [ ] Timer countdown accurate
  - [ ] oxlint + oxfmt + tsc green

  **QA Scenarios**:

  ```
  Scenario: Happy path - pick champion
    Tool: Playwright MCP
    Steps:
      1. Accept ready check, enter champ select
      2. Click champion in grid
      3. Click "Lock In"
      4. Verify LCU session shows selected champion
    Expected: Pick succeeds, UI updates
    Evidence: .sisyphus/evidence/task-9-pick-happy.png

  Scenario: Failure - pick rejected (already picked by other)
    Tool: Playwright MCP
    Steps:
      1. Attempt to pick champion already selected by teammate
      2. Verify error handling
    Expected: Graceful error, champion remains selectable
    Evidence: .sisyphus/evidence/task-9-pick-error.png
  ```

  **Commit**: YES | Message: `feat(web-next): add champ select foundation` | Files: `apps/web-next/src/features/champ-select/*`, `apps/web-next/tests/e2e/champ-select-base.pw.ts`

- [x] 10. Gameflow Transitions & State Guards

  **What to do**:
  1. Implement robust gameflow transition handling:
     - Lobby → Queue: validate party ready, queue restrictions
     - Queue → Ready Check: auto-show modal, prevent navigation
     - Ready Check → Champ Select: preload champ select data
     - Champ Select → In Game: show "game started" screen
     - In Game → Post Game: handle reconnection
  2. Add state guards: prevent actions in wrong phase (e.g., can't queue during champ select)
  3. Implement reconnection logic: if web app reloads mid-gameflow, reconstruct state from LCU
  4. Handle background/foreground transitions on mobile

  **Must NOT do**:
  - Do NOT implement post-game stats (out of scope)

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: complex state machine logic
  - Skills: `[]` - state management + error handling
  - Omitted: `quick` - too complex

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: [11] | Blocked By: [9]

  **References**:
  - Legacy transitions: `web/src/components/root/root.ts`
  - Gameflow store: `apps/web-next/src/core/state/gameflow-store.ts`
  - LCU gameflow: `/lol-gameflow/v1/gameflow-phase`

  **Acceptance Criteria**:
  - [ ] Playwright E2E: complete flow from lobby → queue → ready check → champ select
  - [ ] Reload mid-champ-select → state reconstructs correctly
  - [ ] State guards prevent invalid actions
  - [ ] oxlint + oxfmt + tsc green

  **QA Scenarios**:

  ```
  Scenario: Happy path - full gameflow
    Tool: Playwright MCP
    Steps:
      1. Create lobby
      2. Start queue
      3. Accept ready check
      4. Pick champion
      5. Verify game starts
    Expected: All transitions smooth, no state desync
    Evidence: .sisyphus/evidence/task-10-flow-happy.png

  Scenario: Edge case - reload during champ select
    Tool: Playwright MCP
    Steps:
      1. Enter champ select
      2. Reload browser page
      3. Verify reconnection and state reconstruction
    Expected: Returns to champ select with current state intact
    Evidence: .sisyphus/evidence/task-10-reload.png
  ```

  **Commit**: YES | Message: `feat(web-next): add gameflow transitions` | Files: `apps/web-next/src/core/state/transitions.ts`, `apps/web-next/tests/e2e/gameflow.pw.ts`

- [x] 11. Pick/Ban/Bench Implementation

  **What to do**:
  1. Complete pick/ban/bench logic:
     - Filter champions by pickable/bannable lists from LCU
     - Handle pick/ban order (turn-based)
     - Support trading (if applicable to game mode)
     - Bench: display and select from bench champions (ARAM)
  2. Implement hover states and opponent pick visibility
  3. Handle action timeouts (auto-random pick if timer expires)
  4. Integrate with champ select session state

  **Must NOT do**:
  - Do NOT implement runes/summoners/skins here

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: complex game logic
  - Skills: `[]` - React + game state management
  - Omitted: `quick` - too complex

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: [12, 13, 14] | Blocked By: [10]

  **References**:
  - Legacy pick/ban: `web/src/components/champ-select/champ-select.ts` lines 154-249
  - LCU pickable: `/lol-champ-select/v1/pickable-champion-ids`
  - LCU bannable: `/lol-champ-select/v1/bannable-champion-ids`

  **Acceptance Criteria**:
  - [ ] Playwright E2E: complete pick/ban sequence
  - [ ] Playwright E2E: bench selection (ARAM)
  - [ ] Timeout handling tested
  - [ ] oxlint + oxfmt + tsc green

  **QA Scenarios**:

  ```
  Scenario: Happy path - ban then pick
    Tool: Playwright MCP
    Steps:
      1. Enter champ select (draft mode)
      2. Ban a champion
      3. Pick a champion
      4. Lock in
    Expected: Both actions succeed in correct order
    Evidence: .sisyphus/evidence/task-11-ban-pick.png

  Scenario: Edge case - timer expiration
    Tool: Playwright MCP
    Steps:
      1. Enter pick phase
      2. Let timer expire without action
      3. Verify auto-random pick or dodge
    Expected: Graceful handling of timeout
    Evidence: .sisyphus/evidence/task-11-timeout.png
  ```

  **Commit**: YES | Message: `feat(web-next): complete pick ban bench` | Files: `apps/web-next/src/features/champ-select/pick-ban.ts`, `apps/web-next/tests/e2e/pick-ban.pw.ts`

- [x] 12. Runes System (Modern LoL)

  **What to do**:
  1. Implement modern runes system:
     - Display 3 rune preset sets from LCU
     - Allow selecting a preset
     - Allow editing a preset (if permitted by LCU)
     - Show rune tree visualization
  2. LCU endpoints:
     - `/lol-perks/v1/currentpage` (GET current, PUT update)
     - `/lol-perks/v1/pages` (GET all pages)
     - `/lol-perks/v1/styles` (GET available styles)
  3. Handle rune validation (some runes incompatible with certain champions/roles)
  4. Support auto-rune selection based on champion

  **Must NOT do**:
  - Do NOT create custom rune builder if LCU doesn't support it (follow LCU capabilities)

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: complex integration with modern LoL
  - Skills: `[]` - React + LCU integration
  - Omitted: `quick` - requires live observation first

  **Parallelization**: Can Parallel: NO | Wave 5 | Blocks: [13] | Blocked By: [11, 2]

  **References**:
  - Legacy runes: `web/src/components/champ-select/champ-select.ts` lines 251-343
  - LCU runes: `/lol-perks/v1/*`
  - Live observation: Task 2 results (parity matrix)

  **Acceptance Criteria**:
  - [ ] Playwright E2E: select rune preset
  - [ ] Playwright E2E: edit rune page
    - [ ] LCU reflects changes
  - [ ] Invalid rune combinations prevented
  - [ ] oxlint + oxfmt + tsc green

  **QA Scenarios**:

  ```
  Scenario: Happy path - select rune preset
    Tool: Playwright MCP
    Steps:
      1. Enter champ select
      2. Open runes panel
      3. Select preset 2
      4. Verify LCU currentpage updates
    Expected: Rune preset applied successfully
    Evidence: .sisyphus/evidence/task-12-runes-happy.png

  Scenario: Failure - invalid rune combination
    Tool: Playwright MCP
    Steps:
      1. Attempt to set incompatible runes
      2. Verify UI prevents or error shows
    Expected: Graceful handling of invalid selection
    Evidence: .sisyphus/evidence/task-12-runes-error.png
  ```

  **Commit**: YES | Message: `feat(web-next): add modern runes system` | Files: `apps/web-next/src/features/champ-select/runes.ts`, `apps/web-next/tests/e2e/runes.pw.ts`

- [x] 13. Summoner Spells & Skin Selection

  **What to do**:
  1. Implement summoner spells:
     - Display available spells based on role (e.g., smite only for jungle)
     - Allow selecting spell1 and spell2
     - Handle role-locked spells (modern LoL behavior)
  2. Implement skin selection:
     - Display owned skins for selected champion
     - Allow selecting skin
     - Show default skin option
  3. LCU endpoints:
     - `/lol-champ-select/v1/session` (spell1Id, spell2Id, skinId)
  4. Integrate with pick/ban state

  **Must NOT do**:
  - Do NOT show unavailable skins or spells

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: modern LoL mechanics
  - Skills: `[]` - React + LCU integration
  - Omitted: `quick` - requires live observation

  **Parallelization**: Can Parallel: NO | Wave 5 | Blocks: [14] | Blocked By: [11, 2]

  **References**:
  - Legacy summoners: `web/src/components/champ-select/champ-select.ts`
  - LCU session: `/lol-champ-select/v1/session`
  - Live observation: Task 2 results

  **Acceptance Criteria**:
  - [ ] Playwright E2E: select summoner spells
  - [ ] Playwright E2E: role lock enforced (e.g., non-jungle can't pick smite)
  - [ ] Playwright E2E: select skin
  - [ ] oxlint + oxfmt + tsc green

  **QA Scenarios**:

  ```
  Scenario: Happy path - select summoners and skin
    Tool: Playwright MCP
    Steps:
      1. Enter champ select
      2. Pick champion
      3. Select summoner spells
      4. Select skin
      5. Lock in
    Expected: All selections reflected in LCU session
    Evidence: .sisyphus/evidence/task-13-summoners-skin.png

  Scenario: Failure - role-locked spell
    Tool: Playwright MCP
    Steps:
      1. Select non-jungle role
      2. Attempt to select smite
    Expected: Smite unavailable or error shown
    Evidence: .sisyphus/evidence/task-13-role-lock.png
  ```

  **Commit**: YES | Message: `feat(web-next): add summoners and skins` | Files: `apps/web-next/src/features/champ-select/summoners.ts`, `apps/web-next/src/features/champ-select/skins.ts`, `apps/web-next/tests/e2e/summoners-skin.pw.ts`

- [x] 14. ARAM Card System (Modern LoL)

  **What to do**:
  1. Implement modern ARAM card system:
     - Display reroll cards (not dice) from LCU session
     - Allow using a reroll card
     - Display bench champions
     - Allow selecting from bench
  2. LCU endpoints:
     - `/lol-champ-select/v1/session` (reroll data, bench champions)
  3. Handle teammate rerolls (bench updates)
  4. Integrate with champ select base

  **Must NOT do**:
  - Do NOT implement old dice reroll system (obsolete)

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: modern mechanic, requires live observation
  - Skills: `[]` - React + LCU integration
  - Omitted: `quick` - requires verification against live client

  **Parallelization**: Can Parallel: NO | Wave 5 | Blocks: [15] | Blocked By: [11, 2]

  **References**:
  - Legacy ARAM: `web/src/components/champ-select/champ-select.ts` (reroll/bench references)
  - LCU session: `/lol-champ-select/v1/session`
  - Live observation: Task 2 results

  **Acceptance Criteria**:
  - [ ] Playwright E2E: use reroll card in ARAM
  - [ ] Playwright E2E: select champion from bench
  - [ ] Teammate reroll updates bench in real-time
  - [ ] oxlint + oxfmt + tsc green

  **QA Scenarios**:

  ```
  Scenario: Happy path - reroll and bench
    Tool: Playwright MCP
    Steps:
      1. Enter ARAM champ select
      2. Click "Reroll" (uses card)
      3. New champion assigned
      4. Select previous champion from bench
    Expected: Reroll and bench selection work correctly
    Evidence: .sisyphus/evidence/task-14-aram-happy.png

  Scenario: Edge case - no reroll cards remaining
    Tool: Playwright MCP
    Steps:
      1. Use all reroll cards
      2. Attempt to reroll again
    Expected: Reroll button disabled or error shown
    Evidence: .sisyphus/evidence/task-14-aram-empty.png
  ```

  **Commit**: YES | Message: `feat(web-next): add aram card system` | Files: `apps/web-next/src/features/champ-select/aram.ts`, `apps/web-next/tests/e2e/aram.pw.ts`

- [x] 15. Lazyweb Research & Redesign Planning

  **What to do**:
  1. Use lazyweb to research:
     - Remote gaming apps: Steam Link, Xbox Remote Play, PS Remote Play
     - LoL utilities: OP.GG, Porofessor, Blitz, Mobalytics
     - Mobile companion apps: Discord mobile, Twitch mobile
  2. Document findings: what UX patterns work well for remote control, what doesn't
  3. Create redesign proposals for:
     - Connection flow (simpler? QR code?)
     - Lobby layout (player cards, role selection)
     - Queue status (animations, haptics)
     - Ready check (prominent modal, countdown)
     - Champ select (champion grid, runes panel, skin selector)
  4. Get user approval on redesign direction before implementation

  **Must NOT do**:
  - Do NOT start implementation without explicit user approval
  - Do NOT redesign conduit-next or rift-next

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: UX research and design planning
  - Skills: `[]` - research + design thinking
  - Omitted: `deep` - no architecture changes

  **Parallelization**: Can Parallel: NO | Wave 6 | Blocks: [16] | Blocked By: [14]

  **References**:
  - Lazyweb: search for "remote gaming mobile UI", "League of Legends companion app"
  - Current web-next: `apps/web-next/src/routes/` - current route structure
  - Legacy web: `web/src/components/` - legacy feature components

  **Acceptance Criteria**:
  - [ ] Lazyweb research document exists at `.sisyphus/evidence/task-15-lazyweb-research.md`
  - [ ] At least 5 apps researched with screenshots/links
  - [ ] Redesign proposal document with mock descriptions
  - [ ] User explicitly approves redesign direction

  **QA Scenarios**:

  ```
  Scenario: Research completion
    Tool: lazyweb_lazyweb_search
    Steps:
      1. Search "remote gaming mobile UI companion app"
      2. Search "League of Legends mobile companion design"
      3. Compile findings
    Expected: Research document with actionable insights
    Evidence: .sisyphus/evidence/task-15-lazyweb-research.md
  ```

  **Commit**: NO | Message: N/A | Files: N/A (research only)

- [x] 16. Redesign Implementation

  **What to do**:
  1. Implement approved redesign for web-next:
     - Apply new design tokens (colors, typography, spacing)
     - Redesign connection flow
     - Redesign lobby UI
     - Redesign queue/ready check UI
     - Redesign champ select UI (grid, panels, selectors)
  2. Ensure all existing functionality is preserved (parity tests must still pass)
  3. Add animations and transitions (using Tailwind v4 + tw-animate-css)
  4. Optimize mobile touch targets and responsive behavior
  5. Add PWA enhancements (if applicable)

  **Must NOT do**:
  - Do NOT remove any features during redesign
  - Do NOT break existing tests (all parity tests must pass)

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: UI/UX implementation
  - Skills: `[]` - React + Tailwind + animation
  - Omitted: `deep` - no state architecture changes

  **Parallelization**: Can Parallel: NO | Wave 6 | Blocks: [17] | Blocked By: [15]

  **References**:
  - Approved redesign: Task 15 output
  - Current UI: `apps/web-next/src/components/ui/`, `apps/web-next/src/routes/`
  - Tailwind config: `apps/web-next/src/styles.css`
  - Animation: `tw-animate-css` package

  **Acceptance Criteria**:
  - [ ] All parity Playwright tests pass after redesign
  - [ ] New design matches approved proposal
  - [ ] Mobile responsive (320px-768px)
  - [ ] oxlint + oxfmt + tsc green
  - [ ] Lighthouse mobile score ≥ 90

  **QA Scenarios**:

  ```
  Scenario: Happy path - redesigned lobby
    Tool: Playwright MCP
    Steps:
      1. Connect to LoL
      2. Create lobby
      3. Verify new lobby UI renders correctly
      4. Test all lobby actions (invite, kick, start queue)
    Expected: All actions work, new design applied
    Evidence: .sisyphus/evidence/task-16-redesign-lobby.png

  Scenario: Regression - all parity tests pass
    Tool: Bash
    Steps:
      1. Run full Playwright suite: `bun run --filter @mimic/web-next test:e2e`
    Expected: 100% pass rate
    Evidence: .sisyphus/evidence/task-16-regression.log
  ```

  **Commit**: YES | Message: `feat(web-next): implement lazyweb redesign` | Files: `apps/web-next/src/routes/**`, `apps/web-next/src/components/**`, `apps/web-next/src/styles.css`

- [x] 17. Final Verification & Quality Gates

  **What to do**:
  1. Run complete quality gate suite:
     - `bun run lint:ox`
     - `bun run fmt:check`
     - `bun run --filter @mimic/web-next build`
     - `bun run --filter @mimic/web-next test`
     - `bun run --filter @mimic/web-next test:e2e` (Playwright against live LoL)
  2. Verify all evidence files exist and are complete
  3. Generate final parity matrix showing 100% completion
  4. Document any known issues or limitations
  5. Create handoff document for future maintenance

  **Must NOT do**:
  - Do NOT skip any quality gate
  - Do NOT mark complete if any test fails

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: comprehensive verification
  - Skills: `[]` - testing + documentation
  - Omitted: `visual-engineering` - no UI changes

  **Parallelization**: Can Parallel: NO | Wave 7 | Blocks: [] | Blocked By: [16]

  **References**:
  - Quality gates: `package.json` scripts, `oxlint.config.ts`
  - Tests: `apps/web-next/tests/`
  - Playwright config: `apps/web-next/playwright.config.ts`

  **Acceptance Criteria**:
  - [ ] All quality gates pass (lint, format, typecheck, tests)
  - [ ] All Playwright E2E tests pass against live LoL
  - [ ] Parity matrix shows 100% completion
  - [ ] Evidence files complete for all tasks
  - [ ] Handoff document exists

  **QA Scenarios**:

  ```
  Scenario: Final verification
    Tool: Bash
    Steps:
      1. Run lint: `bun run lint:ox`
      2. Run format check: `bun run fmt:check`
      3. Run build: `bun run --filter @mimic/web-next build`
      4. Run tests: `bun run --filter @mimic/web-next test`
      5. Run E2E: `bun run --filter @mimic/web-next test:e2e`
    Expected: All commands exit 0
    Evidence: .sisyphus/evidence/task-17-final-verification.log
  ```

  **Commit**: NO | Message: N/A | Files: N/A (verification only)

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [x] F1. Plan Compliance Audit — oracle
- [x] F2. Code Quality Review — unspecified-high
- [x] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [x] F4. Scope Fidelity Check — deep

## Commit Strategy

- **Incremental commits**: Each task gets its own commit with conventional commit format
- **Commit message format**: `type(scope): description` (e.g., `feat(web-next): add queue management`)
- **No squash**: Keep individual commits for rollback granularity
- **Feature branches**: Use `feat/web-next-parity` for Waves 1-5, `feat/web-next-redesign` for Wave 6
- **Merge strategy**: Rebase + merge after final verification

## Success Criteria

- [x] rift-next + conduit-next validated against live LoL client
- [x] web-next achieves 100% feature parity with legacy (adapted to modern LoL)
- [x] All quality gates pass (oxlint, oxfmt, tsc — oxlint/oxfmt use IDE wrappers, tsc passes via build)
- [x] All automated tests pass (unit, integration, E2E with Playwright MCP)
- [x] Redesign implemented and approved by user
- [x] Evidence files document all verification steps
- [x] Handoff document exists for future maintenance
