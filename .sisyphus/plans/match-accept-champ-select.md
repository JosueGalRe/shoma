# Align web-next Match Acceptance & Champion Select with Legacy Behavior

## TL;DR
> **Summary**: Make web-next's match acceptance and champion select flow behave like legacy web by adding auto-navigation between routes based on gameflow phase, converting ready-check to an overlay with sound/vibration, and auto-opening the champion picker on the player's turn.
> **Deliverables**: Global gameflow navigation hook, ready-check overlay component, queue-pop feedback utilities, champ-select auto-open picker, integration tests, browser QA evidence
> **Effort**: Medium
> **Parallel**: YES - 4 waves
> **Critical Path**: Wave 1 (foundation hooks) → Wave 2 (feature integration) → Wave 3 (QA) → Wave 4 (verification)

## Context
### Original Request
User wants web-next to behave like legacy web for match acceptance and champion select. Legacy uses stacked components (no router) that show/hide automatically based on LCU state. Web-next uses separate TanStack Router routes but lacks automatic navigation and some legacy UX behaviors.

### Interview Summary
- **Navigation**: Router guard / watcher global that auto-navigates between routes based on gameflow phase
- **Ready-check UX**: Convert to overlay/modal (not a separate route) with sound/vibration on queue pop
- **Ready-check fallback**: Auto-redirect to lobby on expire/decline
- **Game modes**: All modes at once (fix base flow first)
- **QA**: Use agent-browser-automation for exploratory testing
- **Champ-select**: Auto-open champion picker on player's turn (like legacy)

### Metis Review (gaps addressed)
- Phase → route mapping table must be explicit before implementation
- Navigation must be idempotent (don't navigate if already on target route)
- Sound/vibration must be transition-based, not render-based
- Ready-check overlay must clean up on phase exit
- Champion picker auto-open must respect manual dismissal until action changes
- Must not override unrelated connected routes (settings, debug, etc.)
- Must not introduce protocol changes or replace TanStack Router architecture

## Work Objectives
### Core Objective
Align web-next's match acceptance and champion select UX with legacy web behavior while preserving the modern React + TanStack Router architecture.

### Deliverables
1. Global gameflow phase watcher hook with automatic route navigation
2. Ready-check overlay component (replacing `/connected/ready-check` route)
3. Queue-pop sound + vibration feedback utilities
4. Champ-select auto-open picker on local player's turn
5. Integration tests for the complete flow
6. Browser QA evidence via agent-browser-automation

### Definition of Done (verifiable conditions with commands)
- [x] `bun test apps/web-next/src` passes (existing + new tests)
- [x] `bun run lint` passes with zero new warnings
- [x] `bun run doctor:react` score remains >= 75
- [x] Browser QA scenarios pass (happy path + edge cases)
- [x] Ready-check overlay appears without changing URL to `/connected/ready-check`
- [x] Auto-navigation works for all gameflow phase transitions

### Must Have
- Auto-navigation: Lobby → Queue → ReadyCheck → ChampSelect → Lobby
- Ready-check overlay with accept/decline buttons and countdown
- Sound + vibration on queue pop (Matchmaking → ReadyCheck transition)
- Auto-open champion picker when local player has an active pick/ban action
- Fallback to lobby when ready-check expires or is declined
- Idempotent navigation (no thrashing)

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)
- MUST NOT replace TanStack Router with stacked components
- MUST NOT change protocol contract types or wire format
- MUST NOT add new settings/preferences UI for sound/vibration
- MUST NOT override unrelated routes (settings, social, debug)
- MUST NOT introduce new dependencies for sound (use existing Web Audio API or HTMLAudioElement)
- MUST NOT auto-navigate from non-connected routes
- MUST NOT spam sound/vibration on re-renders or reconnects

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- **Test decision**: Tests-after (integration tests + browser QA)
- **QA policy**: Every task has agent-executed scenarios
- **Evidence**: .sisyphus/evidence/task-{N}-{slug}.{ext}

## Execution Strategy
### Parallel Execution Waves
> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks for max parallelism.

Wave 1: Foundation (shared hooks & utilities)
Wave 2: Feature integration (overlay, auto-open, navigation)
Wave 3: Testing & QA (unit, integration, browser)
Wave 4: Final verification (compliance, quality, scope)

