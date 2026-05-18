## 2026-05-09 Work Session Started

Plan: zustand-optimization
Session: ses_1f3704cc2ffer4i74fXwJ0b2n9

### Conventions

- All evidence goes to `.sisyphus/evidence/task-{N}-{slug}.{ext}`
- All commits use `type(scope): description` convention
- NO modifications outside `apps/web-next/src/` and `apps/web-next/tests/`
- Preserve public APIs of existing stores

### Learnings

- 12 Zustand stores exist in apps/web-next/src/
- 1 React context provider: RiftClientProvider
- Prop drilling hotspots: connected, lobby, custom, champ-select routes
- Ad-hoc storage: rift-store (connection code), rift-client (deviceID), social-store (showOfflineGroup), ddragon-client (version cache), debug.ts (debug flag)
- Existing persist: lobby-store uses zustand/persist with sessionStorage

### Decisions

- Keep domain stores separate (NO mega-store)
- Create settings-store (localStorage) + session-store (localStorage + sessionStorage)
- ddragon-client and debug.ts remain outside Zustand (documented exceptions)
- RiftClientProvider stays (audited, manages transport lifecycle)
- Class-based slices: NO (keep functions)

### Issues

- Need to handle legacy key migration: conduitID, deviceID, mimicSessionCode, mimicReturnUrl, mimic:social:show-offline-group
- Need partialize enforcement in createPersistedStore types
- Need corruption handling tests

## 2026-05-09 Task 1 Inventory

- Evidence written to `.sisyphus/evidence/task-1-inventory.md`.
- `ast_grep_search` found 12 exported `create<Store>()` hooks in `apps/web-next/src/**/*store.ts`; `lobby-store.ts` additionally exports `useStickyLobbyStore` with `zustand/persist`.
- Only current `zustand/persist` usage is `useStickyLobbyStore` with `sessionStorage` key `mimic:lobby:sticky`; it currently lacks `version`, `migrate`, and `partialize`.
- Ad-hoc storage inventory: `rift-store.ts` (`conduitID`, `mimicSessionCode`, `mimicReturnUrl`), `rift-client.ts` (`deviceID`), `social-store.ts` (`mimic:social:show-offline-group`), `ddragon-client.ts` (`mimic:http:latest-version` via prefix), and `debug.ts` (`mimic-debug`).
- LSP references show no runtime direct consumers for `useLobbyStore`, `useQueueStore`, or `useGameflowStore`; runtime lobby/champ-select state mostly flows through hooks (`useLobby`, `useChampSelect`) and then prop-drills through routes.

## 2026-05-09 Task 2 Provider Audit

- Audited `apps/web-next/src/core/rift/rift-client-provider.tsx`, `rift-client.ts`, `hooks.ts`, `lcu-transport.ts`, `route-loader.ts`, and `rift-store.ts`.
- Decision: MANTENER `RiftClientProvider`; it bridges Zustand's serializable connection intent (`code`, `status`, `error`) to non-serializable Rift runtime objects.
- Do not move `RiftClient`/`LcuTransport` into Zustand: they own WebSocket, CryptoKey, timers, listener sets, observer maps, pending request callbacks, and unsubscribe cleanup.
- Follow-up risk if this area is refactored: provider derives `LcuTransport` with `useMemo`; explicit `transport.close()` on replacement/unmount would be worth reviewing, though current old-client cleanup bounds the practical leak.

### 2026-05-09 Baseline capture

- Ran bun test v1.3.11 (a04817ce) in and saved the full output to .
- Baseline summary: 159 pass, 14 fail, 3 errors across 173 tests in 40 files.
- Store spec counts: aram 3, clash 3, custom 4, gameflow 6, rift 6, swiftplay 3.
- The current failures were outside the store specs (integration/i18n, arena route, ready-check overlay, match acceptance flow, lobby sticky members, lobby route grace).

### 2026-05-09 Baseline capture (retry)

- Ran bun test in apps/web-next and saved the full output to apps/web-next/.sisyphus/evidence/task-4-baseline.log.
- Wrote the per-store JSON summary to apps/web-next/.sisyphus/evidence/task-4-baseline.json.
- Baseline summary: 159 pass, 14 fail, 3 errors across 173 tests in 40 files.
- Store spec counts: aram 3, clash 3, custom 4, gameflow 6, rift 7, swiftplay 3.
- The current failures were outside the store specs (integration/i18n, arena route, ready-check overlay, match acceptance flow, lobby sticky members, lobby route grace).

### 2026-05-09 Persisted store helper

