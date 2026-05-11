# Fix Lobby Flash on Queue Cancel

## TL;DR
> **Summary**: Eliminate the momentary flash of `LobbyCreationContent` when a user cancels matchmaking search while in a lobby. The lobby screen must remain static.
> **Deliverables**: Patched `route.tsx` grace-period logic, sticky members in `useLobby.ts`, optional `lobbySessionDescriptor` invalidation, Bun tests
> **Effort**: Short
> **Parallel**: YES — 2 waves
> **Critical Path**: T1 (investigation logs) → T2 (sticky hook) → T3 (route grace period) → T4 (tests)

## Context
### Original Request
User reports a sub-second flicker: after clicking "Cancelar Cola" from the `QueueOverlay`, the screen briefly renders `LobbyCreationContent` and then snaps back to the existing lobby. Expected behavior: the lobby stays visible without any flash.

### Interview Summary
- User confirmed they expect to see the **same lobby** after canceling
- User prefers a **static** screen during the transition
- Chose: include automated tests + combined approach (grace period + sticky state)

### Metis Review (gaps addressed)
- **Grace duration**: defined as 3000ms, clearable by explicit leave/disband or gameflow phase change
- **Scope guardrails**: do NOT touch gameflow navigation mapping, global query policies, or UI styling
- **Edge cases**: solo lobby, multi-member transient empty payload, cancel failure, rapid cancel/re-search, match-found transition
- **Source of truth**: combine last known members + gameflow phase + grace window

## Work Objectives
### Core Objective
Make lobby visibility resilient to transient empty `members` during queue cancellation while preserving normal empty-lobby behavior.

### Deliverables
1. `useLobby.ts` — sticky `members` ref that survives transient empty observer payloads
2. `route.tsx` — grace-period `hasLobby` decision (3000ms) gated by real empty-lobby confirmation
3. `lcu-mutations.ts` — optional `lobbySessionDescriptor` invalidation in `useCancelQueue`
4. Bun tests covering happy path, grace expiry, real empty lobby, and explicit leave

### Definition of Done (verifiable conditions with commands)
- [ ] `bun test apps/web-next` passes (existing + new tests)
- [ ] `bun run lint` passes
- [ ] `bun run fmt:check` passes
- [ ] Browser logs show `members.length` never drops to 0 during cancel → lobby stays visible
- [ ] Manual QA: start queue → cancel → no LobbyCreationContent flash

### Must Have
- Sticky members logic in `useLobby`
- Grace-period rendering gate in `route.tsx`
- Unit tests for hook + route decision
- Integration test for full cancel flow

### Must NOT Have (guardrails)
- Changes to gameflow phase-to-route mapping
- Changes to global TanStack Query cache policies
- Visual redesign of any lobby/queue component
- Indefinite masking of real empty-lobby states
- Broad retry/error handling beyond transient empty members

## Verification Strategy
> ZERO HUMAN INTERVENTION — all verification is agent-executed.
- **Test decision**: tests-after (bug fix with regression tests)
- **Framework**: Bun native test runner (`bun test`)
- **QA policy**: Every task has agent-executed scenarios; primary gate is automated tests
- **Evidence**: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves
> Target: 5-8 tasks per wave.

**Wave 1**: Foundation — investigation + hook fix + mutation tweak
**Wave 2**: Route fix + tests + QA verification

### Dependency Matrix (full, all tasks)
| Task | Blocks | Blocked By |
|------|--------|------------|
| T1 Investigate logs | — | — |
| T2 Sticky members hook | T3, T4 | T1 |
| T3 Optional lobby invalidation | T4 | — |
| T4 Route grace period | T5, T6, T7 | T2 |
| T5 Unit tests (hook) | — | T2 |
| T6 Integration tests (route) | — | T4 |
| T7 Browser QA with logs | — | T4 |
| F1-F4 Final verification | — | T1-T7 |

### Agent Dispatch Summary (wave → task count → categories)
- Wave 1: 3 tasks → `quick`/`deep`
- Wave 2: 4 tasks → `quick`/`deep`

## TODOs

