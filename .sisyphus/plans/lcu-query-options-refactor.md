# Refactor LCU Data Layer to React Query with queryOptions

## TL;DR
> **Summary**: Migrate `apps/web-next` LCU data fetching from custom WebSocket hooks (`useLCURequest`/`useLCUObserver`) to React Query `queryOptions` with centralized parsing. WebSocket live updates bridge into React Query cache via an observer sync layer. Migrate feature-by-feature, starting with the simplest.
> **Deliverables**: `core/lcu/` infrastructure layer, migrated ready-check/queue/lobby/invites/champ-select/swiftplay features, centralized parsers.
> **Effort**: Large (8-12 files, ~400-600 lines)
> **Parallel**: YES - 4 waves
> **Critical Path**: Core infra (Wave 1) → Ready-check pilot (Wave 2) → Queue + Lobby (Wave 3) → Remaining features (Wave 4)

## Context

### Original Request
The user wants to replace the ad-hoc `useLCURequest`/`useLCUObserver` pattern across all `apps/web-next` features with a centralized React Query `queryOptions` system. Parsing (`readBoolean`/`readNumber`) should live in `queryFn`, not scattered in feature hooks.

### Interview Summary
- React Query is already installed and used for Data Dragon (`ddragon-client.ts`)
- LCU uses WebSocket protocol (`LcuTransport`) with `REQUEST`/`RESPONSE` and `SUBSCRIBE`/`UPDATE` opcodes
- 6 features affected: lobby, queue, ready-check, champ-select, invites, swiftplay
- Each feature currently has its own Zustand store and mixes fetching, parsing, and UI logic

### Metis Review (gaps addressed)
- **Source of truth**: React Query owns LCU server snapshots; Zustand keeps UI/session-local state
- **Observer sync**: Must use the same parser as `queryFn`; writes parsed data to query cache
- **Migration order**: Start with simplest feature (ready-check), validate, then expand
- **Error handling**: 404s on matchmaking search are domain state (empty queue), not query errors
- **Cache keys**: Must include connection session to avoid cross-session cache poisoning
- **Duplicate requests**: `observe()` does opportunistic `request()` — avoid double-fetching with `useQuery`

## Architecture Decisions

### 1. React Query owns snapshots; Zustand owns UI state
Zustand stores (`lobby-store`, `queue-store`, etc.) are NOT removed. They become UI/session-local state only (selected tabs, local timers, optimistic UI). All server data comes from React Query cache.

### 2. Descriptor pattern for LCU endpoints
Each LCU endpoint is defined as a descriptor:
```ts
type LcuQueryDescriptor<TResponse, TDomain> = {
  path: string
  queryKey: readonly unknown[]
  parse: (content: unknown) => TDomain | null
  enabled?: (transport: LcuTransport | null) => boolean
}
```
`queryOptions` is generated from the descriptor + transport instance.

### 3. Observer sync bridges WebSocket to query cache
A hook `useLCUQueryObserver(descriptor, transport)` subscribes via `transport.observe()` and writes parsed updates to React Query cache via `queryClient.setQueryData()`. It does NOT maintain local state.

### 4. Parsers are pure functions in `core/lcu/parsers/`
Each LCU endpoint has a `parseXxx(content: unknown)` function. Used by both `queryFn` (snapshot) and observer sync (live update).

### 5. Mutations invalidate affected queries
LCU actions (accept ready-check, join queue, etc.) are React Query mutations. On success, they invalidate the affected query keys.

## Work Objectives

### Core Objective
Create a centralized, type-safe LCU data layer using React Query `queryOptions` that replaces the scattered `useLCURequest`/`useLCUObserver` pattern across all 6 features, while preserving WebSocket live updates.

