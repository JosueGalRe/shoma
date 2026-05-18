# Fix Ready-Check Bugs

## TL;DR

> **Summary**: Fix 4 bugs in the matchmaking ready-check flow: HTTP 405 on decline/accept, timer counting up instead of down, ugly visual borders/background, and background scrolling while overlay is open.
> **Deliverables**: Updated `lcu-mutations.ts`, `use-ready-check.ts`, `ready-check-overlay.tsx`, new/updated tests, named duration constant.
> **Effort**: Short
> **Parallel**: NO - tasks have file dependencies and must be sequential
> **Critical Path**: Task 1 (constant) → Task 2 (mutation method) → Task 3 (timer logic) → Task 4 (overlay visuals + scroll lock) → Task 5 (tests) → F1-F4

## Context

### Original Request

User reports 4 issues during matchmaking ready-check:

1. Error when accepting/declining a match (HTTP 405 on decline)
2. Timer shows wrong time and counts up instead of down
3. Visual issues: weird background, ugly borders
4. Can scroll background when overlay is open

### Interview Summary

- No user interview needed; all root causes discovered through codebase exploration.
- Legacy `web/` and `src-old/` confirm accept/decline use POST, not PUT.
- Legacy ready-check progress bar formula (`12 - timer`) confirms LCU `timer` is **elapsed time** in seconds, not remaining.
- Visual artifacts traced to double `backdrop-blur-sm` + `animate-pulse` inner border div.
- Missing body scroll lock when overlay is visible.

### Metis Review (gaps addressed)

- **Magic number `12`**: Extract named constant `READY_CHECK_DURATION_SECONDS` shared across hook and overlay.
- **Scroll lock cleanup**: Store previous `document.body.style.overflow` and restore on cleanup, don't clobber.
- **SSR/test guard**: Wrap `document` access with `typeof document !== 'undefined'`.
- **Progress bar semantics**: After fix, `timer` represents remaining seconds; progress width becomes `(timer / READY_CHECK_DURATION_SECONDS) * 100`.
- **Test coverage**: Add tests for POST method, timer mapping, scroll lock, and removed CSS classes.
- **Scope guardrail**: Do NOT touch ready-check state machine, remote accepted/declined syncing, or legacy `web/`.

## Work Objectives

### Core Objective

Fix all 4 ready-check bugs with minimal, targeted changes to 3 files plus tests.

### Deliverables

1. `apps/web-next/src/core/lcu/lcu-mutations.ts` — accept/decline use POST
2. `apps/web-next/src/features/ready-check/hooks/use-ready-check.ts` — correct remaining-time countdown
3. `apps/web-next/src/features/ready-check/components/ready-check-overlay.tsx` — fix visuals and add scroll lock
4. `apps/web-next/src/features/ready-check/components/ready-check-overlay.test.tsx` — updated visibility + new tests
5. `apps/web-next/src/features/ready-check/hooks/use-ready-check.test.ts` — new timer + mutation method tests

### Definition of Done (verifiable conditions with commands)

- `bun test apps/web-next/src/features/ready-check` passes
- `bun test apps/web-next/src/core/lcu` passes
- `bun run lint` exits 0
- `bun run fmt:check` exits 0
- Ready-check overlay tests assert POST method, correct timer display, body scroll lock, and absence of pulse border

### Must Have

- Accept and decline mutations use POST
- Timer counts down from remaining time (12 - elapsed)
- Progress bar fills from 100% to 0% as time runs out
- No body scroll when overlay is visible
- Cleaner overlay visuals (no pulse border, no duplicate blur)

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)

- Do NOT redesign the entire overlay or change color scheme
- Do NOT touch legacy `web/` code
- Do NOT modify ready-check parser, store state machine, or LCU observer sync
- Do NOT add new dependencies
- Do NOT change queue or other countdown consumers

## Verification Strategy

> ZERO HUMAN INTERVENTION - all verification is agent-executed.