- Added `apps/web-next/src/core/state/create-persisted-store.ts` with a typed `createPersistedStore<T>` wrapper around Zustand `persist`.
- Enforced `name`, `version`, and `partialize` in `PersistedStoreOptions<T>`; `name` follows `mimic:{domain}`.
- Storage is selected through a simple `localStorage`/`sessionStorage` switch and defaults to `localStorage`.
- `lsp_diagnostics` on the new helper file is clean.
- Package-wide `bun run tsc --noEmit` still reports pre-existing Bun test typing errors unrelated to this helper.

### 2026-05-09 Session store

- Added `apps/web-next/src/core/state/session-store.ts` with a composed `useSessionStore` hook backed by two `createPersistedStore` instances.
- `mimic:connection` uses `localStorage` for `deviceId` and `connectionCode`; `mimic:session` uses `sessionStorage` for `sessionCode` and `returnUrl`.
- Legacy keys are read as initial values: `deviceID`, `conduitID`, `mimicSessionCode`, and `mimicReturnUrl`; browser imports immediately write the initialized values into the new persisted records.
- `deviceId` uses `crypto.randomUUID()` when available and falls back to the existing v4-like generator.
- Verification: `lsp_diagnostics` on `session-store.ts` is clean and a Bun smoke import exercised defaults, setters, and `logout`; package typecheck/build/lint/full tests remain blocked by pre-existing unrelated failures.

### 2026-05-09 Settings store

- Added `apps/web-next/src/core/state/settings-store.ts` using `createPersistedStore` with key `mimic:settings`, version `1`, and explicit `localStorage` storage.
- Durable settings are `theme`, `language`, and `showOfflineGroup`; `partialize` intentionally includes only those fields.
- Defaults are `theme: 'system'`, `language: 'en'`, and `showOfflineGroup: false`; actions are `setTheme`, `setLanguage`, and `setShowOfflineGroup`.
- `lsp_diagnostics` on `settings-store.ts` is clean; direct Bun import/action smoke passed, with only the expected unavailable-browser-storage warnings in Bun.
- Workspace `typecheck`, `build`, `lint`, and full `bun test` remain blocked by pre-existing unrelated failures (Bun `mock` typings, lobby sticky tests, i18n parity, Rift handshake timeouts, ready-check/lobby route tests).

### 2026-05-09 Centralized persistence migration

- Migrated `rift-store.ts` away from direct `localStorage`/`sessionStorage` helpers; connection code now reads/writes through `useSessionStore`, and disconnect delegates runtime cleanup to `logout()`.
- Migrated `rift-client.ts` device identity reads/writes to `useSessionStore.deviceId`/`setDeviceId`, preserving generated fallback behavior without touching legacy keys directly.
- Migrated `social-store.ts` show-offline-group reads/writes to `useSettingsStore.showOfflineGroup`/`setShowOfflineGroup`.
- `session-utils.ts` now preserves the return URL utility API by delegating to `useSessionStore` instead of importing removed Rift persistence helpers.
- Verification: changed source files have clean LSP diagnostics; `bun test tests/unit/rift-store.test.ts` and `bun test tests/unit/social/use-send-chat-message.test.ts` pass. Full lint/build/test remain blocked by the same unrelated baseline failures already recorded above.

### 2026-05-09 Persist hydration tests

- Added `apps/web-next/tests/unit/persist-hydration.test.ts` covering settings hydration, session hydration, legacy session-key migration, malformed settings JSON fallback, unavailable browser storage, and logout/runtime-session cleanup preserving settings.
- Tests use cache-busted dynamic imports so Zustand persist hydration re-runs after each test preloads `localStorage`/`sessionStorage`.
- The current `useSessionStore.logout()` clears the runtime session slice (`sessionCode`/`returnUrl`), not the local connection slice (`connectionCode`/`deviceId`); the test follows the implemented API because this task forbids source changes.
- Verification: `lsp_diagnostics` on the new test file is clean and `bun test tests/unit/persist-hydration.test.ts` passes 6/6. Full `bun test`, `bun run build`, and `bun run lint` remain blocked by the previously recorded unrelated baseline failures.

### 2026-05-09 Lobby sticky persistence normalization

