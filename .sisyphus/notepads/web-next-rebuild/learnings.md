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

## Connected Layout
- Used `AppShell` from `@/components/layout` to wrap the connected routes.
- TanStack Router's `Link` component handles active state automatically via `activeProps`.
- Used standard Tailwind colors for the layout to ensure it looks good without relying on custom CSS variables that might not be defined yet.