- Test decision: tests-after (existing test infra, minimal additions)
- QA policy: Every task has agent-executed scenarios
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves

Wave 1: Extract constant + fix mutation method + fix timer logic (3 tasks, file-ordered)
Wave 2: Fix overlay visuals + scroll lock + progress bar (1 task)
Wave 3: Update/write tests (1 task)
Wave 4: Final verification (F1-F4)

### Dependency Matrix

| Task | Blocks | Blocked By |
| ---- | ------ | ---------- |
| 1    | 3      | —          |
| 2    | 3      | —          |
| 3    | 4      | 1, 2       |
| 4    | 5      | 3          |
| 5    | F1-F4  | 4          |

### Agent Dispatch Summary

Wave 1: 2 tasks (quick category)
Wave 2: 1 task (quick category)
Wave 3: 1 task (quick category)
Wave 4: 4 review agents (oracle, unspecified-high x2, deep)

## TODOs

- [x] 1. Extract `READY_CHECK_DURATION_SECONDS` constant

  **What to do**: Add `export const READY_CHECK_DURATION_SECONDS = 12` to a shared location in the ready-check feature. Create `apps/web-next/src/features/ready-check/constants.ts` and export the constant. Update `ready-check-overlay.tsx` line 48 to import and use this constant instead of the magic number `12`.
  **Must NOT do**: Do NOT put this in global constants; keep it scoped to the ready-check feature.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: single constant extraction
  - Skills: [] - not needed

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 3 | Blocked By: —

  **References**:
  - Pattern: `apps/web-next/src/features/queue/use-queue.ts:22` — `MAX_QUEUE_TIMER_SECONDS` naming convention
  - File: `apps/web-next/src/features/ready-check/components/ready-check-overlay.tsx:48` — current magic number `12`

  **Acceptance Criteria**:
  - [ ] `apps/web-next/src/features/ready-check/constants.ts` exists and exports `READY_CHECK_DURATION_SECONDS = 12`
  - [ ] `ready-check-overlay.tsx:48` imports and uses the constant
  - [ ] `bun run lint` passes

  **QA Scenarios**:

  ```
  Scenario: Constant is used correctly
    Tool: Bash
    Steps: grep -n "READY_CHECK_DURATION_SECONDS" apps/web-next/src/features/ready-check/components/ready-check-overlay.tsx
    Expected: Output shows at least one match
    Evidence: .sisyphus/evidence/task-1-constant.txt
  ```

  **Commit**: YES | Message: `refactor(ready-check): extract READY_CHECK_DURATION_SECONDS constant` | Files: `apps/web-next/src/features/ready-check/constants.ts`, `apps/web-next/src/features/ready-check/components/ready-check-overlay.tsx`

- [x] 2. Fix accept/decline HTTP method from PUT to POST

  **What to do**: In `apps/web-next/src/core/lcu/lcu-mutations.ts`, change `method: LcuHttpMethod.PUT` to `method: LcuHttpMethod.POST` in both `useAcceptReadyCheck` (line 103) and `useDeclineReadyCheck` (line 112).
  **Must NOT do**: Do NOT change any other mutation methods (e.g., `useChangeRole`, `useSetQuickplayPlayerSlots` correctly use PUT).

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: two-line method change
  - Skills: [] - not needed

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 5 | Blocked By: —

  **References**:
  - Legacy reference: `legacy/web/src/components/ready-check/ready-check.ts:90,97` — uses POST
  - Migration reference: `apps/web-next/src-old/core/rift/lcu-client.ts` — uses POST
  - Current bug: `apps/web-next/src/core/lcu/lcu-mutations.ts:103,112` — incorrectly uses PUT

  **Acceptance Criteria**:
  - [ ] `useAcceptReadyCheck` uses `LcuHttpMethod.POST`
  - [ ] `useDeclineReadyCheck` uses `LcuHttpMethod.POST`
  - [ ] `bun run lint` passes

  **QA Scenarios**:

  ```
  Scenario: Mutations use POST
    Tool: Bash
    Steps: grep -A6 "useAcceptReadyCheck\|useDeclineReadyCheck" apps/web-next/src/core/lcu/lcu-mutations.ts | grep "method:"
    Expected: Both lines show `LcuHttpMethod.POST`
    Evidence: .sisyphus/evidence/task-2-method.txt
  ```

  **Commit**: YES | Message: `fix(lcu): use POST for ready-check accept/decline` | Files: `apps/web-next/src/core/lcu/lcu-mutations.ts`

