- Aliases now map both `~/*` and `@/*` to `src/*` in Vite + TS.
- The i18next Vite plugin crashes on hand-written i18n files unless its scan target is isolated; pointing it at an empty generated folder avoids the parser failure during scaffold work.
- New base state stores in `src/core/state/` should stay tiny: connection state only keeps `status`, `code`, and `error`, while the gameflow store only tracks `phase` plus `previousPhase`.
- Legacy connection persistence still uses `conduitID` in `localStorage`, with `mimicSessionCode` and `mimicReturnUrl` in `sessionStorage` for reconnect/return-flow handling.
- Gameflow transitions are easiest to keep testable by exposing a pure reducer plus a `canTransition...` helper and making invalid transitions no-ops.
- ky's local type definitions in this workspace expect `prefix` rather than `prefixUrl`, so the HTTP clients need the older option name to satisfy TypeScript.
- Data Dragon version lookup is a good fit for a tiny memory + localStorage cache because the payload is immutable enough for the app session, while champion/profile-icon queries can stay keyed by the resolved version.
- Rift web-next core now mirrors the legacy wire protocol from scratch: ws base defaults to `ws://localhost:51001/mobile`, CONNECT requests a desktop pubkey, identity sends `[MobileOpcode.SECRET, encryptedIdentity]`, accepted SECRET_RESPONSE enables AES-CBC payload encryption, and LCU frames are JSON MobileOpcode frames inside encrypted Rift SEND/RECEIVE payloads.
- `bun --cwd apps/web-next run build` is rejected by this Bun CLI before scripts run; `bun run --cwd apps/web-next build` reaches TypeScript and currently fails in pre-existing HTTP files because ky Options uses `prefix` rather than `prefixUrl` in `src/core/http/ddragon-client.ts` and `src/core/http/http-client.ts`.
- For the new i18n bootstrap, a tiny browser-language resolver is enough: `navigator.language` can pick `en`/`es` without adding a detector dependency, and `supportedLngs + load: 'languageOnly'` keeps the config predictable.
- The new base translations can stay intentionally small (`common`, `connection`, `lobby`, `queue`, `readyCheck`, `invites`, `champSelect`, `errors`) while still covering the MVP entry points.
- In this environment, `bun --cwd apps/web-next run build` only prints Bun CLI help, but `bun run --cwd apps/web-next build` completes successfully.
- The new root reconnect flow lives best in `src/routes/__root/` as a tiny orchestration hook: `useRiftStore` drives status, `useRiftClient` owns the socket lifecycle, and `readPersistedReturnUrl`/`clearPersistedReturnUrl` wrap the store helpers for redirect cleanup.

## T5: Connection Page Rebuild

- `useRiftClient` hook manages the `RiftClient` instance lifecycle. It is tied to the component's lifecycle.
- For the connection page, we use `useRiftClient` to initiate the connection and verify the code.
- When the connection is successful, we redirect to `/connected/lobby`.
- The global reconnection logic will be handled in T6 by `__root/route.tsx` using the persisted code in `useRiftStore`.
- We used Tailwind CSS for basic functional styling, avoiding complex animations or gradients as requested.

## T16: web-next test migration decisions

- KEEP: `tests/integration/i18n-resources-parity.test.ts` and `tests/integration/i18n-language-and-connected-copy.test.ts`; these still target existing i18n resources and remain relevant to the rebuild.
- ADAPT: `tests/integration/rift-handshake.test.ts`; protocol behavior remains relevant, but `RiftClientState` now exports from `src/core/rift/rift-client.ts`.
- ADAPT: legacy `tests/integration/lcu-transport.test.ts`; the rebuilt LCU transport no longer owns a WebSocket, so coverage now uses a mocked `RiftClient` and preserves request/response, timeout, observer, unsubscribe, and reconnect assertions.
- ADAPT: legacy `tests/unit/gameflow-store.test.ts`; old observer/LCU side effects no longer exist, so coverage now targets pure reducer transitions, valid/invalid no-ops, reset, and Zustand actions in `src/core/state/gameflow-store.ts`.
- DISCARD: old unit tests for `aram-store`, `skins-store`, `summoners-store`, `runes-store`, `champ-select-store`, `invites-store`, `ready-check-store`, `queue-store`, and `observer`; their concrete source modules were removed or reduced to empty feature indexes in the rebuild, so keeping them would test APIs that no longer exist rather than real protocol behavior.
- DISCARD: old integration tests for `rift-lcu-transport`, `lcu-client`, `connect-utils-parsers`, and `connected-lcu-initialization-utils`; those modules do not exist in the rebuilt core and their responsibilities moved into `LcuTransport`, route-local code, or future feature work.
- DISCARD/REPLACE: old `e2e-code-263542` and `rift-http-connect-flow` tests imported removed `rift-api` wrappers and encoded one-off fixture/runtime checks; they were replaced by `http-client.test.ts` covering the new `registerConduit`, `checkToken`, and `getProtocolHealth` APIs.
- NEW: `rift-store.test.ts` covers persistence keys (`conduitID`, `mimicSessionCode`, `mimicReturnUrl`), reducer functions, and store actions without browser assumptions.
- NEW: `ddragon-client.test.ts` mocks `fetch` to cover version localStorage caching, champion response parsing/memory caching, champion details lookup, and profile-icon positive/negative caching.