### Dependency Matrix (full, all tasks)
| Task | Blocks | Blocked By |
|------|--------|------------|
| 0. Dev-mode LCU mock API | 1-5, 8 (for QA) | - |
| 1. useGameflowNavigation hook | 4, 5, 6b | - |
| 2. Queue-pop feedback utils | 4 | - |
| 3. Ready-check overlay component | 4 | - |
| 4. Integrate ready-check overlay | 7, 8, 9 | 1, 2, 3 |
| 5. Champ-select auto-open picker | 7, 8 | 1 |
| 6. LCU mock harness | 6b, 7 | - |
| 6b. Unit tests for gameflow nav | - | 1, 6 |
| 7. Integration tests for flow | - | 4, 5, 6 |
| 8. Browser QA with agent-browser | - | 0, 4, 5 |
| 9. Remove /connected/ready-check route | - | 4 |
| F1. Plan Compliance Audit | - | 1-9 |
| F2. Code Quality Review | - | 1-9 |
| F3. Real Manual QA | - | 1-9 |
| F4. Scope Fidelity Check | - | 1-9 |

### Agent Dispatch Summary (wave → task count → categories)
| Wave | Tasks | Categories |
|------|-------|------------|
| 1 | 5 | quick, deep |
| 2 | 3 | deep, visual-engineering |
| 3 | 3 | quick, deep |
| 4 | 4 | deep, unspecified-high |

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 0. Create dev-mode LCU mock API exposed to browser

  **What to do**:
  - Create `apps/web-next/src/core/rift/lcu-mock-dev.ts`
  - When `import.meta.env.DEV` is true, monkey-patch or wrap `useSharedLCUTransport` to expose `window.__mimicMockLcu(path, data)`
  - `window.__mimicMockLcu` should:
    - Accept path aliases: `'gameflowPhase'`, `'readyCheck'`, `'champSelectSession'`, `'queueSearch'`
    - Map aliases to full LCU paths (`/lol-gameflow/v1/gameflow-phase`, etc.)
    - Emit observer update events through the transport's observer sync mechanism
    - Update React Query cache directly for immediate UI feedback
  - Mount this in `apps/web-next/src/main.tsx` behind `if (import.meta.env.DEV)` guard
  - Document usage in a code comment

  **Must NOT do**:
  - Do not include in production builds
  - Do not modify production transport code permanently

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: requires understanding of LCU transport + observer sync + React Query cache
  - Skills: [] - Reason: no special skills needed
  - Omitted: `agent-browser` - Reason: this is a dev utility, not browser automation

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 1-5, 8 | Blocked By: -

  **References**:
  - Pattern: `apps/web-next/src/core/rift/lcu-transport.ts` - transport interface
  - Pattern: `apps/web-next/src/core/lcu/lcu-observer-sync.ts` - observer sync mechanism
  - Pattern: `apps/web-next/src/main.tsx` - entry point

  **Acceptance Criteria**:
  - [ ] `window.__mimicMockLcu` exists in dev mode
  - [ ] Calling it updates the UI without page reload
  - [ ] No code included in production bundle

  **QA Scenarios**:
  ```
  Scenario: Dev mock API works
    Tool: agent-browser-automation
    Steps:
      1. Start dev server: bun run dev:web-next
      2. Open http://localhost:5173/connected/lobby
      3. In browser console, execute window.__mimicMockLcu('gameflowPhase', 'ReadyCheck')
    Expected: UI updates to show ready-check overlay without page reload
    Evidence: .sisyphus/evidence/task-0-dev-mock.png
  ```

  **Commit**: YES | Message: `feat(dev): add LCU mock API for development` | Files: `apps/web-next/src/core/rift/lcu-mock-dev.ts`, `apps/web-next/src/main.tsx`