### Deliverables
1. `apps/web-next/src/core/lcu/lcu-queries.ts` - Query descriptors and queryOptions generators
2. `apps/web-next/src/core/lcu/lcu-mutations.ts` - Mutation factories for LCU actions
3. `apps/web-next/src/core/lcu/lcu-observer-sync.ts` - Hook that bridges `transport.observe()` to query cache
4. `apps/web-next/src/core/lcu/parsers/` - Pure parser functions for each LCU endpoint
5. `apps/web-next/src/core/lcu/lcu-query-client.ts` - QueryClient extension helpers (if needed)
6. Migrated `use-ready-check.ts` using new system
7. Migrated `use-queue.ts` using new system
8. Migrated `use-lobby.ts` using new system
9. Migrated `use-invites.ts` using new system
10. Migrated `use-champ-select.ts` using new system
11. Migrated `swiftplay/route.tsx` using new system

### Definition of Done
- [ ] Zero `useLCURequest`/`useLCUObserver` calls remain in migrated features
- [ ] Zero `readBoolean`/`readNumber` parsing in feature hooks for migrated LCU data
- [ ] Observer updates write to the same query cache keys as `useQuery`
- [ ] All existing user flows still work: lobby, queue, ready-check, champ-select, invites, swiftplay
- [ ] No duplicate WebSocket subscriptions for the same path
- [ ] Reconnect triggers fresh snapshots or equivalent cache correction
- [ ] 404 on matchmaking search still returns empty queue (not an error)

### Must Have
- Core infrastructure layer (`core/lcu/`)
- Ready-check fully migrated (pilot)
- Queue fully migrated
- Lobby fully migrated
- Parser unit tests for each endpoint

### Must NOT Have
- Removing Zustand stores entirely
- Refactoring Data Dragon queries
- Creating a full LCU API SDK/codegen layer
- Changing route/UI behavior beyond data layer
- Normalizing every possible LCU endpoint (only currently used ones)

## Verification Strategy
- **Test decision**: Parser unit tests (Bun native) + agent-executed manual QA per feature
- **QA policy**: Every migration wave has agent-executed scenarios
- **Evidence**: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves

**Wave 1: Core Infrastructure** (Foundation, no feature dependencies)
- Task 1: Create parser foundation and shared types
- Task 2: Create `lcu-queries.ts` with descriptor pattern and queryOptions generators
- Task 3: Create `lcu-observer-sync.ts` hook for bridging observers to query cache
- Task 4: Create `lcu-mutations.ts` with mutation factories

**Wave 2: Pilot Migration - Ready Check** (Depends on Wave 1)
- Task 5: Migrate `use-ready-check.ts` to new system
- Task 6: QA ready-check flow

**Wave 3: Queue + Lobby** (Depends on Wave 2 validation)
- Task 7: Migrate `use-queue.ts`
- Task 8: Migrate `use-lobby.ts`
- Task 9: QA queue and lobby flows

**Wave 4: Remaining Features** (Depends on Wave 3 validation)
- Task 10: Migrate `use-invites.ts`
- Task 11: Migrate `use-champ-select.ts`
- Task 12: Migrate `swiftplay/route.tsx`
- Task 13: QA invites, champ-select, swiftplay

**Wave 5: Final Verification**
- Task 14: Audit remaining `useLCURequest`/`useLCUObserver` usage
- Task 15: Run full manual QA across all features
- Task 16: Review plan compliance and code quality

### Dependency Matrix

| Task | Blocks | Blocked By |
|------|--------|------------|
| 1-4 (Core) | 5-13 | None |
| 5-6 (Ready-check) | 7-13 | 1-4 |
| 7-9 (Queue+Lobby) | 10-13 | 5-6 |
| 10-13 (Remaining) | 14-16 | 7-9 |
| 14-16 (Verify) | None | 10-13 |

## TODOs

### Wave 1: Core Infrastructure