## Layout Components

- `SafeArea` uses inline styles with `env(safe-area-inset-*)` to handle mobile safe areas dynamically.
- `LandscapeWarning` uses `window.matchMedia('(orientation: landscape)')` to detect orientation changes and provides fallbacks for older browsers (`addListener` vs `addEventListener`).
- `AppShell` is a simple wrapper that combines `SafeArea` and `LandscapeWarning` to provide the base layout structure.
- Rebuilt shadcn UI primitives (button, card, input, dropdown-menu, alert, skeleton, spinner) from scratch with ultra-basic styling using Tailwind CSS.
- `apps/web-next/public/` already had the needed PWA assets (`favicon.svg`, `icon-192.svg`, `icon-512.svg`), so the installability work only needed manifest alignment.
- The manifest can be verified live at `http://127.0.0.1:5173/manifest.webmanifest` after `bun run --cwd apps/web-next preview --host 127.0.0.1 --port 5173`; it serves valid JSON with the requested colors and icon references.
- The rebuilt invites feature can stay tiny: the hook can mirror `useLCUObserver` snapshots into Zustand with id-based upserts/removals, while the page only renders a flat pending-invites list with accept/decline buttons.
- For invite parsing, it is safer to accept multiple possible LCU field names (`invitationId`/`id`, `fromSummonerName`/`inviterName`, `gameMode`/`queueId`/`mapId`) so the UI keeps working even if the payload shape is a little different.

## Connected Layout

- Used `AppShell` from `@/components/layout` to wrap the connected routes.
- TanStack Router's `Link` component handles active state automatically via `activeProps`.
- Used standard Tailwind colors for the layout to ensure it looks good without relying on custom CSS variables that might not be defined yet.

## T9: Lobby Rebuild

- The rebuilt lobby feature keeps server snapshots in a small Zustand store (`members`, `queueStatus`, `invites`, `rolePreferences`, `isOwner`) and lets `use-lobby` own LCU hydration/subscriptions plus guarded actions.
- Lobby LCU paths come from `@mimic/protocol-contract`: `/lol-lobby/v2/lobby`, `/lol-matchmaking/v1/search`, `/lol-lobby/v2/received-invitations`, member promote/kick, invitations, and local position preferences.
- Profile icons can be resolved from Data Dragon with `useLatestDdragonVersion` + `getProfileIconUrl`; cache icon URLs by summoner id so route rendering stays simple.
- `useLCURequest` now exposes `refetchWithBody(nextBody)` in addition to `refetch()`, which keeps champ-select action patching compatible with the current transport hook API and allows the web-next build to pass.

## T11: Ready Check Rebuild

- For timer-driven Zustand state, select primitive fields and stable action refs separately; selecting the whole store object can retrigger effects and create an interval loop.
- The ready-check hook can stay self-contained by creating a Rift client from the persisted connection code, deriving an LCU transport, and using `useLCUObserver` for the ready-check snapshot.
- `bun --cwd apps/web-next run build` still prints Bun CLI help here; the working invocation is `bun run --cwd apps/web-next build`.
- The current build is blocked by a pre-existing type error in `src/features/champ-select/hooks/use-champ-select.ts` (`refetchWithBody` missing on `LcuRequestState<ChampSelectSession>`), which is unrelated to ready-check.
- The new queue flow works best as a tiny trio: Zustand store for timer/type/penalty flags, a hook that mirrors `useLCUObserver` + `useLCURequest` into the store and owns the second-by-second interval, and a route that only renders the current snapshot plus cancel navigation.
- If Bun/TypeScript reports an unrelated old error during `tsc -b`, `bunx tsc -b --clean` can clear stale incremental state; after that, `bun run build` in `apps/web-next` completes normally.

## T13: Champ Select Rebuild