- [x] T1. Investigate browser logs to confirm transient empty members during cancel

  **What to do**: Use `agent-browser` or devtools logs to capture the exact sequence of `members.length` and `queueStatus.isSearching` values during cancel. Verify the flicker is caused by `members: []` + `isSearching: false` coinciding.
  **Must NOT do**: Modify source code yet; this is purely diagnostic.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: needs to trace runtime behavior and interpret logs
  - Skills: [`agent-browser`] — Reason: browser automation to trigger cancel and read console logs

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T2, T3 | Blocked By: —

  **References**:
  - Pattern: `src/routes/connected/lobby/route.tsx:61` — `hasLobby` condition
  - API: `src/features/lobby/hooks/use-lobby.ts:165-176` — members derivation
  - Test: `src/features/gameflow/tests/match-acceptance-flow.test.ts` — example of flow test

  **Acceptance Criteria**:
  - [ ] Logs show `members.length` dropping to `0` within 500ms after cancel
  - [ ] `queueStatus.isSearching` flips `true → false` before `members` recovers
  - [ ] Evidence saved to `.sisyphus/evidence/task-1-cancel-logs.json`

  **QA Scenarios**:
  ```
  Scenario: Happy path — log capture
    Tool: agent-browser
    Steps:
      1. Navigate to /connected/lobby with active lobby
      2. Click "Buscar Partida"
      3. Wait for QueueOverlay
      4. Click "Cancelar Cola"
      5. Capture console logs filtered by "members" and "queueStatus"
    Expected: Log entries show members.length=0 && isSearching=false for >=1 frame
    Evidence: .sisyphus/evidence/task-1-cancel-logs.json
  ```

  **Commit**: NO

- [x] T2. Implement sticky members in `useLobby` hook

  **What to do**: Add a `useRef` inside `useLobby` that retains the last known non-empty `members` array. Only update the sticky ref when the new `members` array is non-empty OR when an explicit "clear" signal occurs (e.g. gameflow phase is not Lobby/Matchmaking, or grace timeout expired). Return the sticky value as the primary `members` field.
  **Must NOT do**: Clear the sticky ref immediately when `lobbyQuery.data` becomes null/undefined; only clear on confirmed empty state.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: localized hook change
  - Skills: [`react-patterns`, `typescript-advanced-types`] — Reason: hook logic with refs and memoization

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: T4, T5 | Blocked By: T1

  **References**:
  - Pattern: `src/features/lobby/hooks/use-lobby.ts:165-176` — members derivation
  - Pattern: `src/features/lobby/hooks/use-lobby.ts:412-435` — return object
  - Type: `src/features/lobby/lobby-store.ts` — `LobbyMember` type

  **Acceptance Criteria**:
  - [ ] `members` returned by `useLobby` never becomes `[]` during cancel if it previously had items
  - [ ] `members` clears immediately when gameflow phase changes to `None` or `ChampSelect`
  - [ ] `bun run lint` passes

  **QA Scenarios**:
  ```
  Scenario: Happy path — sticky members
    Tool: Bash (bun test)
    Steps:
      1. Mock lobbyQuery.data with 2 members
      2. Simulate observer setting query data to {members: []}
      3. Assert useLobby().members still has 2 members
    Expected: members.length === 2
    Evidence: .sisyphus/evidence/task-2-sticky-test.txt

  Scenario: Edge — real empty lobby
    Tool: Bash (bun test)
    Steps:
      1. Mock lobbyQuery.data with 0 members and gameflow phase = 'None'
      2. Assert useLobby().members is []
    Expected: members.length === 0
    Evidence: .sisyphus/evidence/task-2-real-empty-test.txt
  ```

  **Commit**: YES | Message: `fix(lobby): retain last known members during transient empty state` | Files: `src/features/lobby/hooks/use-lobby.ts`

- [x] T3. Optionally invalidate `lobbySessionDescriptor` in `useCancelQueue`

  **What to do**: Add `lobbySessionDescriptor.queryKey` to the `invalidateKeys` array of `useCancelQueue` in `lcu-mutations.ts`. Then verify via logs/tests that this does NOT reintroduce the flicker.
  **Must NOT do**: If logs show flicker reappears, revert this change and document why.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: one-line addition + verification
  - Skills: [] — Reason: simple mutation config change

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T4 | Blocked By: —

  **References**:
  - API: `src/core/lcu/lcu-mutations.ts:117-124` — `useCancelQueue` definition
  - API: `src/core/lcu/lcu-queries.ts:235-249` — `lobbySessionDescriptor` queryKey

  **Acceptance Criteria**:
  - [ ] `lobbySessionDescriptor.queryKey` added to `invalidateKeys`
  - [ ] Browser logs confirm no flicker after cancel (or task is reverted)
  - [ ] `bun run lint` passes

  **QA Scenarios**:
  ```
  Scenario: Verify no regression
    Tool: agent-browser
    Steps:
      1. Apply change
      2. Start queue, cancel
      3. Check console logs for members.length
    Expected: members never drops to 0 (or change is reverted)
    Evidence: .sisyphus/evidence/task-3-invalidation-qa.txt
  ```

  **Commit**: YES (conditional) | Message: `fix(lcu): invalidate lobby session on cancel for fresher data` | Files: `src/core/lcu/lcu-mutations.ts`