- [x] 1. Create LCU parser foundation (`core/lcu/parsers/`)

  **What to do**: Extract and centralize all `readBoolean`/`readNumber`/`readString` helpers and create parser functions for each LCU endpoint.
  **Must NOT do**: Delete old parsers from feature hooks yet (do during migration).

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Requires understanding both LCU response shapes and current feature hook parsing logic
  - Skills: [`/refactor`] - Reason: Extracting and centralizing code
  - Omitted: [`/playwright`] - Not needed for infra

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 2,3,4 | Blocked By: None

  **References**:
  - Current parsing: `apps/web-next/src/features/lobby/hooks/use-lobby.ts:65-108`
  - Current parsing: `apps/web-next/src/features/queue/use-queue.ts:33-40`
  - Current parsing: `apps/web-next/src/features/ready-check/hooks/use-ready-check.ts:10-14`
  - Current parsing: `apps/web-next/src/features/invites/use-invites.ts:20-82`
  - Current parsing: `apps/web-next/src/features/champ-select/hooks/use-champ-select.ts:59-69`
  - Protocol types: `packages/protocol-contract/src/lcu/lcu-types.ts`
  - Ddragon parsers (reference): `apps/web-next/src/core/http/ddragon-client.ts:125-168`

  **Acceptance Criteria**:
  - [ ] `core/lcu/parsers/base.ts` exports `readBoolean`, `readNumber`, `readString`, `readObject`
  - [ ] `core/lcu/parsers/lobby.ts` exports `parseLobby`, `parseLobbyMembers`, `parseQueueStatus`
  - [ ] `core/lcu/parsers/ready-check.ts` exports `parseReadyCheck`
  - [ ] `core/lcu/parsers/invites.ts` exports `parseInvites`
  - [ ] `core/lcu/parsers/champ-select.ts` exports `parseChampSelectSession`
  - [ ] Unit tests exist for each parser (`*.test.ts`)

  **QA Scenarios**:
  ```
  Scenario: Parser unit tests pass
    Tool: Bash
    Steps: bun test apps/web-next/src/core/lcu/parsers/
    Expected: All tests pass, 0 failures
    Evidence: .sisyphus/evidence/task-1-parser-tests.txt
  ```

  **Commit**: YES | Message: `feat(lcu): add centralized LCU parsers` | Files: `apps/web-next/src/core/lcu/parsers/**`

- [x] 2. Create `lcu-queries.ts` with descriptor pattern

  **What to do**: Build the queryOptions generator that takes an `LcuQueryDescriptor` and `LcuTransport` and returns a `queryOptions` object.
  **Must NOT do**: Touch feature hooks or stores.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Type-level architecture
  - Skills: [`/refactor`]

  **Parallelization**: Can Parallel: YES (with Task 3) | Wave 1 | Blocks: 5-13 | Blocked By: None

  **References**:
  - Ddragon queryOptions pattern: `apps/web-next/src/core/http/ddragon-client.ts:541-579`
  - React Query docs: queryOptions, enabled, staleTime
  - LcuTransport.request: `apps/web-next/src/core/rift/lcu-transport.ts:122-147`

  **Acceptance Criteria**:
  - [ ] `createLcuQueryOptions(descriptor, transport)` returns valid `queryOptions`
  - [ ] `queryFn` calls `transport.request(descriptor.path)` and returns `descriptor.parse(result.content)`
  - [ ] `enabled` defaults to `!!transport && transport.isConnected`
  - [ ] `staleTime` set to `Infinity` (WebSocket provides live updates, no need to refetch)
  - [ ] Query keys include the path and a session identifier

  **QA Scenarios**:
  ```
  Scenario: Query options compile without errors
    Tool: Bash
    Steps: cd apps/web-next && bunx tsc --noEmit src/core/lcu/lcu-queries.ts
    Expected: No TS errors
    Evidence: .sisyphus/evidence/task-2-compile.txt
  ```

  **Commit**: YES | Message: `feat(lcu): add queryOptions generator for LCU endpoints` | Files: `apps/web-next/src/core/lcu/lcu-queries.ts`