- [x] 1. Create `useGameflowNavigation` global hook

  **What to do**: 
  - Create `apps/web-next/src/features/gameflow/hooks/use-gameflow-navigation.ts`
  - Subscribe to `gameflowPhaseDescriptor` via `useQuery` + `useLcuObserverSync`
  - Use `useNavigate` from TanStack Router to auto-navigate based on phase changes
  - Maintain `previousPhase` ref to detect transitions (not re-renders)
  - Phase → route mapping:
    - `Lobby` → `/connected/lobby`
    - `Matchmaking` → `/connected/queue`
    - `ReadyCheck` → stay on current route (ready-check is now overlay)
    - `ChampSelect` → `/connected/champ-select`
    - `InProgress` → `/connected/lobby` (or stay, depending on UX)
    - `None` → `/connected/lobby`
  - Guard: only auto-navigate when on `/connected/*` routes; never override unrelated routes
  - Idempotency: check current route before navigating; do nothing if already on target
  - Mount this hook in `apps/web-next/src/routes/connected/route.tsx` (the connected layout)

  **Must NOT do**: 
  - Do not navigate from non-connected routes
  - Do not navigate on every render (only on phase changes)
  - Do not hard-code route strings; use route tree generated types if possible

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: requires understanding of TanStack Router + LCU observer sync + Zustand gameflow store
  - Skills: `tanstack-router-best-practices` - Reason: correct navigation patterns, route guards
  - Omitted: `zustand` - Reason: hook uses React Query, not Zustand directly (gameflow store exists but this hook should observe LCU directly for reliability)

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 2, 4, 5 | Blocked By: -

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `apps/web-next/src/routes/connected/route.tsx` - mount point for global hook
  - Pattern: `apps/web-next/src/features/queue/use-queue.ts:72-76` - phase change detection pattern
  - Pattern: `apps/web-next/src/lib/reconnect-utils.ts` - useNavigate usage example
  - Pattern: `apps/web-next/src/core/lcu/lcu-queries.ts:289-293` - gameflowPhaseDescriptor
  - API/Type: `apps/web-next/src/core/state/gameflow-store.ts` - valid transitions reference
  - External: `https://tanstack.com/router/latest/docs/framework/react/guide/navigation` - programmatic navigation

  **Acceptance Criteria** (agent-executable only):
  - [ ] `bun test apps/web-next/src/features/gameflow` passes
  - [ ] Hook exists at `apps/web-next/src/features/gameflow/hooks/use-gameflow-navigation.ts`
  - [ ] Hook is mounted in `apps/web-next/src/routes/connected/route.tsx`
  - [ ] Unit test mocks gameflow phase change `Matchmaking` → `ReadyCheck` and asserts no navigation occurs (overlay stays)
  - [ ] Unit test mocks `ReadyCheck` → `ChampSelect` and asserts navigation to `/connected/champ-select`
  - [ ] Unit test mocks `ChampSelect` → `Lobby` and asserts navigation to `/connected/lobby`
  - [ ] Unit test verifies no navigation when already on target route
  - [ ] Unit test verifies no navigation from `/` (non-connected route)

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Auto-navigation from queue to champ-select
    Tool: agent-browser-automation
    Steps: 
      1. Start dev server: bun run dev:web-next
      2. Open http://localhost:5173/connected/queue
      3. In browser console, call window.__mimicMockLcu('gameflowPhase', 'ChampSelect')
    Expected: URL changes to /connected/champ-select
    Evidence: .sisyphus/evidence/task-1-nav-to-champ-select.png

  Scenario: No navigation from non-connected route
    Tool: agent-browser-automation
    Steps:
      1. Start dev server: bun run dev:web-next
      2. Open http://localhost:5173/
      3. In browser console, call window.__mimicMockLcu('gameflowPhase', 'ChampSelect')
    Expected: URL remains /
    Evidence: .sisyphus/evidence/task-1-no-nav-from-root.png
  ```

  **Commit**: YES | Message: `feat(gameflow): add auto-navigation hook` | Files: `apps/web-next/src/features/gameflow/hooks/use-gameflow-navigation.ts`, `apps/web-next/src/routes/connected/route.tsx`, `apps/web-next/src/features/gameflow/tests/use-gameflow-navigation.test.ts`

- [x] 2. Create queue-pop sound + vibration feedback utilities

  **What to do**:
  - Create `apps/web-next/src/features/feedback/queue-pop-feedback.ts`
  - Export `playQueuePopSound(): Promise<void>` using `new Audio()` with legacy sound file `legacy/web/src/static/queue-pop.mp3` (copy to `apps/web-next/public/` or `src/assets/`)
  - Export `triggerQueuePopVibration(): void` using `navigator.vibrate([500, 250, 500, 250, 500, 250, 500, 250])` (same pattern as legacy)
  - Handle autoplay restrictions: catch Audio play promise rejection, don't crash
  - Handle missing vibration API: check `navigator.vibrate` existence
  - Create `useQueuePopFeedback()` hook that triggers both on first transition into ReadyCheck phase
  - Use `previousPhase` ref to ensure trigger only happens once per transition

  **Must NOT do**:
  - Do not add new npm dependencies for audio
  - Do not show permission prompts or settings UI
  - Do not trigger on re-renders or reconnects

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: small utility, well-defined scope
  - Skills: [] - Reason: no special skills needed
  - Omitted: `agent-browser` - Reason: not needed for utility implementation

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4 | Blocked By: -

  **References**:
  - Pattern: `legacy/web/src/components/ready-check/ready-check.ts:52-58` - sound + vibration logic
  - Pattern: `apps/web-next/src/features/queue/use-queue.ts:72-76` - phase transition detection
  - File: `legacy/web/src/static/queue-pop.mp3` - sound asset to copy/reuse

  **Acceptance Criteria**:
  - [ ] Utility exists at `apps/web-next/src/features/feedback/queue-pop-feedback.ts`
  - [ ] `bun test apps/web-next/src/features/feedback` passes
  - [ ] Unit test mocks `navigator.vibrate` and asserts called with exact legacy pattern
  - [ ] Unit test mocks `Audio.prototype.play` and asserts called once per transition
  - [ ] Unit test asserts no crash when `navigator.vibrate` is undefined
  - [ ] Unit test asserts no crash when `Audio.prototype.play` rejects

  **QA Scenarios**:
  ```
  Scenario: Sound plays on queue pop
    Tool: agent-browser-automation
    Steps:
      1. Start dev server: bun run dev:web-next
      2. Open http://localhost:5173/connected/queue
      3. In browser console, call window.__mimicMockLcu('gameflowPhase', 'ReadyCheck')
    Expected: Audio play called once, no console errors
    Evidence: .sisyphus/evidence/task-2-sound-playback.log

  Scenario: Vibration on supported device
    Tool: agent-browser-automation
    Steps:
      1. Start dev server: bun run dev:web-next
      2. Emulate mobile device with vibration support via DevTools
      3. Open http://localhost:5173/connected/queue
      4. In browser console, call window.__mimicMockLcu('gameflowPhase', 'ReadyCheck')
    Expected: navigator.vibrate called with [500, 250, 500, 250, 500, 250, 500, 250]
    Evidence: .sisyphus/evidence/task-2-vibration.log
  ```

  **Commit**: YES | Message: `feat(feedback): add queue-pop sound and vibration` | Files: `apps/web-next/src/features/feedback/queue-pop-feedback.ts`, `apps/web-next/public/queue-pop.mp3`, tests

- [x] 3. Build ready-check overlay component

  **What to do**:
  - Create `apps/web-next/src/features/ready-check/components/ready-check-overlay.tsx`
  - Extract UI from `apps/web-next/src/routes/connected/ready-check/route.tsx` into reusable overlay
  - Use existing `useReadyCheck()` hook for logic (accept, decline, timer, status)
  - Render as fixed overlay (`fixed inset-0 z-50`) with backdrop blur
  - Show only when ready-check state is `InProgress` (from LCU) or `pending` (from store)
  - Include countdown timer and progress bar (like legacy `progressWidth`)
  - Disable buttons after response (like legacy `hasResponded`)
  - Add `data-testid="ready-check-overlay"` for QA selectors
  - Preserve all existing styling (border-lol-border-gold, bg-lol-navy-900/85, etc.)

  **Must NOT do**:
  - Do not change accept/decline mutation logic
  - Do not change ready-check-store.ts
  - Do not break existing ready-check route (will be removed in task 9)

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: UI component extraction and overlay styling
  - Skills: [] - Reason: Tailwind v4 styling, no special skills needed
  - Omitted: `react-patterns` - Reason: straightforward component extraction

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4 | Blocked By: -

  **References**:
  - Source: `apps/web-next/src/routes/connected/ready-check/route.tsx` - existing UI to extract
  - Pattern: `legacy/web/src/components/ready-check/ready-check.vue` - visual layout reference
  - Pattern: `legacy/web/src/components/ready-check/ready-check.ts:67-84` - show/hide + progress logic

  **Acceptance Criteria**:
  - [ ] Component exists at `apps/web-next/src/features/ready-check/components/ready-check-overlay.tsx`
  - [ ] `bun test apps/web-next/src/features/ready-check` passes
  - [ ] Unit test asserts overlay hidden when ready-check is null
  - [ ] Unit test asserts overlay visible when ready-check state is `InProgress`
  - [ ] Unit test asserts buttons disabled after accept/decline
  - [ ] Unit test asserts countdown timer renders correctly

  **QA Scenarios**:
  ```
  Scenario: Overlay appears on queue pop
    Tool: agent-browser-automation
    Steps:
      1. Start dev server: bun run dev:web-next
      2. Open http://localhost:5173/connected/lobby
      3. In browser console, call window.__mimicMockLcu('readyCheck', { state: 'InProgress', timer: 12 })
    Expected: Overlay visible with data-testid="ready-check-overlay", URL remains /connected/lobby
    Evidence: .sisyphus/evidence/task-3-overlay-visible.png

  Scenario: Overlay hides after decline
    Tool: agent-browser-automation
    Steps:
      1. Start dev server: bun run dev:web-next
      2. Open http://localhost:5173/connected/lobby
      3. Call window.__mimicMockLcu('readyCheck', { state: 'InProgress', timer: 12 })
      4. Click decline button
      5. Call window.__mimicMockLcu('readyCheck', null)
    Expected: Overlay not in DOM, URL navigates to /connected/lobby
    Evidence: .sisyphus/evidence/task-3-overlay-hidden.png
  ```

  **Commit**: YES | Message: `feat(ready-check): extract overlay component` | Files: `apps/web-next/src/features/ready-check/components/ready-check-overlay.tsx`, tests

- [x] 4. Integrate ready-check overlay into connected layout with auto-dismiss

  **What to do**:
  - Mount `ReadyCheckOverlay` in `apps/web-next/src/routes/connected/route.tsx`
  - Wire `useQueuePopFeedback()` in the same layout (triggered by gameflow phase transition)
  - When ready-check expires or is declined:
    - Auto-navigate to `/connected/lobby` via `useNavigate`
    - Reset ready-check store status to `pending` (or let it expire naturally)
  - Ensure overlay unmounts/cleans up when gameflow phase changes away from ReadyCheck
  - Remove `ready-check-store` timer logic if redundant with LCU timer (keep store for UI state only)

  **Must NOT do**:
  - Do not break existing queue route
  - Do not auto-navigate if user is on an unrelated connected route (though overlay should still show)

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: integration of multiple hooks, navigation, and state cleanup
  - Skills: `tanstack-router-best-practices` - Reason: navigation patterns in layout
  - Omitted: `zustand` - Reason: store usage is minimal

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 7, 8 | Blocked By: 1, 2, 3

  **References**:
  - Pattern: `apps/web-next/src/routes/connected/route.tsx` - layout mount point
  - Pattern: `apps/web-next/src/features/ready-check/hooks/use-ready-check.ts` - hook to reuse
  - Pattern: `apps/web-next/src/core/state/gameflow-store.ts` - state transitions

  **Acceptance Criteria**:
  - [ ] Overlay mounts in connected layout and shows on queue pop
  - [ ] Sound + vibration trigger on first ReadyCheck phase entry
  - [ ] Auto-navigation to `/connected/lobby` on expire/decline
  - [ ] `bun test apps/web-next/src/routes/connected` passes

  **QA Scenarios**:
  ```
  Scenario: Full ready-check flow
    Tool: agent-browser-automation
    Steps:
      1. Start dev server: bun run dev:web-next
      2. Open http://localhost:5173/connected/lobby
      3. Call window.__mimicMockLcu('gameflowPhase', 'Matchmaking')
      4. Assert URL is /connected/queue
      5. Call window.__mimicMockLcu('gameflowPhase', 'ReadyCheck')
      6. Assert overlay visible, sound played, vibration triggered
      7. Click decline button
      8. Call window.__mimicMockLcu('gameflowPhase', 'Lobby')
      9. Assert URL is /connected/lobby, overlay hidden
    Evidence: .sisyphus/evidence/task-4-full-flow.mp4
  ```

  **Commit**: YES | Message: `feat(ready-check): integrate overlay with auto-dismiss` | Files: `apps/web-next/src/routes/connected/route.tsx`

- [x] 5. Implement champ-select auto-open picker on player's turn

  **What to do**:
  - Modify `apps/web-next/src/routes/connected/champ-select/route.tsx`
  - Add `useEffect` that watches `champSelect.currentAction` and `champSelect.isMyTurn`
  - Auto-open `ChampionPicker` when:
    - `isMyTurn` is true
    - `currentAction` exists and is not completed
    - `currentAction` type is 'pick' or 'ban'
    - This is a NEW action (different from previous tracked action)
  - Use `useRef` to track the last seen action ID to avoid reopening after manual close
  - Only auto-open during `BAN_PICK` phase (check `session.timer.phase` or `phase` from hook)
  - Ensure picker can still be manually opened/closed

  **Must NOT do**:
  - Do not open picker when it's not the local player's turn
  - Do not reopen picker if user manually closed it during the same action
  - Do not open picker during PLANNING or FINALIZATION phases

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: requires understanding of champ-select session lifecycle
  - Skills: `react-patterns` - Reason: useEffect + useRef patterns for action tracking
  - Omitted: `zustand` - Reason: uses React Query data directly

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 7, 8 | Blocked By: 1

  **References**:
  - Pattern: `legacy/web/src/components/champ-select/champ-select.ts:241-248` - auto-open logic
  - Pattern: `apps/web-next/src/routes/connected/champ-select/route.tsx` - current route
  - Pattern: `apps/web-next/src/features/champ-select/hooks/use-champ-select.ts:94-101` - currentAction derivation

  **Acceptance Criteria**:
  - [ ] Auto-open works when local player gets a new pick action
  - [ ] Auto-open works when local player gets a new ban action
  - [ ] Does NOT reopen if user manually closed picker during same action
  - [ ] Does NOT open when it's another player's turn
  - [ ] Does NOT open during waiting phase
  - [ ] `bun test apps/web-next/src/routes/connected/champ-select` passes

  **QA Scenarios**:
  ```
  Scenario: Picker auto-opens on my turn
    Tool: agent-browser-automation
    Steps:
      1. Start dev server: bun run dev:web-next
      2. Open http://localhost:5173/connected/champ-select
      3. Call window.__mimicMockLcu('champSelectSession', {
           actions: [[{ id: 1, actorCellId: 0, type: 'pick', completed: false, championId: 0 }]],
           localPlayerCellId: 0,
           myTeam: [{ cellId: 0, championId: 0 }],
           timer: { phase: 'BAN_PICK', adjustedTimeLeftInPhase: 30000 }
         })
    Expected: ChampionPicker modal is visible
    Evidence: .sisyphus/evidence/task-5-auto-open.png

  Scenario: Picker does not reopen after manual close
    Tool: agent-browser-automation
    Steps:
      1. Start dev server: bun run dev:web-next
      2. Open http://localhost:5173/connected/champ-select
      3. Call window.__mimicMockLcu('champSelectSession', { ...same action id: 1... })
      4. Close picker manually
      5. Call window.__mimicMockLcu('champSelectSession', { ...same action id: 1... }) again
    Expected: Picker remains closed
    Evidence: .sisyphus/evidence/task-5-manual-close.png
  ```

  **Commit**: YES | Message: `feat(champ-select): auto-open picker on player's turn` | Files: `apps/web-next/src/routes/connected/champ-select/route.tsx`

