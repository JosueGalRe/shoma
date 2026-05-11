# Legacy-to-WebNext Full Feature Parity

## TL;DR
> **Summary**: Achieve complete feature parity between legacy web (`web/`) and web-next (`apps/web-next/`), rebuild missing UI components, wire missing LCU endpoints, add mobile polish (audio, PWA, iOS), and implement Riot's recommended rune sets. Champ-select to be decomposed into components gradually.
> **Deliverables**: Create-lobby UI, champ-select component decomposition, full rune editor, recommended runes, pick intent/trade/swap/skin picker, mobile polish, invite overlay, lobby member/role-picker components, queue dodge penalty, sent invites tracking, CommunityDragon fallback, Swiftplay LCU submission.
> **Effort**: XL (20+ files, ~1500-2500 lines, 6+ waves)
> **Parallel**: YES - 6 waves
> **Critical Path**: Infrastructure + endpoint discovery (Wave 1) → Create-lobby + Queue dodge (Wave 2) → Champ-select decomposition foundation (Wave 3) → Champ-select advanced (Wave 4) → Rune editor + recommended (Wave 5) → Mobile polish + remaining (Wave 6)

## Context

### Original Request
User wants full feature parity with legacy web. Legacy is Vue 2 + Vue CLI + Stylus with all features inline. Web-next is React 19 + Vite + Tailwind + TanStack Router/Query. Core LCU infrastructure (queries, mutations, observer sync, parsers) is already complete.

### Interview Summary
- **Scope**: Full parity - every legacy feature must work in web-next
- **Champ-select**: Decompose monolithic route into components (timer, members, picker, rune-editor, skin-picker, bench, player-settings) gradually
- **Priority**: Create-lobby + champ-select gaps first; Clash/Custom/Arena stubs for later
- **Mobile**: Full parity - audio, vibration, iOS audio unlock, PWA install prompt, notch safe-area
- **Runes**: Full editor (create/delete/edit pages) + Riot's 3 recommended sets post-champion-selection
- **Champ-select advanced**: Pick intent, trade, swap, skin picker post-lock

### Metis Review (gaps addressed)
- **Source of truth**: React Query for LCU data; Zustand for UI/session state only
- **Champ-select decomposition**: Must preserve existing behavior while splitting; do not destabilize
- **Rune editor**: Validation rules must match LCU constraints (primary/secondary tree rules, stat shard limits)
- **Recommended runes**: Endpoint unknown - must discover before UI implementation
- **Mobile audio**: Browser-policy driven; cannot be fully guaranteed; needs user-gesture unlock
- **PWA**: vite-plugin-pwa already installed; needs configuration for install prompt
- **Queue dodge penalty**: Endpoint unknown - must discover
- **Trade/swap**: Depends on champ-select session action modeling
- **Component boundaries**: Follow legacy Vue component boundaries where applicable
- **i18n**: All new UI strings must use i18n keys (unlike legacy which had hardcoded strings)

## Architecture Decisions

### 1. React Query owns LCU data; Zustand owns UI state
Already established. New features follow same pattern: LCU endpoint → descriptor → queryOptions → useQuery + useLcuObserverSync.

### 2. Component decomposition follows legacy boundaries
Champ-select to be split into: Timer, Members, ChampionPicker, SummonerPicker, RuneEditor, SkinPicker, Bench, PlayerSettings. Each is a React component consuming React Query data and Zustand UI state.

### 3. LCU endpoint discovery first
Any feature requiring an unknown endpoint (recommended runes, dodge penalty, trade/swap mutations) must discover the endpoint via librarian agent before UI implementation.

### 4. Audio/PWA as progressive enhancement
Queue-pop audio and PWA install prompt must not block core functionality. Implement with graceful degradation.

### 5. i18n for all new strings
Unlike legacy web which had hardcoded English strings, web-next uses react-i18next. All new UI text must have translation keys.

## Work Objectives

### Core Objective
Achieve complete feature parity with legacy web while maintaining web-next's modern architecture (React Query, Zustand, TanStack Router, Tailwind, i18n).

### Deliverables
1. **Create-lobby UI** - Queue selection with map/mode icons
2. **Champ-select decomposition** - Timer, Members, ChampionPicker, SummonerPicker, RuneEditor, SkinPicker, Bench, PlayerSettings components
3. **Pick intent / declaration** - Before active pick
4. **Champion trade/swap** - Between teammates
5. **Skin picker post-lock** - After champion locked
6. **Full rune editor** - Create/delete/edit pages, primary/secondary trees, keystones, runes, stat shards
7. **Riot recommended runes** - 3 sets post-champion-selection
8. **Queue-pop audio** - queue-pop.mp3 playback
9. **iOS audio unlock workaround** - Web Audio API user-gesture unlock
10. **PWA install prompt** - Add to homescreen
11. **Queue dodge penalty timer** - In lobby CTA button
12. **Lobby member component** - Dedicated reusable component
13. **Invite overlay** - With suggested players
14. **Role picker component** - Dedicated reusable component
15. **Sent invites tracking** - Pending/accepted/declined/kicked states
16. **CommunityDragon splash fallback** - For champ-select backgrounds
17. **Swiftplay LCU submission** - Submit config to LCU
18. **Vibration** - Ready-check and queue-pop vibration
19. **Safe-area handling** - iOS notch and safe-area-inset

### Definition of Done
- [ ] Every legacy feature has a working equivalent in web-next
- [ ] All new code uses i18n translation keys
- [ ] All new LCU endpoints have descriptors and parsers
- [ ] Zero TypeScript errors (`tsc --noEmit` passes)
- [ ] Parser unit tests cover new parsers
- [ ] Component-level tests for complex UI (rune editor, champ-select)
- [ ] Mobile polish works on iOS Safari and Android Chrome
- [ ] PWA install prompt works on supported browsers
- [ ] Audio plays after user interaction (iOS-compliant)
- [ ] All existing web-next flows still work (no regressions)

### Must Have
- Create-lobby UI with queue list from `/lol-game-queues/v1/queues`
- Champ-select decomposition (at least Timer + Members + Picker foundation)
- Full rune editor
- Queue-pop audio + vibration
- PWA install prompt
- Queue dodge penalty timer
- Swiftplay LCU submission
- iOS safe-area handling

### Must NOT Have
- Rewriting working LCU infrastructure
- Adding new state/router/query libraries
- Building Clash/Custom/Arena integration (stubs remain)
- Redesigning features beyond parity with legacy
- Breaking existing observer sync

