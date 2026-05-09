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
- Ran bun test v1.3.11 (a04817ce) in  and saved the full output to .
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

### 2026-05-09 Settings store
- Added `apps/web-next/src/core/state/settings-store.ts` using `createPersistedStore` with key `mimic:settings`, version `1`, and explicit `localStorage` storage.
- Durable settings are `theme`, `language`, and `showOfflineGroup`; `partialize` intentionally includes only those fields.
- Defaults are `theme: 'system'`, `language: 'en'`, and `showOfflineGroup: false`; actions are `setTheme`, `setLanguage`, and `setShowOfflineGroup`.
- `lsp_diagnostics` on `settings-store.ts` is clean; direct Bun import/action smoke passed, with only the expected unavailable-browser-storage warnings in Bun.
- Workspace `typecheck`, `build`, `lint`, and full `bun test` remain blocked by pre-existing unrelated failures (Bun `mock` typings, lobby sticky tests, i18n parity, Rift handshake timeouts, ready-check/lobby route tests).

### 2026-05-09 DDragon/debug persistence scope
- Decision: `apps/web-next/src/core/http/ddragon-client.ts` remains outside Zustand. Its `mimic:ddragon:*` localStorage key is an HTTP/Data Dragon metadata cache for latest-version lookup, not UI state, domain state, or a user preference.
- Decision: `apps/web-next/src/core/debug.ts` remains outside `settings-store`. Its `mimic-debug` localStorage key controls diagnostic/debug infrastructure and URL-driven debug behavior, not a durable user setting.
- Added source comments beside both storage keys so future persistence audits know these localStorage usages are intentional documented exceptions.