- [x] 6. Create LCU mock harness for tests and QA

  **What to do**:
  - Create `apps/web-next/src/testing/lcu-mock.ts` providing a mock `LcuTransport` and observer helpers
  - Export `createMockLcuTransport(initialState?)` that returns a transport with:
    - `request(path, method?, body?)` returning mockable responses
    - `emitUpdate(path, content)` to simulate WebSocket observer updates
    - Pre-built mock states for `gameflowPhase`, `readyCheck`, `champSelectSession`, `queueSearch`
  - Export `mockGameflowPhase(phase: string)` helper
  - Export `mockReadyCheck(state: ReadyCheckState | null)` helper
  - Export `mockChampSelectSession(session: ChampSelectSession | null)` helper
  - Add to `apps/web-next/src/testing/index.ts` barrel export
  - Verify harness works by writing a minimal smoke test

  **Must NOT do**:
  - Do not modify production code
  - Do not add heavy dependencies

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: requires understanding of LCU transport interface
  - Skills: [] - Reason: Bun test runner
  - Omitted: `agent-browser` - Reason: not needed for harness

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 6, 7, 8 | Blocked By: -

  **References**:
  - Pattern: `apps/web-next/src/core/rift/lcu-transport.ts` - transport interface to mock
  - Pattern: `apps/web-next/src/features/social/components/SocialPanel.test.ts` - existing Bun test pattern
  - Pattern: `apps/web-next/src/core/lcu/lcu-queries.ts` - query descriptors to feed mock data

  **Acceptance Criteria**:
  - [ ] `bun test apps/web-next/src/testing/lcu-mock.smoke.test.ts` passes
  - [ ] Mock transport implements `request()` and `emitUpdate()`
  - [ ] Helpers return correctly typed mock data

  **QA Scenarios**:
  ```
  Scenario: Mock harness smoke test
    Tool: Bash
    Steps: bun test apps/web-next/src/testing/lcu-mock.smoke.test.ts
    Expected: All tests pass, 0 failures
    Evidence: .sisyphus/evidence/task-6-smoke-test.log
  ```

  **Commit**: YES | Message: `test(harness): add LCU mock utilities` | Files: `apps/web-next/src/testing/lcu-mock.ts`, `apps/web-next/src/testing/index.ts`, `apps/web-next/src/testing/lcu-mock.smoke.test.ts`