## Verification Strategy
- **Test decision**: Parser unit tests (existing) + component tests for complex UI + agent-executed manual QA per feature
- **QA policy**: Every wave has agent-executed scenarios
- **Evidence**: `.sisyphus/evidence/parity-task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves

**Wave 1: Endpoint Discovery & Infrastructure**
- Task 1: Discover LCU endpoints for recommended runes, dodge penalty, trade/swap
- Task 2: Add missing LCU paths to protocol-contract (dodge penalty, trade/swap, skin inventory, etc.)
- Task 3: Create LCU query descriptors for new endpoints
- Task 4: Create LCU parsers for new endpoints
- Task 5: Add LCU mutations for new actions (trade, swap, rune page CRUD)

**Wave 2: Create-Lobby + Queue Polish**
- Task 6: Build create-lobby UI with queue list
- Task 7: Implement queue dodge penalty timer in lobby
- Task 8: Build lobby member component
- Task 9: Build role picker component
- Task 10: Build invite overlay with suggested players
- Task 11: Implement sent invites tracking
- Task 12: Implement Swiftplay LCU submission

**Wave 3: Champ-Select Decomposition Foundation**
- Task 13: Extract Timer component
- Task 14: Extract Members component
- Task 15: Extract ChampionPicker component
- Task 16: Extract SummonerPicker component
- Task 17: Extract Bench component

**Wave 4: Champ-Select Advanced**
- Task 18: Implement pick intent / declaration
- Task 19: Implement champion trade
- Task 20: Implement champion swap
- Task 21: Implement skin picker post-lock
- Task 22: Extract PlayerSettings component

**Wave 5: Rune Editor + Recommended**
- Task 23: Build full rune editor component
- Task 24: Discover and implement recommended rune sets endpoint
- Task 25: Integrate recommended runes into champ-select

**Wave 6: Mobile Polish**
- Task 26: Implement queue-pop audio with iOS unlock
- Task 27: Implement ready-check vibration
- Task 28: Implement PWA install prompt
- Task 29: Verify iOS safe-area and notch handling
- Task 30: Add CommunityDragon splash fallback

**Wave 7: Final Verification**
- Task 31: Full regression test across all features
- Task 32: Audit for missing legacy features
- Task 33: Code quality review (lint, types, tests)

### Dependency Matrix

| Task | Blocks | Blocked By |
|------|--------|------------|
| 1-5 (Infra) | 6-30 | None |
| 6-12 (Lobby) | 31-33 | 1-5 |
| 13-17 (CS Foundation) | 18-22, 23-25 | 1-5 |
| 18-22 (CS Advanced) | 31-33 | 13-17 |
| 23-25 (Runes) | 31-33 | 1-5, 13-17 |
| 26-30 (Mobile) | 31-33 | 6-12, 13-17 |
| 31-33 (Verify) | None | 6-30 |

## TODOs

### Wave 1: Endpoint Discovery & Infrastructure

- [x] 1. Discover LCU endpoints for recommended runes, dodge penalty, trade/swap

  **What to do**: Use librarian agent to search LCU API documentation and inspect legacy web code for endpoints related to: (a) Riot recommended rune sets post-champion-selection, (b) queue dodge penalty timer data, (c) champion trade/swap mutations in champ-select.
  **Must NOT do**: Guess endpoints; only use documented or verified endpoints.

  **Recommended Agent Profile**:
  - Category: `librarian` - Reason: External API documentation research
  - Skills: []

  **Parallelization**: Can Parallel: YES (with Tasks 2-5) | Wave 1 | Blocks: 6-30 | Blocked By: None

  **References**:
  - Legacy champ-select trade/swap: `web/src/components/champ-select/champ-select.ts`
  - Legacy rune editor: `web/src/components/champ-select/rune-editor.*`
  - LCU perks endpoints: `packages/protocol-contract/src/lcu/lcu-paths.ts:69-76`
  - LCU game queues: `packages/protocol-contract/src/lcu/lcu-paths.ts:27-31`

  **Acceptance Criteria**:
  - [ ] Documented endpoint for recommended rune sets (or confirmed non-existent)
  - [ ] Documented endpoint for dodge penalty data
  - [ ] Documented endpoints/mutations for trade and swap in champ-select

  **QA Scenarios**:
  ```
  Scenario: Endpoint discovery verified
    Tool: Bash
    Steps: grep -r "recommended\|dodge\|trade\|swap" packages/protocol-contract/src/lcu/
    Expected: All discovered endpoints added to lcu-paths.ts or documented as unavailable
    Evidence: .sisyphus/evidence/parity-task-1-endpoints.txt
  ```

  **Commit**: NO (discovery only)

- [x] 2. Add missing LCU paths to protocol-contract

  **What to do**: Add discovered endpoints from Task 1 to `packages/protocol-contract/src/lcu/lcu-paths.ts`. Include: dodge penalty, trade/swap paths, skin inventory, suggested players (if missing), and any other discovered endpoints.
  **Must NOT do**: Add endpoints without verification from Task 1.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: Straightforward path additions
  - Skills: []

  **Parallelization**: Can Parallel: YES (with Tasks 3-5) | Wave 1 | Blocks: 6-30 | Blocked By: 1

  **References**:
  - Current paths: `packages/protocol-contract/src/lcu/lcu-paths.ts`
  - Path patterns: `packages/protocol-contract/src/lcu/lcu-paths.ts:97-100`

  **Acceptance Criteria**:
  - [ ] All discovered endpoints added as typed path constants
  - [ ] Path follows existing naming convention (`camelCase` keys, template literals for params)
  - [ ] `tsc --noEmit` passes in protocol-contract

  **QA Scenarios**:
  ```
  Scenario: Paths compile correctly
    Tool: Bash
    Steps: cd packages/protocol-contract && bunx tsc --noEmit
    Expected: 0 errors
    Evidence: .sisyphus/evidence/parity-task-2-paths.txt
  ```

  **Commit**: YES | Message: `feat(lcu): add missing LCU paths for parity features` | Files: `packages/protocol-contract/src/lcu/lcu-paths.ts`

- [x] 3. Create LCU query descriptors for new endpoints

  **What to do**: Add descriptors to `apps/web-next/src/core/lcu/lcu-queries.ts` for: game queues list, perks styles/pages, current summoner skins, dodge penalty (if endpoint found), and any other discovered endpoints.
  **Must NOT do**: Touch existing descriptors.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Type-level descriptor pattern
  - Skills: []

  **Parallelization**: Can Parallel: YES (with Tasks 2, 4, 5) | Wave 1 | Blocks: 6-30 | Blocked By: 1-2

  **References**:
  - Existing descriptors: `apps/web-next/src/core/lcu/lcu-queries.ts`
  - Descriptor pattern: `.sisyphus/plans/lcu-query-options-refactor.md:36-44`

  **Acceptance Criteria**:
  - [ ] Descriptors for all new endpoints added
  - [ ] `createLcuQueryOptions()` works with new descriptors
  - [ ] `tsc --noEmit` passes

  **QA Scenarios**:
  ```
  Scenario: New descriptors compile
    Tool: Bash
    Steps: cd apps/web-next && bunx tsc --noEmit src/core/lcu/lcu-queries.ts
    Expected: 0 errors
    Evidence: .sisyphus/evidence/parity-task-3-descriptors.txt
  ```

  **Commit**: YES | Message: `feat(lcu): add query descriptors for parity endpoints` | Files: `apps/web-next/src/core/lcu/lcu-queries.ts`

- [x] 4. Create LCU parsers for new endpoints

  **What to do**: Add parser functions to `apps/web-next/src/core/lcu/parsers/` for: game queue list items, perk styles, perk pages, skin inventory, dodge penalty (if applicable). Follow existing parser patterns (`readObject`, `readNumber`, `readString`, `readBoolean`).
  **Must NOT do**: Duplicate existing parsers.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Understanding LCU response shapes
  - Skills: []

  **Parallelization**: Can Parallel: YES (with Tasks 2-3, 5) | Wave 1 | Blocks: 6-30 | Blocked By: 1-2

  **References**:
  - Base parsers: `apps/web-next/src/core/lcu/parsers/base.ts`
  - Existing parsers: `apps/web-next/src/core/lcu/parsers/lobby.ts`, `queue.ts`, etc.
  - Unit test pattern: `apps/web-next/tests/unit/lcu-parsers/lobby.test.ts`

  **Acceptance Criteria**:
  - [ ] Parser functions for all new endpoint responses
  - [ ] Unit tests for each new parser
  - [ ] All tests pass

  **QA Scenarios**:
  ```
  Scenario: Parser unit tests pass
    Tool: Bash
    Steps: bun test apps/web-next/tests/unit/lcu-parsers/
    Expected: All tests pass (including new ones)
    Evidence: .sisyphus/evidence/parity-task-4-parsers.txt
  ```

  **Commit**: YES | Message: `feat(lcu): add parsers for parity endpoints` | Files: `apps/web-next/src/core/lcu/parsers/**`

- [x] 5. Add LCU mutations for new actions

  **What to do**: Add mutation factories to `apps/web-next/src/core/lcu/lcu-mutations.ts` for: trade request, swap request, rune page create/update/delete, lobby creation, Swiftplay config submission, invite grant/revoke.
  **Must NOT do**: Duplicate existing mutations.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Mutation + invalidation logic
  - Skills: []

  **Parallelization**: Can Parallel: YES (with Tasks 2-4) | Wave 1 | Blocks: 6-30 | Blocked By: 1-2

  **References**:
  - Existing mutations: `apps/web-next/src/core/lcu/lcu-mutations.ts`
  - Mutation pattern: `.sisyphus/plans/lcu-query-options-refactor.md:270-284`

  **Acceptance Criteria**:
  - [ ] Mutations for all new actions
  - [ ] Proper query key invalidation on success
  - [ ] `tsc --noEmit` passes

  **QA Scenarios**:
  ```
  Scenario: Mutations compile without errors
    Tool: Bash
    Steps: cd apps/web-next && bunx tsc --noEmit src/core/lcu/lcu-mutations.ts
    Expected: 0 errors
    Evidence: .sisyphus/evidence/parity-task-5-mutations.txt
  ```

  **Commit**: YES | Message: `feat(lcu): add mutations for parity actions` | Files: `apps/web-next/src/core/lcu/lcu-mutations.ts`

### Wave 2: Create-Lobby + Queue Polish

- [x] 6. Build create-lobby UI with queue list

  **What to do**: Create a new route/component for creating a lobby. Fetch available queues from `/lol-game-queues/v1/queues`, filter/sort by map/mode, display with icons and descriptions. Allow queue selection and lobby creation via POST to lobby endpoint.
  **Must NOT do**: Hardcode queue list; always fetch from LCU.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Complex UI with lists, icons, filtering
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Can Parallel: YES (with Tasks 7-12) | Wave 2 | Blocks: 31-33 | Blocked By: 1-5

  **References**:
  - Legacy create-lobby: `web/src/components/lobby/create-lobby.*`
  - Queue list endpoint: `packages/protocol-contract/src/lcu/lcu-paths.ts:27-31`
  - Existing lobby: `apps/web-next/src/routes/connected/lobby/route.tsx`
  - Lobby store: `apps/web-next/src/features/lobby/lobby-store.ts`

  **Acceptance Criteria**:
  - [ ] Route `/connected/create-lobby` exists
  - [ ] Fetches and displays queue list from LCU
  - [ ] Queues sorted by map/mode/default logic (match legacy)
  - [ ] Queue selection creates lobby
  - [ ] i18n keys for all text

  **QA Scenarios**:
  ```
  Scenario: Create lobby flow
    Tool: Playwright
    Steps: 1. Navigate to create-lobby 2. Verify queue list loads 3. Select a queue 4. Verify lobby is created
    Expected: Queue list displays, lobby created successfully
    Evidence: .sisyphus/evidence/parity-task-6-create-lobby.png
  ```

  **Commit**: YES | Message: `feat(lobby): add create-lobby UI with queue selection` | Files: `apps/web-next/src/routes/connected/create-lobby/**`

- [x] 7. Implement queue dodge penalty timer in lobby

  **What to do**: Display dodge penalty timer in the lobby "Find Match" button when a penalty is active. Fetch penalty data from discovered endpoint (Task 1). Show countdown timer. Disable queue join while penalty is active.
  **Must NOT do**: Show fake timer; must use real LCU data.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Timer logic + LCU integration
  - Skills: []

  **Parallelization**: Can Parallel: YES (with Tasks 6, 8-12) | Wave 2 | Blocks: 31-33 | Blocked By: 1-5

  **References**:
  - Legacy dodge timer: `web/src/components/lobby/lobby.*`
  - Lobby hook: `apps/web-next/src/features/lobby/hooks/use-lobby.ts`
  - Queue store: `apps/web-next/src/features/queue/queue-store.ts`

  **Acceptance Criteria**:
  - [ ] Dodge penalty timer displays in lobby CTA
  - [ ] Timer counts down correctly
  - [ ] Queue join disabled while penalty active
  - [ ] Penalty cleared when timer expires

  **QA Scenarios**:
  ```
  Scenario: Dodge penalty display
    Tool: Playwright
    Steps: 1. Enter lobby with active dodge penalty 2. Verify timer shows 3. Wait for timer to expire 4. Verify queue join is enabled
    Expected: Timer counts down, queue join enabled after expiration
    Evidence: .sisyphus/evidence/parity-task-7-dodge-penalty.png
  ```

  **Commit**: YES | Message: `feat(lobby): add dodge penalty timer` | Files: `apps/web-next/src/features/lobby/**`

- [x] 8. Build lobby member component

  **What to do**: Extract lobby member rendering into a reusable `LobbyMember` component. Displays: icon, name, role preferences, leader badge, local player indicator, invite permission indicator. Used in lobby route.
  **Must NOT do**: Duplicate member rendering logic.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: UI component
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Can Parallel: YES (with Tasks 6-7, 9-12) | Wave 2 | Blocks: 31-33 | Blocked By: 1-5

  **References**:
  - Legacy lobby member: `web/src/components/lobby/lobby-member.vue`
  - Current lobby: `apps/web-next/src/routes/connected/lobby/route.tsx`
  - Lobby types: `apps/web-next/src/core/lcu/parsers/lobby.ts`

  **Acceptance Criteria**:
  - [ ] `LobbyMember` component exists
  - [ ] Displays all member info (icon, name, roles, leader, local)
  - [ ] Used in lobby route
  - [ ] Responsive/mobile-friendly

  **QA Scenarios**:
  ```
  Scenario: Lobby member display
    Tool: Playwright
    Steps: 1. Enter lobby 2. Verify members display with correct info
    Expected: Icons, names, roles, leader badges visible
    Evidence: .sisyphus/evidence/parity-task-8-lobby-member.png
  ```

  **Commit**: YES | Message: `feat(lobby): add LobbyMember component` | Files: `apps/web-next/src/features/lobby/components/lobby-member.tsx`

- [x] 9. Build role picker component

  **What to do**: Extract role preference picker into a reusable `RolePicker` component. Allows selecting first/second role from TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY, FILL, UNSELECTED. Used in lobby.
  **Must NOT do**: Hardcode role list; use `lobbyRoles` from parser.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Interactive picker UI
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Can Parallel: YES (with Tasks 6-8, 10-12) | Wave 2 | Blocks: 31-33 | Blocked By: 1-5

  **References**:
  - Legacy role picker: `web/src/components/lobby/role-picker.*`
  - Lobby roles: `apps/web-next/src/core/lcu/parsers/lobby.ts:13-15`
  - Role change mutation: `apps/web-next/src/core/lcu/lcu-mutations.ts`

  **Acceptance Criteria**:
  - [ ] `RolePicker` component exists
  - [ ] Select first and second role
  - [ ] Updates role preferences via mutation
  - [ ] Used in lobby route

  **QA Scenarios**:
  ```
  Scenario: Role picker interaction
    Tool: Playwright
    Steps: 1. Open role picker 2. Select TOP as first 3. Select FILL as second 4. Verify preferences updated
    Expected: Roles update correctly, correct LCU request sent
    Evidence: .sisyphus/evidence/parity-task-9-role-picker.png
  ```

  **Commit**: YES | Message: `feat(lobby): add RolePicker component` | Files: `apps/web-next/src/features/lobby/components/role-picker.tsx`

- [x] 10. Build invite overlay with suggested players

  **What to do**: Create an invite overlay component that shows: (a) input for summoner name, (b) list of suggested players from `/lol-suggested-players/v1/suggested-players`, (c) invite button. Used in lobby.
  **Must NOT do**: Skip suggested players list.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Overlay + list UI
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Can Parallel: YES (with Tasks 6-9, 11-12) | Wave 2 | Blocks: 31-33 | Blocked By: 1-5

  **References**:
  - Legacy invite overlay: `web/src/components/lobby/invite-overlay.*`
  - Suggested players endpoint: `packages/protocol-contract/src/lcu/lcu-paths.ts:82-84`
  - Invite mutation: `apps/web-next/src/core/lcu/lcu-mutations.ts`

  **Acceptance Criteria**:
  - [ ] Invite overlay component exists
  - [ ] Shows suggested players list
  - [ ] Allows invite by summoner name
  - [ ] Used in lobby route

  **QA Scenarios**:
  ```
  Scenario: Invite overlay
    Tool: Playwright
    Steps: 1. Open invite overlay 2. Verify suggested players load 3. Invite by name 4. Verify invite sent
    Expected: Suggested players display, invite sends correct LCU request
    Evidence: .sisyphus/evidence/parity-task-10-invite-overlay.png
  ```

  **Commit**: YES | Message: `feat(lobby): add invite overlay with suggested players` | Files: `apps/web-next/src/features/lobby/components/invite-overlay.tsx`

- [x] 11. Implement sent invites tracking

  **What to do**: Track sent invitation states (pending, accepted, declined, kicked) in the lobby. Display sent invites list with status indicators. Update status when LCU pushes updates.
  **Must NOT do**: Use local-only state; must sync with LCU.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: State sync with LCU
  - Skills: []

  **Parallelization**: Can Parallel: YES (with Tasks 6-10, 12) | Wave 2 | Blocks: 31-33 | Blocked By: 1-5

  **References**:
  - Legacy sent invites: `web/src/components/lobby/lobby.*`
  - Lobby invitations endpoint: `packages/protocol-contract/src/lcu/lcu-paths.ts:36`
  - Observer sync: `apps/web-next/src/core/lcu/lcu-observer-sync.ts`

  **Acceptance Criteria**:
  - [ ] Sent invites list displays in lobby
  - [ ] Shows pending/accepted/declined/kicked states
  - [ ] Updates when LCU state changes
  - [ ] i18n keys for status labels

  **QA Scenarios**:
  ```
  Scenario: Sent invites tracking
    Tool: Playwright
    Steps: 1. Send invite 2. Verify pending state 3. Accept from other client 4. Verify accepted state
    Expected: Status updates correctly in real-time
    Evidence: .sisyphus/evidence/parity-task-11-sent-invites.png
  ```

  **Commit**: YES | Message: `feat(lobby): add sent invites tracking` | Files: `apps/web-next/src/features/lobby/**`

- [x] 12. Implement Swiftplay LCU submission

  **What to do**: When user clicks "Enter Queue" in Swiftplay, submit the configured options to LCU (not just navigate to lobby). Determine correct LCU endpoint/mutation for Swiftplay config submission.
  **Must NOT do**: Leave as navigation-only.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: LCU mutation wiring
  - Skills: []

  **Parallelization**: Can Parallel: YES (with Tasks 6-11) | Wave 2 | Blocks: 31-33 | Blocked By: 1-5

  **References**:
  - Swiftplay route: `apps/web-next/src/routes/connected/swiftplay/route.tsx`
  - Swiftplay store: `apps/web-next/src/features/swiftplay/swiftplay-store.ts`
  - Lobby creation mutation: `apps/web-next/src/core/lcu/lcu-mutations.ts`

  **Acceptance Criteria**:
  - [ ] Swiftplay options submitted to LCU on "Enter Queue"
  - [ ] Correct endpoint/mutation used
  - [ ] Navigation to lobby after successful submission
  - [ ] Error handling for failed submission

  **QA Scenarios**:
  ```
  Scenario: Swiftplay submission
    Tool: Playwright
    Steps: 1. Configure Swiftplay options 2. Click Enter Queue 3. Verify LCU request sent 4. Verify navigation to lobby
    Expected: Config submitted, lobby entered
    Evidence: .sisyphus/evidence/parity-task-12-swiftplay-submit.png
  ```

  **Commit**: YES | Message: `feat(swiftplay): implement LCU config submission` | Files: `apps/web-next/src/routes/connected/swiftplay/route.tsx`, `apps/web-next/src/core/lcu/lcu-mutations.ts`

### Wave 3: Champ-Select Decomposition Foundation

- [x] 13. Extract Timer component

  **What to do**: Extract timer display and countdown logic from `routes/connected/champ-select/route.tsx` into a reusable `ChampSelectTimer` component. Displays phase text (Pick, Ban, etc.), countdown timer, and active turn indicator.
  **Must NOT do**: Break existing timer functionality.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: UI component extraction
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Can Parallel: YES (with Tasks 14-17) | Wave 3 | Blocks: 18-25 | Blocked By: 1-5

  **References**:
  - Legacy timer: `web/src/components/champ-select/timer.*`
  - Current champ-select: `apps/web-next/src/routes/connected/champ-select/route.tsx`
  - Champ-select store: `apps/web-next/src/features/champ-select/champ-select-store.ts`

  **Acceptance Criteria**:
  - [ ] `ChampSelectTimer` component exists
  - [ ] Displays phase and countdown
  - [ ] Updates via React Query observer sync
  - [ ] Used in champ-select route

  **QA Scenarios**:
  ```
  Scenario: Timer display
    Tool: Playwright
    Steps: 1. Enter champ-select 2. Verify timer shows correct phase and countdown
    Expected: Phase text and timer visible, counts down correctly
    Evidence: .sisyphus/evidence/parity-task-13-timer.png
  ```

  **Commit**: YES | Message: `feat(champ-select): extract Timer component` | Files: `apps/web-next/src/features/champ-select/components/timer.tsx`

- [x] 14. Extract Members component

  **What to do**: Extract team member display from champ-select route into `ChampSelectMembers` component. Shows ally/enemy members, assigned roles, summoner spells, splash backgrounds.
  **Must NOT do**: Break existing member display.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Complex list UI
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Can Parallel: YES (with Tasks 13, 15-17) | Wave 3 | Blocks: 18-25 | Blocked By: 1-5

  **References**:
  - Legacy members: `web/src/components/champ-select/members.*`
  - Current champ-select: `apps/web-next/src/routes/connected/champ-select/route.tsx`
  - Data Dragon: `apps/web-next/src/core/http/ddragon-client.ts`

  **Acceptance Criteria**:
  - [ ] `ChampSelectMembers` component exists
  - [ ] Displays ally and enemy members
  - [ ] Shows roles, spells, splash backgrounds
  - [ ] CommunityDragon fallback for missing assets

  **QA Scenarios**:
  ```
  Scenario: Members display
    Tool: Playwright
    Steps: 1. Enter champ-select 2. Verify members display with spells and backgrounds
    Expected: All members visible with correct info
    Evidence: .sisyphus/evidence/parity-task-14-members.png
  ```

  **Commit**: YES | Message: `feat(champ-select): extract Members component` | Files: `apps/web-next/src/features/champ-select/components/members.tsx`

- [x] 15. Extract ChampionPicker component

  **What to do**: Extract champion grid/search/selection from champ-select route into `ChampionPicker` component. Supports search, filtering by role, pickable/bannable lists, declaration intent.
  **Must NOT do**: Break existing champion selection.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Complex interactive grid
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Can Parallel: YES (with Tasks 13-14, 16-17) | Wave 3 | Blocks: 18-25 | Blocked By: 1-5

  **References**:
  - Legacy champion picker: `web/src/components/champ-select/champion-picker.*`
  - Current champ-select: `apps/web-next/src/routes/connected/champ-select/route.tsx`
  - Data Dragon champions: `apps/web-next/src/core/http/ddragon-client.ts`

  **Acceptance Criteria**:
  - [ ] `ChampionPicker` component exists
  - [ ] Search and filter champions
  - [ ] Shows pickable/bannable indicators
  - [ ] Used in champ-select route

  **QA Scenarios**:
  ```
  Scenario: Champion picker
    Tool: Playwright
    Steps: 1. Enter champ-select 2. Search for champion 3. Select champion
    Expected: Search works, champion highlights, selection works
    Evidence: .sisyphus/evidence/parity-task-15-champion-picker.png
  ```

  **Commit**: YES | Message: `feat(champ-select): extract ChampionPicker component` | Files: `apps/web-next/src/features/champ-select/components/champion-picker.tsx`

- [x] 16. Extract SummonerPicker component

  **What to do**: Extract summoner spell selection from champ-select route into `SummonerPicker` component. Shows two spell slots, filtered by game mode, with icons and descriptions.
  **Must NOT do**: Break existing spell selection.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: UI component
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Can Parallel: YES (with Tasks 13-15, 17) | Wave 3 | Blocks: 18-25 | Blocked By: 1-5

  **References**:
  - Legacy summoner picker: `web/src/components/champ-select/summoner-picker.*`
  - Current champ-select: `apps/web-next/src/routes/connected/champ-select/route.tsx`
  - Summoner spells endpoint: `apps/web-next/src/core/lcu/lcu-queries.ts`

  **Acceptance Criteria**:
  - [ ] `SummonerPicker` component exists
  - [ ] Two spell slots with mode filtering
  - [ ] Icons and descriptions
  - [ ] Used in champ-select route

  **QA Scenarios**:
  ```
  Scenario: Summoner spell picker
    Tool: Playwright
    Steps: 1. Enter champ-select 2. Select Flash 3. Select Heal
    Expected: Both spells selected, icons display correctly
    Evidence: .sisyphus/evidence/parity-task-16-summoner-picker.png
  ```

  **Commit**: YES | Message: `feat(champ-select): extract SummonerPicker component` | Files: `apps/web-next/src/features/champ-select/components/summoner-picker.tsx`

- [x] 17. Extract Bench component

  **What to do**: Extract ARAM bench display from champ-select route into `Bench` component. Shows bench champions with swap buttons.
  **Must NOT do**: Break existing bench display.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: UI component
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Can Parallel: YES (with Tasks 13-16) | Wave 3 | Blocks: 18-25 | Blocked By: 1-5

  **References**:
  - Legacy bench: `web/src/components/champ-select/bench.*`
  - Current champ-select: `apps/web-next/src/routes/connected/champ-select/route.tsx`
  - ARAM store: `apps/web-next/src/features/champ-select/aram-store.ts`

  **Acceptance Criteria**:
  - [ ] `Bench` component exists
  - [ ] Displays bench champions
  - [ ] Swap button for each bench champion
  - [ ] Used in champ-select route

  **QA Scenarios**:
  ```
  Scenario: Bench display
    Tool: Playwright
    Steps: 1. Enter ARAM champ-select 2. Verify bench displays 3. Click swap
    Expected: Bench visible, swap sends correct LCU request
    Evidence: .sisyphus/evidence/parity-task-17-bench.png
  ```

  **Commit**: YES | Message: `feat(champ-select): extract Bench component` | Files: `apps/web-next/src/features/champ-select/components/bench.tsx`

### Wave 4: Champ-Select Advanced

- [x] 18. Implement pick intent / declaration

  **What to do**: Allow declaring champion intent before active pick. PATCH action with championId but without completed flag. Show declared champion to teammates.
  **Must NOT do**: Lock in on declaration.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: LCU action state machine
  - Skills: []

  **Parallelization**: Can Parallel: YES (with Tasks 19-22) | Wave 4 | Blocks: 31-33 | Blocked By: 13-17

  **References**:
  - Legacy pick intent: `web/src/components/champ-select/champ-select.*`
  - Champ-select action: `packages/protocol-contract/src/lcu/lcu-paths.ts:16-18`
  - Champ-select store: `apps/web-next/src/features/champ-select/champ-select-store.ts`

  **Acceptance Criteria**:
  - [ ] Declaration sends PATCH with championId only
  - [ ] Declared champion shows to teammates
  - [ ] Does not lock in
  - [ ] Can change declaration before lock

  **QA Scenarios**:
  ```
  Scenario: Pick intent
    Tool: Playwright
    Steps: 1. Enter pick phase 2. Hover/click champion to declare 3. Verify declaration sent 4. Verify not locked
    Expected: Declaration visible, champion not locked
    Evidence: .sisyphus/evidence/parity-task-18-pick-intent.png
  ```

  **Commit**: YES | Message: `feat(champ-select): add pick intent / declaration` | Files: `apps/web-next/src/features/champ-select/**`

- [x] 19. Implement champion trade

  **What to do**: Allow trading champions with teammates. Send trade request mutation, handle accept/decline, update state on trade completion.
  **Must NOT do**: Skip trade request/response flow.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Complex LCU mutation + state sync
  - Skills: []

  **Parallelization**: Can Parallel: YES (with Tasks 18, 20-22) | Wave 4 | Blocks: 31-33 | Blocked By: 13-17

  **References**:
  - Legacy trade: `web/src/components/champ-select/champ-select.*`
  - Champ-select session: `apps/web-next/src/core/lcu/lcu-queries.ts`
  - Mutations: `apps/web-next/src/core/lcu/lcu-mutations.ts`

  **Acceptance Criteria**:
  - [ ] Trade request sends correct mutation
  - [ ] Trade status updates in real-time
  - [ ] UI shows trade pending/accepted/declined
  - [ ] State updates after trade completes

  **QA Scenarios**:
  ```
  Scenario: Champion trade
    Tool: Playwright
    Steps: 1. Request trade with teammate 2. Teammate accepts 3. Verify champions swapped
    Expected: Trade completes, champions swapped
    Evidence: .sisyphus/evidence/parity-task-19-trade.png
  ```

  **Commit**: YES | Message: `feat(champ-select): add champion trade` | Files: `apps/web-next/src/features/champ-select/**`

- [x] 20. Implement champion swap

  **What to do**: Allow swapping pick order with teammates. Send swap request mutation, handle accept/decline, update turn order.
  **Must NOT do**: Skip swap request/response flow.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: LCU mutation + turn order sync
  - Skills: []

  **Parallelization**: Can Parallel: YES (with Tasks 18-19, 21-22) | Wave 4 | Blocks: 31-33 | Blocked By: 13-17

  **References**:
  - Legacy swap: `web/src/components/champ-select/champ-select.*`
  - Champ-select session: `apps/web-next/src/core/lcu/lcu-queries.ts`

  **Acceptance Criteria**:
  - [ ] Swap request sends correct mutation
  - [ ] Swap status updates in real-time
  - [ ] Turn order updates after swap
  - [ ] UI shows swap pending/accepted/declined

  **QA Scenarios**:
  ```
  Scenario: Champion swap
    Tool: Playwright
    Steps: 1. Request swap with teammate 2. Teammate accepts 3. Verify turn order changed
    Expected: Swap completes, turn order updated
    Evidence: .sisyphus/evidence/parity-task-20-swap.png
  ```

  **Commit**: YES | Message: `feat(champ-select): add champion swap` | Files: `apps/web-next/src/features/champ-select/**`

- [x] 21. Implement skin picker post-lock

  **What to do**: Show skin picker after champion is locked. Fetch skins from Data Dragon or LCU skin inventory. Allow skin selection.
  **Must NOT do**: Show skin picker before lock.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: UI component
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Can Parallel: YES (with Tasks 18-20, 22) | Wave 4 | Blocks: 31-33 | Blocked By: 13-17

  **References**:
  - Legacy skin picker: `web/src/components/champ-select/skin-picker.*`
  - Skin inventory: `packages/protocol-contract/src/lcu/lcu-paths.ts:6-8`
  - Data Dragon skins: `apps/web-next/src/core/http/ddragon-client.ts`

  **Acceptance Criteria**:
  - [ ] Skin picker shows after lock
  - [ ] Lists available skins for locked champion
  - [ ] Skin selection updates UI
  - [ ] Default skin always available

  **QA Scenarios**:
  ```
  Scenario: Skin picker
    Tool: Playwright
    Steps: 1. Lock in champion 2. Verify skin picker appears 3. Select a skin
    Expected: Skin picker visible after lock, skin selectable
    Evidence: .sisyphus/evidence/parity-task-21-skin-picker.png
  ```

  **Commit**: YES | Message: `feat(champ-select): add skin picker post-lock` | Files: `apps/web-next/src/features/champ-select/components/skin-picker.tsx`

- [x] 22. Extract PlayerSettings component

  **What to do**: Extract player settings (summoner spells, runes, skins) into `PlayerSettings` component that combines SummonerPicker, RuneEditor (placeholder), and SkinPicker (placeholder). Used in champ-select route.
  **Must NOT do**: Break existing settings display.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Container component
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Can Parallel: YES (with Tasks 18-21) | Wave 4 | Blocks: 31-33 | Blocked By: 13-17

  **References**:
  - Legacy player settings: `web/src/components/champ-select/player-settings.*`
  - Current champ-select: `apps/web-next/src/routes/connected/champ-select/route.tsx`

  **Acceptance Criteria**:
  - [ ] `PlayerSettings` component exists
  - [ ] Combines spell, rune, and skin selection
  - [ ] Used in champ-select route
  - [ ] Responsive layout

  **QA Scenarios**:
  ```
  Scenario: Player settings
    Tool: Playwright
    Steps: 1. Enter champ-select 2. Verify player settings section visible
    Expected: Spells, runes, skins sections visible
    Evidence: .sisyphus/evidence/parity-task-22-player-settings.png
  ```

  **Commit**: YES | Message: `feat(champ-select): add PlayerSettings component` | Files: `apps/web-next/src/features/champ-select/components/player-settings.tsx`

### Wave 5: Rune Editor + Recommended

- [x] 23. Build full rune editor component

  **What to do**: Create `RuneEditor` component for creating, deleting, and editing rune pages. Supports: selecting primary/secondary tree, keystone, runes, stat shards. Validates combinations (e.g., cannot pick same tree for primary and secondary). Integrates with `/lol-perks/v1/pages`, `/lol-perks/v1/styles`, `/lol-perks/v1/currentpage`.
  **Must NOT do**: Allow invalid rune combinations.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Complex interactive UI
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Can Parallel: YES (with Tasks 24-25) | Wave 5 | Blocks: 31-33 | Blocked By: 1-5, 13-17

  **References**:
  - Legacy rune editor: `web/src/components/champ-select/rune-editor.*`
  - Perks endpoints: `packages/protocol-contract/src/lcu/lcu-paths.ts:69-76`
  - Data Dragon runes: `apps/web-next/src/core/http/ddragon-client.ts`

  **Acceptance Criteria**:
  - [ ] Create new rune page
  - [ ] Delete rune page
  - [ ] Select primary tree + keystone + runes
  - [ ] Select secondary tree + runes
  - [ ] Select stat shards
  - [ ] Validation prevents invalid combinations
  - [ ] Save to LCU via mutations

  **QA Scenarios**:
  ```
  Scenario: Rune editor CRUD
    Tool: Playwright
    Steps: 1. Open rune editor 2. Create new page 3. Select primary/secondary 4. Save 5. Delete page
    Expected: Page created, saved to LCU, deleted successfully
    Evidence: .sisyphus/evidence/parity-task-23-rune-editor.png
  ```

  **Commit**: YES | Message: `feat(champ-select): add full rune editor` | Files: `apps/web-next/src/features/champ-select/components/rune-editor.tsx`

- [x] 24. Discover and implement recommended rune sets endpoint

  **What to do**: Investigate LCU API for Riot's recommended rune sets (3 sets shown after champion selection). May be `/lol-perks/v1/recommended-pages` or similar. Add to protocol-contract, create descriptor, parser, and integrate into champ-select.
  **Must NOT do**: Use static/mock data.

  **Recommended Agent Profile**:
  - Category: `librarian` - Reason: External API research
  - Skills: []

  **Parallelization**: Can Parallel: YES (with Tasks 23, 25) | Wave 5 | Blocks: 31-33 | Blocked By: 1

  **References**:
  - Legacy rune editor: `web/src/components/champ-select/rune-editor.*`
  - LCU perks: `packages/protocol-contract/src/lcu/lcu-paths.ts:69-76`

  **Acceptance Criteria**:
  - [ ] Endpoint discovered and documented
  - [ ] Added to protocol-contract
  - [ ] Descriptor and parser created
  - [ ] Returns 3 recommended sets for selected champion
  - [ ] Graceful fallback if endpoint unavailable

  **QA Scenarios**:
  ```
  Scenario: Recommended runes
    Tool: Bash
    Steps: grep -r "recommended" packages/protocol-contract/src/lcu/
    Expected: Endpoint documented in lcu-paths.ts
    Evidence: .sisyphus/evidence/parity-task-24-recommended-runes.txt
  ```

  **Commit**: YES | Message: `feat(lcu): add recommended rune sets endpoint` | Files: `packages/protocol-contract/src/lcu/lcu-paths.ts`, `apps/web-next/src/core/lcu/**`

- [x] 25. Integrate recommended runes into champ-select

  **What to do**: Show 3 recommended rune sets in champ-select after champion is selected/hovered. Allow clicking a set to apply it. Display set name, primary/secondary trees, keystone.
  **Must NOT do**: Show recommended sets before champion selection.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: UI integration
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Can Parallel: YES (with Tasks 23-24) | Wave 5 | Blocks: 31-33 | Blocked By: 23-24

  **References**:
  - Legacy rune editor: `web/src/components/champ-select/rune-editor.*`
  - Champ-select route: `apps/web-next/src/routes/connected/champ-select/route.tsx`

  **Acceptance Criteria**:
  - [ ] Recommended sets display after champion selection
  - [ ] Clicking set applies it
  - [ ] Shows set details (trees, keystone)
  - [ ] i18n keys for labels

  **QA Scenarios**:
  ```
  Scenario: Recommended runes in champ-select
    Tool: Playwright
    Steps: 1. Select champion 2. Verify 3 recommended sets appear 3. Click first set 4. Verify applied
    Expected: Sets display, click applies runes
    Evidence: .sisyphus/evidence/parity-task-25-recommended-integration.png
  ```

  **Commit**: YES | Message: `feat(champ-select): integrate recommended rune sets` | Files: `apps/web-next/src/features/champ-select/**`

### Wave 6: Mobile Polish

- [x] 26. Implement queue-pop audio with iOS unlock

  **What to do**: Play queue-pop.mp3 when match is found. Implement iOS audio unlock workaround (user-gesture requirement). Use Web Audio API or HTML5 Audio. Add mute/volume control.
  **Must NOT do**: Play audio without user interaction on iOS.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Mobile-specific implementation
  - Skills: []

  **Parallelization**: Can Parallel: YES (with Tasks 27-30) | Wave 6 | Blocks: 31-33 | Blocked By: 6-12

  **References**:
  - Legacy audio: `web/src/static/queue-pop.mp3`, `web/src/components/ready-check/ready-check.*`
  - iOS audio unlock: `web/src/components/root/root.ts`
  - Audio assets: Check `apps/web-next/public/` or `web/src/static/`

  **Acceptance Criteria**:
  - [ ] Queue-pop audio plays on match found
  - [ ] iOS audio unlock on first user interaction
  - [ ] Audio respects device mute setting (best effort)
  - [ ] Graceful fallback if audio fails

  **QA Scenarios**:
  ```
  Scenario: Queue pop audio
    Tool: Playwright
    Steps: 1. Join queue 2. Wait for match 3. Verify audio plays
    Expected: Audio plays when match found
    Evidence: .sisyphus/evidence/parity-task-26-audio.png
  ```

  **Commit**: YES | Message: `feat(audio): add queue-pop sound with iOS unlock` | Files: `apps/web-next/src/features/notifications/**`, `apps/web-next/public/queue-pop.mp3`

- [x] 27. Implement ready-check vibration

  **What to do**: Trigger device vibration when ready-check appears. Use Navigator.vibrate API. Fallback gracefully if API unavailable.
  **Must NOT do**: Crash if vibration API is missing.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: Simple API call
  - Skills: []

  **Parallelization**: Can Parallel: YES (with Tasks 26, 28-30) | Wave 6 | Blocks: 31-33 | Blocked By: 6-12

  **References**:
  - Legacy vibration: `web/src/components/ready-check/ready-check.*`
  - Notification manager: `apps/web-next/src/features/notifications/notification-manager.ts`

  **Acceptance Criteria**:
  - [ ] Vibration triggers on ready-check
  - [ ] Graceful fallback if API unavailable
  - [ ] Does not interfere with audio

  **QA Scenarios**:
  ```
  Scenario: Ready-check vibration
    Tool: Playwright
    Steps: 1. Trigger ready-check 2. Verify vibration API called
    Expected: Vibration triggered
    Evidence: .sisyphus/evidence/parity-task-27-vibration.png
  ```

  **Commit**: YES | Message: `feat(notifications): add ready-check vibration` | Files: `apps/web-next/src/features/notifications/notification-manager.ts`

- [x] 28. Implement PWA install prompt

  **What to do**: Show browser-native PWA install prompt. Use `beforeinstallprompt` event. Add install button in UI. Handle installed state. Configure vite-plugin-pwa manifest.
  **Must NOT do**: Show custom install banner (use native prompt).

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: PWA configuration
  - Skills: []

  **Parallelization**: Can Parallel: YES (with Tasks 26-27, 29-30) | Wave 6 | Blocks: 31-33 | Blocked By: None

  **References**:
  - Legacy PWA: `web/vue.config.js`, `web/src/main.ts`
  - vite-plugin-pwa: Already installed in `apps/web-next/package.json`
  - Manifest: `apps/web-next/public/manifest.webmanifest`

  **Acceptance Criteria**:
  - [ ] PWA install prompt triggers on eligible browsers
  - [ ] Install button in UI
  - [ ] Installed state tracked
  - [ ] Manifest configured correctly

  **QA Scenarios**:
  ```
  Scenario: PWA install
    Tool: Playwright
    Steps: 1. Load app 2. Verify install prompt available 3. Click install
    Expected: Native install prompt shows
    Evidence: .sisyphus/evidence/parity-task-28-pwa.png
  ```

  **Commit**: YES | Message: `feat(pwa): add install prompt and manifest config` | Files: `apps/web-next/vite.config.ts`, `apps/web-next/public/manifest.webmanifest`

- [x] 29. Verify iOS safe-area and notch handling

  **What to do**: Ensure app handles iOS safe-area-insets correctly. Check `env(safe-area-inset-*)` CSS usage. Verify landscape warning. Test on simulated iOS viewport.
  **Must NOT do**: Assume safe-area is already handled.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: CSS/layout verification
  - Skills: [`frontend-ui-ux`]

  **Parallelization**: Can Parallel: YES (with Tasks 26-28, 30) | Wave 6 | Blocks: 31-33 | Blocked By: None

  **References**:
  - Legacy iOS handling: `web/src/root.styl`, `web/src/main.ts`
  - Current safe-area: `apps/web-next/src/components/layout/SafeArea.tsx`
  - Landscape warning: `apps/web-next/src/components/layout/LandscapeWarning.tsx`

  **Acceptance Criteria**:
  - [ ] Safe-area insets work on iOS
  - [ ] Content not obscured by notch
  - [ ] Landscape warning displays correctly
  - [ ] Viewport meta tag configured

  **QA Scenarios**:
  ```
  Scenario: iOS safe-area
    Tool: Playwright
    Steps: 1. Simulate iPhone viewport 2. Verify safe-area padding 3. Rotate to landscape
    Expected: Content respects safe-area, landscape warning shows
    Evidence: .sisyphus/evidence/parity-task-29-safearea.png
  ```

  **Commit**: YES | Message: `fix(layout): verify iOS safe-area and notch handling` | Files: `apps/web-next/src/components/layout/**`, `apps/web-next/index.html`

- [x] 30. Add CommunityDragon splash fallback

  **What to do**: Use CommunityDragon CDN as fallback for champ-select splash art when Data Dragon asset is missing. Build URL pattern for centered splashes.
  **Must NOT do**: Break existing Data Dragon image loading.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: URL helper function
  - Skills: []

  **Parallelization**: Can Parallel: YES (with Tasks 26-29) | Wave 6 | Blocks: 31-33 | Blocked By: 13-17

  **References**:
  - Legacy CommunityDragon: `web/src/constants.ts`
  - Data Dragon client: `apps/web-next/src/core/http/ddragon-client.ts`
  - Champ-select members: `apps/web-next/src/features/champ-select/components/members.tsx`

  **Acceptance Criteria**:
  - [ ] CommunityDragon URL builder function
  - [ ] Fallback when Data Dragon asset fails
  - [ ] Used in champ-select member backgrounds

  **QA Scenarios**:
  ```
  Scenario: Splash fallback
    Tool: Playwright
    Steps: 1. Load champ-select 2. Block Data Dragon CDN 3. Verify CommunityDragon fallback loads
    Expected: Fallback images display
    Evidence: .sisyphus/evidence/parity-task-30-communitydragon.png
  ```

  **Commit**: YES | Message: `feat(assets): add CommunityDragon splash fallback` | Files: `apps/web-next/src/core/http/ddragon-client.ts`

### Wave 7: Final Verification

- [x] 31. Full regression test across all features

  **What to do**: Test every user flow end-to-end: connect, create-lobby, lobby management, queue, ready-check, champ-select (pick, ban, intent, trade, swap, skins, runes), invites, swiftplay.
  **Must NOT do**: Skip any flow.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Manual QA
  - Skills: [`/playwright`]

  **Parallelization**: Can Parallel: YES (with Tasks 32-33) | Wave 7 | Blocks: None | Blocked By: 6-30

  **Acceptance Criteria**:
  - [ ] All flows work without errors
  - [ ] No console errors
  - [ ] No TypeScript errors
  - [ ] Mobile polish works

  **QA Scenarios**:
  ```
  Scenario: Full regression
    Tool: Playwright
    Steps: 1. Connect 2. Create lobby 3. Invite player 4. Join queue 5. Accept ready-check 6. Pick champion 7. Select runes 8. Lock in
    Expected: Every step works, no errors
    Evidence: .sisyphus/evidence/parity-task-31-regression.png
  ```

  **Commit**: NO

- [x] 32. Audit for missing legacy features

  **What to do**: Compare legacy `web/src/components/` with web-next `src/features/` and `src/routes/`. Identify any remaining gaps. Check: all legacy components have equivalent, all LCU flows covered, all mobile features present.
  **Must NOT do**: Assume parity based on route existence.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: File comparison
  - Skills: []

  **Parallelization**: Can Parallel: YES (with Tasks 31, 33) | Wave 7 | Blocks: None | Blocked By: 6-30

  **Acceptance Criteria**:
  - [ ] Legacy component list mapped to web-next equivalents
  - [ ] Zero unmapped legacy features
  - [ ] Documented list of intentional exclusions (Clash/Custom/Arena)

  **QA Scenarios**:
  ```
  Scenario: Feature audit
    Tool: Bash
    Steps: ls web/src/components/ | sort > legacy.txt && ls apps/web-next/src/features/ apps/web-next/src/routes/connected/ | sort > next.txt && diff legacy.txt next.txt
    Expected: All legacy features accounted for
    Evidence: .sisyphus/evidence/parity-task-32-audit.txt
  ```

  **Commit**: NO

- [x] 33. Code quality review

  **What to do**: Run lint, type check, tests. Verify no new errors. Check for code smells: unused imports, console.logs, any types, duplicate logic.
  **Must NOT do**: Skip lint/type check.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: Automated checks
   Skills: [`/review-work`]

  **Parallelization**: Can Parallel: YES (with Tasks 31-32) | Wave 7 | Blocks: None | Blocked By: 6-30

  **Acceptance Criteria**:
  - [ ] `tsc --noEmit` passes with 0 errors
  - [ ] `vp lint` passes (warnings documented)
  - [ ] All tests pass
  - [ ] No new console.logs or TODOs

  **QA Scenarios**:
  ```
  Scenario: Quality check
    Tool: Bash
    Steps: 1. cd apps/web-next && bunx tsc --noEmit 2. vp lint 3. bun test
    Expected: All pass
    Evidence: .sisyphus/evidence/parity-task-33-quality.txt
  ```

  **Commit**: NO

## Commit Strategy

- **Wave 1**: 4 commits (paths, descriptors, parsers, mutations)
- **Wave 2**: 7 commits (create-lobby, dodge penalty, lobby member, role picker, invite overlay, sent invites, swiftplay)
- **Wave 3**: 5 commits (timer, members, champion picker, summoner picker, bench)
- **Wave 4**: 5 commits (pick intent, trade, swap, skin picker, player settings)
- **Wave 5**: 3 commits (rune editor, recommended endpoint, recommended integration)
- **Wave 6**: 5 commits (audio, vibration, PWA, safe-area, CommunityDragon)
- **Wave 7**: 0 commits (verification only)

**Total**: ~29 commits across the parity effort.

## Success Criteria

- All legacy features have working equivalents in web-next
- All new code uses i18n translation keys
- All new LCU endpoints have descriptors and parsers
- Zero TypeScript errors
- Parser unit tests cover new parsers
- Mobile polish works on iOS Safari and Android Chrome
- PWA install prompt works on supported browsers
- Audio plays after user interaction (iOS-compliant)
- All existing web-next flows still work (no regressions)

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Recommended runes endpoint doesn't exist | Graceful fallback, document as unavailable |
| Champ-select decomposition breaks existing behavior | Extract one component at a time, verify after each |
| iOS audio unlock fails | Graceful degradation, no audio if unlock fails |
| Rune validation rules incorrect | Match LCU constraints, test with real client |
| Trade/swap endpoints differ by patch | Document endpoint discovery in Task 1 |
| Large blast radius | Feature-by-feature waves, each independently testable |
| PWA install prompt browser-specific | Test on target browsers, graceful fallback |
| Component decomposition causes state sync issues | Keep React Query as source of truth |

## Notes

- **Clash/Custom/Arena**: Intentionally excluded from this plan. These have stores but no LCU integration. Will be addressed in a future plan if needed.
- **Legacy Vue patterns**: Do not migrate Vue patterns directly. Re-implement using React patterns (hooks, components, Zustand stores).
- **i18n**: All new strings must use `react-i18next` `useTranslation()` hook with keys added to `apps/web-next/src/i18n/translations/`.
- **Audio assets**: Check if `queue-pop.mp3` exists in `apps/web-next/public/`. If not, copy from `web/src/static/`.