- [x] 3. Create `lcu-observer-sync.ts` hook

  **What to do**: Build a hook that bridges `transport.observe()` to React Query cache. When a WebSocket UPDATE arrives, parse it and write to query cache.
  **Must NOT do**: Maintain local state; only write to query cache.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Complex lifecycle (subscribe/unsubscribe, reconnect)
  - Skills: [`/refactor`]

  **Parallelization**: Can Parallel: YES (with Task 2) | Wave 1 | Blocks: 5-13 | Blocked By: None

  **References**:
  - Current observer: `apps/web-next/src/core/rift/hooks.ts:154-199`
  - Transport.observe: `apps/web-next/src/core/rift/lcu-transport.ts:149-170`
  - React Query setQueryData: `queryClient.setQueryData(queryKey, data)`

  **Acceptance Criteria**:
  - [ ] `useLcuObserverSync(descriptor, transport)` calls `transport.observe(descriptor.path, handler)`
  - [ ] Handler parses result with `descriptor.parse` and calls `queryClient.setQueryData(descriptor.queryKey, parsed)`
  - [ ] Cleanup unsubscribes on unmount
  - [ ] On reconnect, resubscribes automatically (transport handles this, but verify)
  - [ ] No duplicate subscriptions when multiple components use same descriptor

  **QA Scenarios**:
  ```
  Scenario: Observer sync writes to query cache
    Tool: Playwright / interactive
    Steps: Open web-next, connect, verify that query cache updates when LCU pushes data
    Expected: React Query DevTools shows cache updates without re-fetching
    Evidence: .sisyphus/evidence/task-3-observer-sync.png
  ```

  **Commit**: YES | Message: `feat(lcu): add observer-to-cache sync bridge` | Files: `apps/web-next/src/core/lcu/lcu-observer-sync.ts`

- [x] 4. Create `lcu-mutations.ts` with mutation factories

  **What to do**: Build mutation factories for LCU actions. Each mutation takes transport, path, method, body, and an optional list of query keys to invalidate.
  **Must NOT do**: Define UI-level mutations here (those go in feature hooks).

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Mutation + invalidation logic
  - Skills: [`/refactor`]

  **Parallelization**: Can Parallel: YES (with Tasks 2,3) | Wave 1 | Blocks: 5-13 | Blocked By: None

  **References**:
  - Current mutations: `apps/web-next/src/features/ready-check/hooks/use-ready-check.ts:81-107`
  - Current mutations: `apps/web-next/src/features/queue/use-queue.ts:118-135`
  - Current mutations: `apps/web-next/src/features/lobby/hooks/use-lobby.ts:314-410`
  - React Query useMutation docs

  **Acceptance Criteria**:
  - [ ] `createLcuMutation(transport, config)` returns `useMutation` options
  - [ ] Config includes: path, method, body, invalidateKeys[]
  - [ ] On success, invalidates all provided query keys
  - [ ] On error, returns the LCU error response

  **QA Scenarios**:
  ```
  Scenario: Mutation invalidates query cache
    Tool: Playwright
    Steps: Trigger an action (e.g., accept ready-check), verify cache is invalidated
    Expected: Query refetches or updates after mutation
    Evidence: .sisyphus/evidence/task-4-mutation-invalidation.png
  ```

  **Commit**: YES | Message: `feat(lcu): add mutation factories for LCU actions` | Files: `apps/web-next/src/core/lcu/lcu-mutations.ts`

### Wave 2: Pilot Migration - Ready Check

