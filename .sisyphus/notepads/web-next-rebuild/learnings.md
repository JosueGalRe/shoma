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

## T5: Connection Page Rebuild
- `useRiftClient` hook manages the `RiftClient` instance lifecycle. It is tied to the component's lifecycle.
- For the connection page, we use `useRiftClient` to initiate the connection and verify the code.
- When the connection is successful, we redirect to `/connected/lobby`.
- The global reconnection logic will be handled in T6 by `__root/route.tsx` using the persisted code in `useRiftStore`.
- We used Tailwind CSS for basic functional styling, avoiding complex animations or gradients as requested.