- Refactored `useStickyLobbyStore` to use `createPersistedStore` with explicit `partialize`, `version: 1`, and `storage: 'sessionStorage'` while preserving the `mimic:lobby:sticky` key.
- Added a `migrate` callback that carries forward `stickyMembers` and `stickyMode` so pre-versioned persisted lobby data survives the helper migration.
- Bun lobby tests still emit the expected "storage is currently unavailable" warning in the test environment, but the sticky lobby suite passes.
- Verification: `lsp_diagnostics` on `apps/web-next/src/features/lobby/lobby-store.ts` is clean and `bun test tests/unit/lobby-session.test.ts tests/unit/lcu-parsers/lobby.test.ts src/features/lobby/hooks/tests/use-lobby.sticky.test.ts` passes 22/22.

### 2026-05-09 Social store verification

- `apps/web-next/src/features/social/social-store.ts` already uses `useSettingsStore.getState().showOfflineGroup` for initial read and `useSettingsStore.getState().setShowOfflineGroup(...)` for writes; no direct `localStorage` access remains in the file.
- Verified with `lsp_diagnostics` on `social-store.ts`, `settings-store.ts`, and `persist-hydration.test.ts` (all clean).
- Verified with `bun test tests/unit/persist-hydration.test.ts` (6/6 pass).

### 2026-05-09 Gameflow store modernization

- `apps/web-next/src/core/state/gameflow-store.ts` remains non-persisted; no `zustand/persist` middleware was added.
- Added reusable phase selectors (`selectGameflowPhase`, `selectPreviousGameflowPhase`) and cached boolean selectors via `selectIsGameflowPhase(phase)` plus common exports (`selectIsNone`, `selectIsLobby`, `selectIsMatchmaking`, `selectIsReadyCheck`, `selectIsChampSelect`, `selectIsInProgress`).
- Verified selector behavior and absence of persist middleware in `apps/web-next/tests/unit/gameflow-store.test.ts`.
- Verification: `lsp_diagnostics` clean on the changed source and test files; `bun test tests/unit/gameflow-store.test.ts` passes 8/8.

### 2026-05-09 Rift store selector refactor

- Confirmed apps/web-next/src/core/state/rift-store.ts has no direct localStorage or sessionStorage references; connection persistence remains delegated to useSessionStore.
- Added additive riftStoreSelectors stable selector functions and migrated current internal consumers to reuse them without removing or renaming existing useRiftStore, reducer, state, or action exports.
- Added tests/unit/rift-store.test.ts coverage for selector outputs and the existing store key surface.
- Verification: changed-file LSP diagnostics are clean; bun test tests/unit/rift-store.test.ts passes 8/8; full bun test, bun run build, and bun run lint remain blocked by pre-existing unrelated baseline issues in Bun mock typings, lobby sticky persistence/tests, i18n parity, Rift handshake timeouts, ready-check/arena tests, and existing lint warnings/errors.

### 2026-05-09 Remaining feature stores selector pass

- Confirmed `queue-store.ts`, `ready-check-store.ts`, `invites-store.ts`, `swiftplay-store.ts`, `custom-store.ts`, and `clash-store.ts` do not use `persist` middleware.
- Added cached selector factories for queue type, ready-check status, invite id, swiftplay summoner config, and clash phase so repeated selector requests reuse function identity.
- Added derived selectors for the simple feature stores to keep consumers on stable store accessors instead of ad-hoc field reads.
- Verification: `lsp_diagnostics` is clean on all six stores and their unit tests; `bun test tests/unit/queue-store.test.ts tests/unit/ready-check-store.test.ts tests/unit/invites-store.test.ts tests/unit/swiftplay-store.test.ts tests/unit/custom-store.test.ts tests/unit/clash-store.test.ts` passes 25/25.
- `bun run build` in `apps/web-next` still fails on pre-existing unrelated issues (`bun:test` mock typing gaps, champ-select derived-state typing, lobby sticky test signatures), not on these store changes.
- Swiftplay public API was restored to state-only selectors (`SwiftplayStoreState`), and the speculative validation cache was removed to keep selector behavior pure.

### 2026-05-09 Task 13 Champ-select/ARAM stores

- Decision: do not split `champ-select-store.ts` into slices. It is large because it combines exported domain types with cohesive volatile session/selection/action logic; slices would add cross-slice orchestration without reducing public API.
- Added memoized `selectChampSelectDerivedState` keyed by session reference and synchronized derived fields on session/action updates.
- `aram-store.ts` stays unsliced and volatile; documented no persistence.
- Verification: changed-file LSP diagnostics clean; `bun test tests/unit/aram-store.test.ts` passes 3/3; `bun run test:e2e tests/e2e/pick-ban.pw.ts` passes 9/9. Build/full tests/lint remain blocked by previously recorded unrelated baseline issues.