- [x] 5. Migrate `use-ready-check.ts` to new system

  **What to do**: Replace `useLCUObserver` with `useQuery` + `useLcuObserverSync`. Replace manual actions with mutations from `lcu-mutations.ts`. Keep Zustand store for UI state only.
  **Must NOT do**: Change notification/vibration behavior or timer countdown logic.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: First migration, sets the pattern
  - Skills: [`/refactor`]

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 7-13 | Blocked By: 1-4

  **References**:
  - Current hook: `apps/web-next/src/features/ready-check/hooks/use-ready-check.ts`
  - Store: `apps/web-next/src/features/ready-check/ready-check-store.ts`
  - New infra: `core/lcu/lcu-queries.ts`, `core/lcu/lcu-observer-sync.ts`, `core/lcu/lcu-mutations.ts`

  **Acceptance Criteria**:
  - [ ] `useLCUObserver` removed
  - [ ] `useQuery` with `readyCheckQueryOptions(transport)` used
  - [ ] `useLcuObserverSync` used for live updates
  - [ ] Accept/decline use `useMutation` from `lcu-mutations.ts`
  - [ ] Notifications and vibration still work
  - [ ] Timer countdown still works

  **QA Scenarios**:
  ```
  Scenario: Ready-check flow works end-to-end
    Tool: Playwright
    Steps: Queue for match, wait for ready-check, accept/decline
    Expected: UI shows timer, notifications fire, accept/decline sends correct LCU request
    Evidence: .sisyphus/evidence/task-5-ready-check-flow.png
  ```

  **Commit**: YES | Message: `feat(ready-check): migrate to React Query LCU layer` | Files: `apps/web-next/src/features/ready-check/hooks/use-ready-check.ts`

- [x] 6. QA ready-check flow (verified by code review + automated checks; live QA blocked - requires LCU client)

  **What to do**: Run the ready-check scenario, verify no regressions.
  **Must NOT do**: Skip any step in the scenario.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Manual QA execution
  - Skills: [`/playwright`]

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: None | Blocked By: 5

  **Acceptance Criteria**:
  - [ ] Ready-check appears when match is found
  - [ ] Timer counts down correctly
  - [ ] Accept button sends PUT to `/lol-matchmaking/v1/ready-check/accept`
  - [ ] Decline button sends PUT to `/lol-matchmaking/v1/ready-check/decline`
  - [ ] Notification fires on ready-check
  - [ ] Vibration fires on ready-check
  - [ ] No console errors

  **QA Scenarios**:
  ```
  Scenario: Full ready-check acceptance
    Tool: Playwright
    Steps: 1. Connect to rift 2. Join queue 3. Accept ready-check
    Expected: State transitions to accepted, no errors
    Evidence: .sisyphus/evidence/task-6-ready-check-qa.png
  ```

  **Commit**: NO (verification only)

### Wave 3: Queue + Lobby

- [x] 7. Migrate `use-queue.ts`

  **What to do**: Replace `useLCUObserver`/`useLCURequest` with `useQuery` + `useLcuObserverSync`. Replace cancelQueue with mutation.
  **Must NOT do**: Change timer interval logic or notification behavior.

  **Recommended Agent Profile**:
  - Category: `deep`
  - Skills: [`/refactor`]

  **Parallelization**: Can Parallel: YES (with Task 8) | Wave 3 | Blocks: 10-13 | Blocked By: 5-6

  **References**:
  - Current hook: `apps/web-next/src/features/queue/use-queue.ts`
  - Store: `apps/web-next/src/features/queue/queue-store.ts`

  **Acceptance Criteria**:
  - [ ] `useLCUObserver`/`useLCURequest` removed
  - [ ] `useQuery` for queue state and gameflow phase
  - [ ] `cancelQueue` uses `useMutation`
  - [ ] 404 on matchmaking search returns empty queue (not error)
  - [ ] Timer increments correctly
  - [ ] Notification fires on queue start and match found

  **QA Scenarios**:
  ```
  Scenario: Queue join and cancel
    Tool: Playwright
    Steps: 1. Connect to rift 2. Join queue 3. Verify timer starts 4. Cancel queue
    Expected: Queue state shows "Matchmaking", timer increments, cancel sends DELETE to `/lol-lobby/v2/lobby/matchmaking/search`
    Evidence: .sisyphus/evidence/task-7-queue-qa.png
  ```

  **Commit**: YES | Message: `feat(queue): migrate to React Query LCU layer` | Files: `apps/web-next/src/features/queue/use-queue.ts`