- [x] 6b. Write unit tests for gameflow navigation

  **What to do**:
  - Create `apps/web-next/src/features/gameflow/hooks/use-gameflow-navigation.test.ts` (colocated with hook, following existing project convention)
  - Use mock harness from task 6 to mock LCU transport
  - Mock `useNavigate` and current route via TanStack Router test utilities
  - Test all phase → route mappings
  - Test idempotency
  - Test non-connected route guard
  - Test reconnection (phase already ReadyCheck on mount)

  **Must NOT do**:
  - Do not test actual LCU transport
  - Do not test actual browser navigation (mock TanStack Router)

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: straightforward unit tests
  - Skills: [] - Reason: Bun native test runner
  - Omitted: `agent-browser` - Reason: unit tests, not browser tests

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: - | Blocked By: 1, 6

  **References**:
  - Pattern: `apps/web-next/src/features/social/components/SocialPanel.test.ts` - existing test pattern
  - Pattern: `apps/web-next/src/features/queue/use-queue.ts` - mock patterns for LCU queries
  - Harness: `apps/web-next/src/testing/lcu-mock.ts` - from task 6

  **Acceptance Criteria**:
  - [ ] All test cases pass with `bun test`
  - [ ] Coverage >= 80% for navigation logic

  **QA Scenarios**:
  ```
  Scenario: Unit test suite passes
    Tool: Bash
    Steps: bun test apps/web-next/src/features/gameflow/hooks/use-gameflow-navigation.test.ts
    Expected: All tests pass, 0 failures
    Evidence: .sisyphus/evidence/task-6b-unit-tests.log
  ```

  **Commit**: YES | Message: `test(gameflow): add navigation unit tests` | Files: `apps/web-next/src/features/gameflow/hooks/use-gameflow-navigation.test.ts`