### 2026-05-09 Connected social drawer UI store

- Extended `apps/web-next/src/core/state/ui-store.ts` with volatile `isSocialDrawerOpen`, `setSocialDrawerOpen`, and `toggleSocialDrawer`; no persistence middleware was added.
- Refactored `apps/web-next/src/routes/connected/route.tsx` so the route no longer owns `useState` for the social drawer or passes social open/close state through the route tree.
- Kept the generic `BottomSheet` controlled API unchanged; the connected route's social sheet child reads/writes `useUiStore` and passes controlled values into the existing primitive.
- Verification: changed-file LSP diagnostics clean; `bun test tests/integration/i18n-language-and-connected-copy.test.ts` passes 2/2. `bun run build` remains blocked by existing unrelated test type errors in Bun `mock` imports and `use-lobby.sticky.test.ts` signatures.

### 2026-05-09 Custom route prop drilling

- Refactored `apps/web-next/src/routes/connected/custom/route.tsx` so `TeamPanel` reads `players`, `isSpectatorEnabled`, `addPlayer`, and `movePlayer` directly from `useCustomGameStore`; route props were reduced to `team` and `title`.
- Kept lobby/custom player merging as a local hook because lobby members still come from `useLobby`, while custom-game state remains owned by `custom-store.ts`.
- Verification: `lsp_diagnostics` clean on `custom/route.tsx`; `vp lint --max-warnings=0 src/routes/connected/custom/route.tsx` passes; `bun test tests/unit/custom-store.test.ts` passes 6/6.
- Full `bun run lint` and `bun run build` remain blocked by unrelated existing issues in `connected/route.tsx`, Bun `mock` typings, and lobby sticky test harness typings.

### 2026-05-09 DDragon/debug persistence scope

- Decision: `apps/web-next/src/core/http/ddragon-client.ts` remains outside Zustand. Its `mimic:ddragon:*` localStorage key is an HTTP/Data Dragon metadata cache for latest-version lookup, not UI state, domain state, or a user preference.
- Decision: `apps/web-next/src/core/debug.ts` remains outside `settings-store`. Its `mimic-debug` localStorage key controls diagnostic/debug infrastructure and URL-driven debug behavior, not a durable user setting.
- Added source comments beside both storage keys so future persistence audits know these localStorage usages are intentional documented exceptions.

### 2026-05-09 Lobby route UI prop drilling

- Added non-persisted `apps/web-next/src/core/state/ui-store.ts` for shared lobby UI state only: role sheet open, invite sheet open, and invite overlay open.
- Removed prop-drilled UI props from `LobbyBottomSheets`: `sheets.isRoleSheetOpen`, `sheets.setIsRoleSheetOpen`, `sheets.isInviteSheetOpen`, and `sheets.setIsInviteSheetOpen`.
- Removed prop-drilled UI props from `LobbyInviteOverlay`: `isInviteOverlayOpen` and `setIsInviteOverlayOpen`.
- Kept lobby domain state (`members`, `queueStatus`, `rolePreferences`, `invites`, `sentInvites`, permissions, and LCU actions) flowing from `useLobby()`/existing stores instead of globalizing it.
- Verification: changed-file LSP diagnostics clean; `bun test src/routes/connected/lobby/tests/lobby-route-grace.test.ts` passes 4/4; direct Bun smoke import toggles all lobby UI-store booleans successfully. `bun run build` and `bun run lint` remain blocked by pre-existing unrelated baseline errors in Bun `mock` typings, sticky-lobby tests, champ-select typing, and existing lint warnings.

### 2026-05-09 Champ-select picker prop drilling

- Refactored ChampionPicker so champion list, selected champion, bans, picked team champions, phase, and ARAM card state are read directly from volatile Zustand stores instead of being prop-drilled through connected/champ-select/route.tsx.
- Updated useChampSelectStore.setSession to synchronize the session/local selected champion into non-persisted store state, preserving the hook-derived behavior while making direct store selectors reliable for UI children.
- Temporary picker UI state (query, sortOrder) remains local component state and is not persisted.
- Verification: changed-file LSP diagnostics clean; bun test tests/unit/lcu-parsers/champ-select.test.ts passed 5/5; bun run test:e2e tests/e2e/pick-ban.pw.ts passed 9/9; touched-file vp lint passed. bun run build remains blocked by pre-existing unrelated Bun mock/lobby sticky TypeScript errors.

### 2026-05-09 Full web-next verification