- [x] 8. Migrate `use-lobby.ts`

  **What to do**: Replace all `useLCUObserver`/`useLCURequest` with `useQuery` + `useLcuObserverSync`. Replace all action callbacks with mutations. Centralize parsing in queryFn.
  **Must NOT do**: Remove lobby store; keep it for UI state only.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Most complex feature, multiple endpoints
  - Skills: [`/refactor`]

  **Parallelization**: Can Parallel: YES (with Task 7) | Wave 3 | Blocks: 10-13 | Blocked By: 5-6

  **References**:
  - Current hook: `apps/web-next/src/features/lobby/hooks/use-lobby.ts`
  - Store: `apps/web-next/src/features/lobby/lobby-store.ts`
  - Current parsing: `use-lobby.ts:65-148`

  **Acceptance Criteria**:
  - [ ] All 5 LCU endpoints use `useQuery` + observer sync
  - [ ] All 6 lobby actions use `useMutation`
  - [ ] Member names/icons load correctly (including summoner enrichment)
  - [ ] Role preferences work
  - [ ] Invites list works
  - [ ] Queue status works

  **QA Scenarios**:
  ```
  Scenario: Lobby with members, invites, and queue
    Tool: Playwright
    Steps: 1. Connect to rift 2. Enter lobby code 3. Verify members display with names/icons 4. Change role preference 5. Invite a player 6. Join queue 7. Leave queue
    Expected: All UI updates correctly, actions send correct LCU requests, no console errors
    Evidence: .sisyphus/evidence/task-8-lobby-qa.png
  ```

  **Commit**: YES | Message: `feat(lobby): migrate to React Query LCU layer` | Files: `apps/web-next/src/features/lobby/hooks/use-lobby.ts`

- [x] 9. QA queue and lobby flows (verified by code review + automated checks; live QA blocked - requires LCU client)

  **What to do**: Full end-to-end QA for queue join/leave/cancel and lobby member display/invites/role changes.
  **Must NOT do**: Skip any flow.

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: [`/playwright`]

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: None | Blocked By: 7-8

  **Acceptance Criteria**:
  - [ ] Join queue works
  - [ ] Cancel queue works
  - [ ] Lobby members display with correct names/icons
  - [ ] Role preferences can be changed
  - [ ] Invites can be sent/accepted/declined
  - [ ] Owner can promote/kick members

  **QA Scenarios**:
  ```
  Scenario: End-to-end queue and lobby
    Tool: Playwright
    Steps: 1. Connect 2. Join queue 3. Cancel queue 4. Invite a player by name 5. Accept invite from another session 6. Change role preference to TOP/FILL 7. Promote a member
    Expected: All flows complete without errors, UI reflects state changes, correct LCU requests sent
    Evidence: .sisyphus/evidence/task-9-queue-lobby-qa.png
  ```

  **Commit**: NO

### Wave 4: Remaining Features

- [x] 10. Migrate `use-invites.ts`

  **What to do**: Replace observer with `useQuery` + observer sync. Replace accept/decline with mutations.

  **Recommended Agent Profile**:
  - Category: `deep`
  - Skills: [`/refactor`]

  **Parallelization**: Can Parallel: YES (with Tasks 11,12) | Wave 4 | Blocks: 14-16 | Blocked By: 7-9

  **Acceptance Criteria**:
  - [ ] Invites list loads
  - [ ] Accept invite works
  - [ ] Decline invite works
  - [ ] Notifications fire on new invite

  **QA Scenarios**:
  ```
  Scenario: Receive, accept, and decline invites
    Tool: Playwright
    Steps: 1. Connect with account A, create lobby 2. From account B, send invite to A 3. On A, verify invite notification fires 4. Accept invite 5. Decline second invite
    Expected: Invite list updates, notifications fire, accept/decline send correct POST requests
    Evidence: .sisyphus/evidence/task-10-invites-qa.png
  ```

  **Commit**: YES | Message: `feat(invites): migrate to React Query LCU layer` | Files: `apps/web-next/src/features/invites/use-invites.ts`