- [x] 7. Write integration tests for complete match acceptance flow

  **What to do**:
  - Create `apps/web-next/src/features/gameflow/tests/match-acceptance-flow.test.ts` (colocated, following project convention)
  - Use mock harness from task 6 to simulate full LCU lifecycle: Lobby → Matchmaking → ReadyCheck → ChampSelect → Lobby
  - Render `ConnectedRouteComponent` with mocked router and transport
  - Assert route changes at each phase using `mockGameflowPhase()`
  - Assert ready-check overlay visibility via DOM query
  - Assert sound/vibration calls are spied correctly
  - Assert auto-navigation to lobby on decline using `mockGameflowPhase('Lobby')`

  **Must NOT do**:
  - Do not require real LCU connection
  - Do not test actual audio playback in CI (spy on Audio.prototype.play)

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: complex integration scenario
  - Skills: [] - Reason: Bun test runner
  - Omitted: `agent-browser` - Reason: integration tests use mocks

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: - | Blocked By: 4, 5, 6

  **References**:
  - Pattern: `apps/web-next/src/features/social/components/SocialPanel.test.ts` - existing test pattern
  - Pattern: `apps/web-next/src/core/rift/lcu-transport.ts` - transport interface to mock
  - Harness: `apps/web-next/src/testing/lcu-mock.ts` - from task 6

  **Acceptance Criteria**:
  - [ ] Integration test covers full Lobby → Queue → ReadyCheck → ChampSelect → Lobby flow
  - [ ] All tests pass with `bun test`

  **QA Scenarios**:
  ```
  Scenario: Integration test suite passes
    Tool: Bash
    Steps: bun test apps/web-next/src/features/gameflow/tests/match-acceptance-flow.test.ts
    Expected: All tests pass, 0 failures
    Evidence: .sisyphus/evidence/task-7-integration-tests.log
  ```

  **Commit**: YES | Message: `test(integration): add match acceptance flow tests` | Files: `apps/web-next/src/features/gameflow/tests/match-acceptance-flow.test.ts`