- [x] T4. Add grace-period logic to `hasLobby` in lobby route

  **What to do**: In `src/routes/connected/lobby/route.tsx`, replace the immediate `hasLobby` boolean with a grace-period-aware helper. When `queueStatus.isSearching` transitions from `true` to `false`, keep `hasLobby` true for 3000ms unless an explicit leave/disband occurs or the gameflow phase leaves the lobby context. Use a small hook or `useRef` + `useEffect` to track the transition timestamp.
  **Must NOT do**: Make the grace period indefinite; do NOT change any UI styling.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: localized route component change
  - Skills: [`react-patterns`] — Reason: effect with timeout/cleanup

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T6, T7 | Blocked By: T2

  **References**:
  - Pattern: `src/routes/connected/lobby/route.tsx:61` — original `hasLobby`
  - Pattern: `src/routes/connected/lobby/route.tsx:63-69` — loading + creation gates
  - Type: `src/core/state/gameflow-store.ts` — `GameflowPhase` union

  **Acceptance Criteria**:
  - [ ] `LobbyCreationContent` does NOT render within 3000ms after cancel if lobby previously existed
  - [ ] After 3000ms with confirmed empty lobby, `LobbyCreationContent` renders correctly
  - [ ] Explicit lobby leave clears grace period immediately
  - [ ] `bun run lint` passes

  **QA Scenarios**:
  ```
  Scenario: Happy path — grace period covers cancel
    Tool: Bash (bun test with fake timers)
    Steps:
      1. Render route with hasLobby=true, isSearching=true
      2. Flip isSearching to false, members to []
      3. Assert LobbyCreationContent is NOT in document
      4. Advance timers by 3001ms
      5. Assert LobbyCreationContent IS in document
    Expected: No creation content during grace; appears after expiry
    Evidence: .sisyphus/evidence/task-4-grace-test.txt

  Scenario: Edge — explicit leave clears immediately
    Tool: Bash (bun test)
    Steps:
      1. Render route with hasLobby=true
      2. Fire explicit leave action
      3. Assert LobbyCreationContent renders immediately
    Expected: Grace period bypassed on explicit leave
    Evidence: .sisyphus/evidence/task-4-leave-test.txt
  ```

  **Commit**: YES | Message: `fix(lobby): add grace period to prevent flash on queue cancel` | Files: `src/routes/connected/lobby/route.tsx`

- [x] T5. Write unit tests for sticky members hook

  **What to do**: Create `src/features/lobby/hooks/tests/use-lobby.sticky.test.ts` (or add to existing test file). Test:
  1. members stays sticky when observer sends empty payload
  2. members clears when gameflow phase changes to None/ChampSelect
  3. members clears after grace timeout if lobby remains empty
  4. members updates normally when non-empty payload arrives
  Use mocked TanStack Query data and fake timers.
  **Must NOT do**: Test actual LCU transport or real browser.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: focused unit tests
  - Skills: [] — Reason: standard Bun test patterns

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: — | Blocked By: T2

  **References**:
  - Test pattern: `src/features/gameflow/tests/match-acceptance-flow.test.ts` — Bun test example
  - Hook: `src/features/lobby/hooks/use-lobby.ts`

  **Acceptance Criteria**:
  - [ ] All 4 test cases pass (`bun test`)
  - [ ] Tests use `@testing-library/react` or similar if available; otherwise pure hook testing
  - [ ] Coverage includes edge cases from Metis review

  **QA Scenarios**:
  ```
  Scenario: Run tests
    Tool: Bash
    Steps: `bun test apps/web-next/src/features/lobby/hooks/tests/use-lobby.sticky.test.ts`
    Expected: 4/4 pass
    Evidence: .sisyphus/evidence/task-5-test-output.txt
  ```

  **Commit**: YES | Message: `test(lobby): unit tests for sticky members during cancel` | Files: `src/features/lobby/hooks/tests/use-lobby.sticky.test.ts`