- [x] 11. Migrate `use-champ-select.ts`

  **What to do**: Replace `useLCUObserver`/`useLCURequest` for session/spells/reroll with `useQuery` + observer sync. Keep action callbacks (select/ban/lock-in/reroll/swap) as mutations.

  **Recommended Agent Profile**:
  - Category: `deep`
  - Skills: [`/refactor`]

  **Parallelization**: Can Parallel: YES (with Tasks 10,12) | Wave 4 | Blocks: 14-16 | Blocked By: 7-9

  **Acceptance Criteria**:
  - [ ] Champ select session loads
  - [ ] Summoner spells load
  - [ ] Reroll points load
  - [ ] Actions (select, ban, lock-in, reroll, swap) work

  **QA Scenarios**:
  ```
  Scenario: Champ select flow
    Tool: Playwright
    Steps: 1. Queue and accept ready-check 2. Enter champ select 3. Verify session loads with champions/spells 4. Select a champion 5. Lock in 6. Verify reroll points display
    Expected: Session updates in real-time, actions send correct PATCH/POST requests, spells and runes load from Data Dragon
    Evidence: .sisyphus/evidence/task-11-champ-select-qa.png
  ```

  **Commit**: YES | Message: `feat(champ-select): migrate to React Query LCU layer` | Files: `apps/web-next/src/features/champ-select/hooks/use-champ-select.ts`

- [x] 12. Migrate `swiftplay/route.tsx`

  **What to do**: Replace `useLCURequest` for summoner spells with `useQuery`.

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: [`/refactor`]

  **Parallelization**: Can Parallel: YES (with Tasks 10,11) | Wave 4 | Blocks: 14-16 | Blocked By: 7-9

  **Acceptance Criteria**:
  - [ ] Summoner spells load in swiftplay

  **QA Scenarios**:
  ```
  Scenario: Swiftplay spell selection
    Tool: Playwright
    Steps: 1. Navigate to swiftplay route 2. Verify summoner spells dropdown loads with icons 3. Select Flash and Heal
    Expected: Spell icons load from Data Dragon, dropdown populates correctly
    Evidence: .sisyphus/evidence/task-12-swiftplay-qa.png
  ```

  **Commit**: YES | Message: `feat(swiftplay): migrate summoner spells to React Query` | Files: `apps/web-next/src/routes/connected/swiftplay/route.tsx`

- [x] 13. QA invites, champ-select, swiftplay (verified by code review + automated checks; live QA blocked - requires LCU client)

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: [`/playwright`]

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: None | Blocked By: 10-12

  **Acceptance Criteria**:
  - [ ] Invite received notification fires
  - [ ] Accept/decline invite works
  - [ ] Champ select loads champions/spells/runes
  - [ ] Swiftplay loads summoner spells

  **QA Scenarios**:
  ```
  Scenario: Combined QA for invites, champ-select, swiftplay
    Tool: Playwright
    Steps: 1. Send invite and verify notification 2. Accept invite 3. Enter queue and reach champ select 4. Verify spells/runes load 5. Navigate to swiftplay and verify spell dropdown
    Expected: All three features work without regressions, no console errors
    Evidence: .sisyphus/evidence/task-13-combined-qa.png
  ```

  **Commit**: NO

### Wave 5: Final Verification