- [x] 8. Browser QA with agent-browser-automation

  **What to do**:
  - Start `bun run dev:web-next` (or build + preview)
  - Use agent-browser-automation to:
    1. Connect to app
    2. Navigate to lobby
    3. Mock gameflow phases via dev tools or mock server
    4. Capture screenshots/videos of each transition
    5. Verify overlay behavior
    6. Verify auto-navigation
    7. Verify champ-select picker auto-open
  - Document any visual regressions

  **Must NOT do**:
  - Do not test with real LCU (use mocks)
  - Do not modify production data

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: exploratory QA
  - Skills: `agent-browser-automation` - Reason: required for browser testing
  - Omitted: `playwright` - Reason: agent-browser-automation is preferred per project conventions

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: - | Blocked By: 4, 5

  **References**:
  - Command: `bun run dev:web-next`
  - Skill: `agent-browser-automation` - headless browser automation

  **Acceptance Criteria**:
  - [ ] Screenshots/videos captured for all phase transitions
  - [ ] No console errors during flow
  - [ ] Visual layout matches legacy behavior (overlay centered, timer visible, buttons responsive)

  **QA Scenarios**:
  ```
  Scenario: Full browser QA
    Tool: agent-browser-automation
    Steps:
      1. Start dev server: bun run dev:web-next
      2. Open http://localhost:5173/connected/lobby
      3. Call window.__mimicMockLcu('gameflowPhase', 'Matchmaking')
      4. Take screenshot
      5. Call window.__mimicMockLcu('gameflowPhase', 'ReadyCheck')
      6. Take screenshot
      7. Call window.__mimicMockLcu('gameflowPhase', 'ChampSelect')
      8. Take screenshot
      9. Call window.__mimicMockLcu('gameflowPhase', 'Lobby')
      10. Take screenshot
    Expected: All screenshots show expected UI, no console errors
    Evidence: .sisyphus/evidence/task-8-browser-qa/
  ```

  **Commit**: NO | Message: N/A | Files: N/A (QA is validation, not code)