- [x] 3. Fix timer logic: use remaining time instead of elapsed

  **What to do**: In `apps/web-next/src/features/ready-check/hooks/use-ready-check.ts`, replace `const countdown = useCountdown(readyCheckSnapshot?.timer ?? 0)` with a calculation that converts LCU elapsed time to remaining time.

  Exact change:

  ```ts
  const elapsedTimer = readyCheckSnapshot?.timer ?? 0
  const countdown = useCountdown(readyCheckSnapshot ? Math.max(0, READY_CHECK_DURATION_SECONDS - elapsedTimer) : 0)
  ```

  Import `READY_CHECK_DURATION_SECONDS` from `../constants`.

  **Must NOT do**: Do NOT change `useCountdown` itself; other consumers depend on it.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: single hook change
  - Skills: [] - not needed

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 4, 5 | Blocked By: 1

  **References**:
  - Pattern: `apps/web-next/src/features/queue/use-queue.ts:54-56` — elapsed-to-remaining conversion
  - File: `apps/web-next/src/features/ready-check/hooks/use-ready-check.ts:37` — current buggy line

  **Acceptance Criteria**:
  - [ ] `use-ready-check.ts` imports `READY_CHECK_DURATION_SECONDS`
  - [ ] `countdown` is initialized with `Math.max(0, READY_CHECK_DURATION_SECONDS - elapsedTimer)`
  - [ ] `bun run lint` passes

  **QA Scenarios**:

  ```
  Scenario: Timer converts correctly
    Tool: Bash
    Steps: grep -n "READY_CHECK_DURATION_SECONDS" apps/web-next/src/features/ready-check/hooks/use-ready-check.ts
    Expected: Output shows import and usage
    Evidence: .sisyphus/evidence/task-3-timer.txt
  ```

  **Commit**: YES | Message: `fix(ready-check): compute remaining time from LCU elapsed timer` | Files: `apps/web-next/src/features/ready-check/hooks/use-ready-check.ts`, `apps/web-next/src/features/ready-check/constants.ts`

- [x] 4. Fix overlay visuals, progress bar, and body scroll lock

  **What to do**:
  1. **Progress bar**: In `ready-check-overlay.tsx` line 48, change `((12 - timer) / 12)` to `(timer / READY_CHECK_DURATION_SECONDS)` because `timer` is now remaining time.
  2. **Remove ugly pulse border**: Delete the `<div className='pointer-events-none absolute inset-0 animate-pulse rounded-lg border border-lol-border-gold/20' />` element (line 58).
  3. **Remove duplicate backdrop blur**: On the Card (line 57), remove `backdrop-blur-sm` to avoid double blur with the outer overlay.
  4. **Body scroll lock**: Add a `useEffect` near the top of the component (before the early return) that:
     - Stores `document.body.style.overflow` in a ref when `isVisible` becomes true
     - Sets `document.body.style.overflow = 'hidden'`
     - On cleanup, restores the previous value
     - Guards with `typeof document !== 'undefined'`

  **Must NOT do**: Do NOT remove the outer overlay `backdrop-blur-sm`; that provides the modal backdrop effect. Do NOT change the Card's border or background color.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: CSS/classname changes + one effect hook
  - Skills: [] - not needed

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 5 | Blocked By: 1, 3

  **References**:
  - File: `apps/web-next/src/features/ready-check/components/ready-check-overlay.tsx` — all changes
  - Pattern: Standard React body scroll lock with cleanup restoration

  **Acceptance Criteria**:
  - [ ] Progress bar width formula uses `timer / READY_CHECK_DURATION_SECONDS`
  - [ ] No `animate-pulse` border div inside Card
  - [ ] Card className does not contain `backdrop-blur-sm`
  - [ ] `useEffect` locks body scroll when visible and restores on cleanup
  - [ ] `bun run lint` passes

  **QA Scenarios**:

  ```
  Scenario: Pulse border div removed
    Tool: Bash
    Steps: grep -c "animate-pulse rounded-lg border" apps/web-next/src/features/ready-check/components/ready-check-overlay.tsx
    Expected: Output is 0
    Evidence: .sisyphus/evidence/task-4-visual.txt

  Scenario: Scroll lock exists
    Tool: Bash
    Steps: grep -n "overflow" apps/web-next/src/features/ready-check/components/ready-check-overlay.tsx
    Expected: Output shows body overflow lock and restoration
    Evidence: .sisyphus/evidence/task-4-scroll.txt
  ```

  **Commit**: YES | Message: `fix(ready-check): fix overlay visuals, progress bar, and add scroll lock` | Files: `apps/web-next/src/features/ready-check/components/ready-check-overlay.tsx`