- Ran requested verification sequence for apps/web-next. Direct workspace fmt:check is undefined; root bun run fmt:check still exits 1 via the known IDE-only oxfmt wrapper. Trying vp fmt . --check reaches the formatter but hits the known configuration blocker: Failed to load configuration file / expected value at line 1 column 1. No script change was kept.
- bun run lint in apps/web-next exits 1 with previously recorded groups: Bun mock typing/import errors, sticky lobby harness hook/type errors, and warnings promoted by --max-warnings=0.
- bun test in apps/web-next reports 183 pass, 14 fail, 3 errors across 197 tests / 44 files. Compared with T4 baseline (159 pass, 14 fail, 3 errors across 173 tests / 40 files), pass/test coverage increased and failing/error counts did not regress.
- bun run build in apps/web-next exits 1 on the same pre-existing typecheck blockers: bun:test mock exports and sticky lobby harness signatures.
- Root bun run doctor:react:check passes with apps/web-next score 93 and apps/conduit-next score 100.

## 2026-05-09 Real Manual QA F3 rerun

- App-key flow tests passed: bun test src/core/state/tests/app-key-flows.test.tsx (6/6). Required unit suites passed: persist hydration (6/6), rift store (8/8), aram store (3/3), custom store (6/6).
- Direct runtime checks confirmed logout clears connectionCode, deviceId, sessionCode, and returnUrl; legacy mimic:social:show-offline-group migrates to settings showOfflineGroup.
- Source-only typecheck passed with a temporary app-local config excluding tests: npx tsc --noEmit --skipLibCheck -p tsconfig.source-only.tmp.json.

## 2026-05-09 Final Verification F1/F2 follow-up

- Centralized the remaining legacy localStorage/sessionStorage reads in `create-persisted-store.ts` via exported `hasLocalStorage`, `hasSessionStorage`, `readLegacyLocalStorageValue`, and `readLegacySessionStorageValue` helpers.
- `session-store.ts` now caches its combined connection/runtime snapshot and updates that cache from module-level backing-store subscriptions, so `useSyncExternalStore` receives stable references while imperative `useSessionStore.getState()` stays fresh.
- Restored `SocialStoreActions.setShowOfflineGroup(value)` as a delegating public API to `useSettingsStore.getState().setShowOfflineGroup(value)` while preserving `toggleShowOfflineGroup()`.
- Verification: changed-file LSP diagnostics clean; no direct `globalThis.localStorage`/`globalThis.sessionStorage` references remain in `session-store.ts` or `settings-store.ts`; `bun test apps/web-next/tests/unit/rift-store.test.ts` passes 8/8.
- Additional targeted verification from `apps/web-next`: `bun test src/core/state/tests/app-key-flows.test.tsx` passes 6/6, `bun test tests/unit/persist-hydration.test.ts` passes 6/6, and `bun test tests/unit/social/use-send-chat-message.test.ts` passes 3/3.

### 2026-05-09 Storage-unavailable guard

- Hardened `getPersistedStorage()` in `create-persisted-store.ts` so SSR and test environments return `undefined` instead of touching `window`.
- Wrapped storage selection in `try/catch` so private-mode/localStorage failures fall back to no persistence instead of crashing store creation.
- Verification: `lsp_diagnostics` on `create-persisted-store.ts` is clean.

## 2026-05-09 F3 Round 3 final manual QA

- Requested tests passed: persist-hydration (6), rift-store (8), aram-store (3), app-key-flows (6).
- Browser QA via agent-browser on dev server 5175: connection screen, seeded lobby, ARAM champ-select cards, and custom game bot/team grouping rendered without uncaught browser errors.
- Settings persistence passed: theme=dark and showOfflineGroup=true stored in mimic:settings and survived reload.
- Legacy migration passed for deviceID, conduitID, mimicSessionCode, mimicReturnUrl, and mimic:social:show-offline-group using cache-busted store imports.
- Rejection blockers: bun run build fails in tsc due existing test typing errors; logout only clears session-store connection/runtime state and leaves other localStorage/sessionStorage keys including legacy keys and unrelated mimic:\* data.

## 2026-05-12 - T4 deduped query utility

- Added `web/src/lib/deduped-query.ts` with the Sona-style `let promise: Promise<T> | null = null` closure pattern and `.finally()` reset so subsequent calls re-fetch after settlement.
- Added `web/src/lib/deduped-query.test.ts`; Bun test conventions use `bun:test` imports and colocated `*.test.ts` files.
- Verification: zero LSP diagnostics on both new files, `bun test src/lib/deduped-query.test.ts`, and `bun run build` in `web` all passed.