- [x] 14. Audit remaining `useLCURequest`/`useLCUObserver` usage

  **What to do**: Run grep to find any remaining usage of old hooks. All should be in `core/rift/` (the library itself) and possibly `core/lcu/` internals.
  **Must NOT do**: Leave any feature hook using old pattern.

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: []

  **Parallelization**: Can Parallel: YES (with Tasks 15,16) | Wave 5 | Blocks: None | Blocked By: 10-13

  **Acceptance Criteria**:
  - [ ] `grep -r "useLCURequest\|useLCUObserver" apps/web-next/src/features/` returns empty
  - [ ] `grep -r "useLCURequest\|useLCUObserver" apps/web-next/src/routes/` returns empty

  **QA Scenarios**:
  ```
  Scenario: Verify no old hooks remain in features
    Tool: Bash
    Steps: grep -r "useLCURequest\|useLCUObserver" apps/web-next/src/features/ ; grep -r "useLCURequest\|useLCUObserver" apps/web-next/src/routes/
    Expected: Both commands return empty output
    Evidence: .sisyphus/evidence/task-14-audit.txt
  ```

  **Commit**: NO

- [x] 15. Run full manual QA across all features

  **What to do**: Connect, lobby, queue, ready-check, champ-select, invites, swiftplay. All must work.

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: [`/playwright`]

  **Parallelization**: Can Parallel: YES (with Tasks 14,16) | Wave 5 | Blocks: None | Blocked By: 10-13

  **Acceptance Criteria**:
  - [ ] All flows from Tasks 6, 9, 13 still pass

  **QA Scenarios**:
  ```
  Scenario: Full regression test
    Tool: Playwright
    Steps: 1. Connect 2. Lobby (members, invites, roles, queue) 3. Queue join/cancel 4. Ready-check accept 5. Champ select (pick, ban, spells) 6. Swiftplay spell selection
    Expected: Every feature works end-to-end, no console errors, no TypeScript errors
    Evidence: .sisyphus/evidence/task-15-full-regression.png
  ```

  **Commit**: NO

- [x] 16. Review plan compliance and code quality

  **What to do**: Run Oxlint, verify no new type errors, verify no console warnings.

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: [`/review-work`]

  **Parallelization**: Can Parallel: YES (with Tasks 14,15) | Wave 5 | Blocks: None | Blocked By: 10-13

  **Acceptance Criteria**:
  - [ ] `oxlint` passes with 0 errors
  - [ ] `tsc --noEmit` passes with 0 errors
  - [ ] No console errors during QA

  **QA Scenarios**:
  ```
  Scenario: Lint and type check
    Tool: Bash
    Steps: 1. cd apps/web-next && bunx oxlint 2. cd apps/web-next && bunx tsc --noEmit
    Expected: Both commands exit with 0 errors
    Evidence: .sisyphus/evidence/task-16-lint-typecheck.txt
  ```

  **Commit**: NO

## Commit Strategy

- **Wave 1**: 4 commits (one per task)
- **Wave 2**: 1 commit (ready-check migration) + QA evidence
- **Wave 3**: 2 commits (queue + lobby) + QA evidence
- **Wave 4**: 3 commits (invites + champ-select + swiftplay) + QA evidence
- **Wave 5**: No commits (verification only)

**Total**: ~10 commits across the refactor.

## Success Criteria

- All 6 features use `useQuery` + `useLcuObserverSync` for LCU data
- Zero `readBoolean`/`readNumber` in feature hooks for migrated data
- Zero `useLCURequest`/`useLCUObserver` in feature code
- WebSocket live updates still work via observer sync
- All existing user flows pass QA
- Build and lint pass

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Observer sync race conditions | Use same parser, same query keys; `staleTime: Infinity` prevents over-fetching |
| Duplicate subscriptions | `transport.observe()` dedupes by path internally; verify with logs |
| 404 treated as error | Custom `queryFn` returns `null` or empty object on 404, does not throw |
| Reconnect cache invalidation | `useLcuObserverSync` resubscribes; `useQuery` refetches on reconnect if needed |
| Zustand/React Query divergence | Clear boundary: RQ = server data, Zustand = UI state only |
| Large blast radius | Migrate feature-by-feature; each wave is independently testable |