- New web-next champ select uses the rebuilt core LCU hooks with a route-local Rift transport, because `useLCUObserver` requires `(transport, path)` in the current core.
- Champion grid assets can use Data Dragon splash URLs directly from `ChampionSummary.key`: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/<key>_0.jpg`.
- The required `bun --cwd apps/web-next run build` form is still rejected by this Bun CLI; `bun run --cwd apps/web-next build` is the verified equivalent and passes after T13.

## T17: E2E Playwright migration

- The current web-next entry point still renders the static `Hello Mimic` shell from `src/main.tsx`, so browser E2E can only assert backend-free URL loading/screenshots until the router is mounted in source.
- Rebuilt gameflow E2E coverage should target `canTransitionGameflowPhase`, `reduceGameflowTransition`, `reduceGameflowReset`, and `useGameflowStore` instead of removed `state-guards.ts`/`transitions.ts`.
- Rebuilt champ-select E2E coverage should target `useChampSelectStore` session hydration and action patch behavior instead of removed `pick-ban-logic.ts`.

## Final verification fixes

- `main.tsx` now needs both TanStack Router and React Query mounted together; `routeTree.gen.ts` supplies the router tree while `defaultPreloadStaleTime: 0` and `defaultStaleTime: 0` keep route data fresh.
- Connection success must update both the Rift client state and `useRiftStore.status`; adding `setConnected()` prevents connected routes from showing a permanent `connecting` store status.
- For Zustand-backed hooks, do not satisfy exhaustive-deps by depending on the entire store object in effects that update that same store. Select stable actions separately, as done for champ-select `setChampions`, to avoid maximum update depth loops.
- Route files should only export route components/config. Shared reconnect/session/layout helpers now live under `src/lib/` and are imported through the `@/` alias.

## 2026-05-03 - T19 Mode Rules Engine

- Active web UI lives in apps/web-next; task paths in the prompt map under that workspace.
- Lobby currently exposes queue/lobby data through useLobby(), and champ-select exposes LCU session data through useChampSelect(); route components should query mode rules instead of carrying mode-specific booleans.
- apps/web-next verification passes independently with bun run build, bun run test, and bun run lint.

## 2026-05-04 - T20 Swiftplay Preselect Flow

- The Swiftplay store should validate its empty state immediately; otherwise tests and the lobby gate disagree about whether the config is complete.
- A tiny Swiftplay route can reuse `useChampions()` plus plain `<select>` inputs; keeping it route-local avoids touching champ-select logic.
- Connected nav items are centralized in `src/lib/connected-layout-utils.ts`, so adding a route link there keeps the header in sync automatically.
- For the connected layout, the nav order is anchored by the `arena` entry; `clash` and `custom` should be inserted immediately after it to keep the menu sequence consistent.

## 2026-05-04

- `vite-plugin-pwa` works cleanly with `strategies: 'injectManifest'` and a TS source worker at `src/pwa-sw.ts`; the built output still lands at `dist/pwa-sw.js`.
- Shared browser APIs used by notification code need defensive guards; importing the i18n singleton in tests exposed a missing `navigator.language` check.

## 2026-05-04 - T22 Eligibility Error Translation

- A small recursive string collector works well for LCU error translation because the payload shape is inconsistent; matching on normalized text keeps the mapper tolerant of raw strings and nested objects.
- Regex priority matters for overlapping eligibility cases: party-rank-difference needs to win before the broader ranked-restriction matcher.
- Test files outside the app tsconfig may need an ambient Bun module declaration in `src/` so the language server can resolve `bun:test` cleanly.

## 2026-05-04 - T23 ARAM Champion Cards

- ARAM-specific champ-select UI can stay route-local: use `getModeRules()`/`champSelect.isAram` to switch only the picker panel while leaving loadout, bench swap, reroll, and team panels unchanged.
- The active ARAM state lives in `apps/web-next/src/features/champ-select/aram-store.ts`; tests import the Zustand store directly and reset it in `beforeEach`.
- Card-derived bench entries need their own local tracking (`cardBench`) and must be merged with LCU `benchChampionIds`; otherwise session refetches after champion selection can erase the unchosen cards.
- For tests outside the app tsconfig, a `tests/bun-test.d.ts` ambient declaration keeps single-file LSP diagnostics clean without lint-banned triple-slash references.

## T24 Arena Mode - 2026-05-04

- Arena mode lives in apps/web-next; source paths in the plan map under apps/web-next/src.
- TanStack route files should be added under src/routes route.tsx files; do not edit generated routeTree.gen.ts.
- Arena rules were already present in mode-engine.ts with simultaneous bans enabled and standard runes/spells disabled, so the implementation should consume rules instead of duplicating them.
- Connected nav labels are constrained by ConnectedNavItem labelKey; adding a route also requires widening that union.

## T25 Clash Flow - 2026-05-04

- Clash routes/stores live under apps/web-next/src relative to the workspace root.
- Connected routes use TanStack createFileRoute and existing Card primitives from @/components/ui.
- Store tests use Bun and reset Zustand state with useStore.getState().reset() in beforeEach.