- [x] 5. Update and add tests

  **What to do**:
  1. Update `apps/web-next/src/features/ready-check/components/ready-check-overlay.test.tsx`:
     - Add test asserting `document.body.style.overflow === 'hidden'` when overlay is visible
     - Add test asserting previous overflow is restored when overlay hides
     - Add test asserting no `animate-pulse` element is rendered
     - Update mock timer values to reflect remaining time semantics
  2. Create `apps/web-next/src/features/ready-check/hooks/use-ready-check.test.ts`:
     - Mock `useQuery` to return `readyCheckSnapshot` with various `timer` values (0, 6, 12)
     - Assert that `useReadyCheck().timer` returns remaining time (`12 - elapsed`)
     - Assert that accept/decline mutations are called with POST method (mock transport and verify)
  3. Run all relevant tests.

  **Must NOT do**: Do NOT test `useCountdown` itself (out of scope). Do NOT mock `document` in a way that breaks SSR tests.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: test writing
  - Skills: [] - not needed

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: F1-F4 | Blocked By: 2, 3, 4

  **References**:
  - Existing test: `apps/web-next/src/features/ready-check/components/ready-check-overlay.test.tsx`
  - Test runner: Bun native (`bun test`)
  - Pattern: `apps/web-next/tests/unit/lcu-parsers/ready-check.test.ts` — parser test structure

  **Acceptance Criteria**:
  - [x] `ready-check-overlay.test.tsx` passes with new assertions
  - [x] `use-ready-check.test.ts` exists and passes
  - [x] `bun test apps/web-next/src/features/ready-check` exits 0
  - [x] `bun test apps/web-next/src/core/lcu` exits 0

  **QA Scenarios**:

  ```
  Scenario: All tests pass
    Tool: Bash
    Steps: cd apps/web-next && bun test src/features/ready-check
    Expected: exit code 0, all tests pass
    Evidence: .sisyphus/evidence/task-5-tests.txt
  ```

  **Commit**: YES | Message: `test(ready-check): add tests for timer, scroll lock, and POST method` | Files: `apps/web-next/src/features/ready-check/components/ready-check-overlay.test.tsx`, `apps/web-next/src/features/ready-check/hooks/use-ready-check.test.ts`

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

- [x] F1. Plan Compliance Audit — oracle
- [x] F2. Code Quality Review — unspecified-high
- [x] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [x] F4. Scope Fidelity Check — deep

## Commit Strategy

Each task gets its own focused commit. Final verification does not produce commits.

## Success Criteria

- Accept/decline no longer returns HTTP 405
- Timer counts down from ~12 to 00:00
- Progress bar shrinks from full width to empty
- Background does not scroll when overlay is open
- Overlay has clean borders without pulse flicker
- All lint and tests pass