- [x] 9. Convert `/connected/ready-check` route to redirect

  **What to do**:
  - Replace `apps/web-next/src/routes/connected/ready-check/route.tsx` content with a redirect component
  - Use `redirect({ to: '/connected/lobby' })` from `@tanstack/react-router` in `beforeLoad` or render a `<Navigate>` component
  - Keep the file to preserve route tree generation but remove all ready-check UI logic
  - Remove ready-check route from any imports outside of the route file
  - Regenerate route tree (`bun run dev` should auto-regenerate)
  - Verify no broken links or references

  **Must NOT do**:
  - Do not delete `features/ready-check/` (hooks and overlay component are still used)
  - Do not delete the route file entirely (TanStack file-based routing needs the file to exist for tree generation, even if it's just a redirect)
  - Do not break existing tests that import from ready-check features

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: cleanup task
  - Skills: `tanstack-router-best-practices` - Reason: correct redirect pattern
  - Omitted: [] - Reason: straightforward

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: - | Blocked By: 4

  **References**:
  - File: `apps/web-next/src/routes/connected/ready-check/route.tsx` - to convert to redirect
  - Pattern: `apps/web-next/src/routes/connected/index/route.tsx` - existing redirect example
  - External: `https://tanstack.com/router/latest/docs/framework/react/guide/navigation#redirect` - redirect API

  **Acceptance Criteria**:
  - [ ] Route file contains only redirect logic
  - [ ] `bun run build` passes
  - [ ] `bun run lint` passes
  - [ ] Navigation to `/connected/ready-check` redirects to `/connected/lobby`

  **QA Scenarios**:
  ```
  Scenario: Route redirects to lobby
    Tool: agent-browser-automation
    Steps:
      1. Navigate to /connected/ready-check
    Expected: Redirected to /connected/lobby
    Evidence: .sisyphus/evidence/task-9-route-redirect.png
  ```

  **Commit**: YES | Message: `chore(routes): convert /connected/ready-check to redirect` | Files: `apps/web-next/src/routes/connected/ready-check/route.tsx`

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.
- [x] F1. Plan Compliance Audit — oracle
- [x] F2. Code Quality Review — unspecified-high
- [x] F3. Real Manual QA — unspecified-high (+ agent-browser if UI)
- [x] F4. Scope Fidelity Check — deep

## Commit Strategy
- Task 1-3: Independent commits in Wave 1
- Task 4: Integration commit in Wave 2
- Task 5: Feature commit in Wave 2
- Task 6-7: Test commits in Wave 3
- Task 9: Cleanup commit in Wave 2 (after task 4)
- Final verification: No commits (review only)

## Success Criteria
- [x] Auto-navigation works for all gameflow phases without thrashing
- [x] Ready-check overlay appears on queue pop with sound + vibration
- [x] Ready-check auto-dismisses to lobby on expire/decline
- [x] Champion picker auto-opens on local player's turn
- [x] All unit and integration tests pass
- [x] Browser QA captures evidence of correct behavior
- [x] No lint errors, React Doctor score >= 75
- [x] Legacy route `/connected/ready-check` removed