- [x] T6. Write integration tests for route grace period

  **What to do**: Create `src/routes/connected/lobby/tests/lobby-route-grace.test.ts`. Render the route component (or a wrapper) with mocked `useLobby` return values. Verify:
  1. Lobby content remains visible during grace period after cancel
  2. LobbyCreationContent appears after grace expiry with empty lobby
  3. LobbyCreationContent appears immediately when no prior lobby existed
  Use fake timers for the 3000ms window.
  **Must NOT do**: Test the full LCU stack.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: focused integration tests
  - Skills: [] — Reason: standard React component testing

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: — | Blocked By: T4

  **References**:
  - Component: `src/routes/connected/lobby/route.tsx`
  - Test pattern: `src/features/gameflow/tests/match-acceptance-flow.test.ts`

  **Acceptance Criteria**:
  - [ ] All 3 test cases pass
  - [ ] Tests verify DOM absence/presence of `LobbyCreationContent` and lobby elements
  - [ ] `bun test` passes

  **QA Scenarios**:
  ```
  Scenario: Run integration tests
    Tool: Bash
    Steps: `bun test apps/web-next/src/routes/connected/lobby/tests/lobby-route-grace.test.ts`
    Expected: 3/3 pass
    Evidence: .sisyphus/evidence/task-6-integration-output.txt
  ```

  **Commit**: YES | Message: `test(lobby): integration tests for grace period on cancel` | Files: `src/routes/connected/lobby/tests/lobby-route-grace.test.ts`

- [x] T7. Browser QA — verify no flicker with logs

  **What to do**: Use `agent-browser` to automate the full flow: connect → create/join lobby → start queue → cancel → verify `LobbyCreationContent` never appears. Capture console logs and optionally record a performance timeline to prove zero frames of the creation UI.
  **Must NOT do**: Rely on manual visual confirmation alone; logs/timeline are the acceptance gate.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: end-to-end verification with browser automation
  - Skills: [`agent-browser`] — Reason: headless browser automation

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: — | Blocked By: T4

  **References**:
  - Flow: `src/features/queue/components/queue-overlay.tsx:49-51` — cancel button
  - Route: `src/routes/connected/lobby/route.tsx:61-69` — decision gate

  **Acceptance Criteria**:
  - [ ] Browser automation completes cancel flow without assertions failing
  - [ ] Console log evidence shows `hasLobby` never flips to `false` during cancel
  - [ ] Performance/timeline recording shows zero paint of `LobbyCreationContent`

  **QA Scenarios**:
  ```
  Scenario: End-to-end no-flicker verification
    Tool: agent-browser
    Steps:
      1. Open app, connect to rift-next
      2. Ensure lobby exists with >=1 member
      3. Click "Buscar Partida"
      4. Wait for QueueOverlay
      5. Click "Cancelar Cola"
      6. Wait 5 seconds
      7. Check DOM: assert LobbyCreationContent is absent
      8. Check logs: assert no "members.length=0 && !isSearching" state
    Expected: No flicker, no creation content in DOM
    Evidence: .sisyphus/evidence/task-7-browser-qa.json
  ```

  **Commit**: NO

## Final Verification Wave (MANDATORY)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**

- [x] F1. Plan Compliance Audit — oracle
  - Verify all tasks comply with scope boundaries (no navigation mapping changes, no global cache policy changes)
- [x] F2. Code Quality Review — unspecified-high
  - Review `useLobby.ts`, `route.tsx`, `lcu-mutations.ts` for TypeScript strictness, lint compliance, no `any`
- [x] F3. Real Manual QA — unspecified-high (+ agent-browser if UI)
  - Re-run browser automation; confirm zero flicker across 3 cancel cycles
- [x] F4. Scope Fidelity Check — deep
  - Verify no changes outside `features/lobby`, `routes/connected/lobby`, `core/lcu/lcu-mutations.ts`, and test files

## Commit Strategy
- **T2, T3, T4, T5, T6** each get their own atomic commit with conventional message
- **T1 and T7** are diagnostic/QA — no commits
- Final verification may produce a formatting/lint fix commit if needed

## Success Criteria
- `bun test` passes (including new tests)
- `bun run lint` and `bun run fmt:check` pass
- Browser logs/timeline prove zero frames of `LobbyCreationContent` during cancel
- Real empty lobby still correctly shows `LobbyCreationContent`
- Grace period clears on explicit leave/disband without delay
