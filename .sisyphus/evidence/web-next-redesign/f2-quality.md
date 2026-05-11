# F2 Code Quality Review — web-next UI redesign

## Verdict

REJECT

## Automated verification

- `lsp_diagnostics` on `apps/web-next/src`: 0 errors, 2 hints from the capped directory scan:
  - `routes/connected/lobby/-components/rune-panel/rune-panel-utils.ts`: unused `RuneStyle` hint.
  - `routes/connected/lobby/-hooks/lobby-platform-effects/index.ts`: unused `appendLog` hint.
- Targeted diagnostics on required review files surfaced additional quality hints:
  - `routes/connected/champ-select/-components/ChampionsTab.tsx`: unused `formatChampionLabel`; unused `championId` prop in `ChampionGridItem`.
  - `routes/connected/champ-select/-components/ChampSelectTabs.tsx`: unused `useState` import.
  - `routes/connected/lobby/route.tsx`: unused `ROLE_OPTIONS`, `formatRolePair`, `getMapName`, and `getQueueDescription`.
  - `core/http/ddragon-client.ts`: unused `parseChampionNamesById` helper.
- Anti-pattern grep for `as any|@ts-ignore|console.log|TODO|FIXME|HACK`: only generated `routeTree.gen.ts` contains `as any` casts; no matches in reviewed handwritten files.
- `framer-motion` grep: no imports found.
- Build: `bun run --filter @mimic/web-next build` exited 0.
- Tests: `bun run --filter @mimic/web-next test` exited 0; 30 pass, 0 fail, 79 assertions.

## Manual review findings

### Blocking quality issues

1. `apps/web-next/src/routes/connected/lobby/route.tsx`
   - Lines 11, 23, and 70 import/destructure values that are never used: `ROLE_OPTIONS`, `formatRolePair`, `getMapName`, and `getQueueDescription`.
   - Lines 135-193 start asynchronous profile loading but do not use a cancellation flag or abort mechanism before calling `setMemberProfiles`. If the route unmounts or membership changes while requests are in flight, stale work can still update state after the effect is obsolete.
   - Lines 153-156 use `Promise.race` with `setTimeout` but never clear the timeout when the request resolves first. This leaves unnecessary timers alive until they fire.

2. `apps/web-next/src/routes/connected/invites/route.tsx`
   - Lines 207-210 set `shareCopied` back to false via `setTimeout` without cleanup. If the route unmounts before the timer fires, stale state work remains scheduled.

3. `apps/web-next/src/routes/connected/champ-select/-components/ChampionsTab.tsx`
   - Line 9 imports `formatChampionLabel` but never uses it.
   - Lines 184-193 include a `championId` prop that is passed and destructured but never used.
   - The IntersectionObserver setup on lines 198-220 correctly disconnects on cleanup.

4. `apps/web-next/src/routes/connected/champ-select/-components/ChampSelectTabs.tsx`
   - Line 1 imports `useState` but never uses it.

5. `apps/web-next/src/core/http/ddragon-client.ts`
   - Line 60 assigns `championCandidate.id as string` after only validating `key` and `name`. This bypasses runtime validation for the string champion key from Data Dragon; malformed payloads can enter `ChampionMetadata.key` despite the exported type requiring a string.
   - Lines 69-76 define `parseChampionNamesById`, but it is unused.

### Checks that passed

- React hooks are called unconditionally in the reviewed components/routes.
- i18n calls in reviewed files use the typed selector form such as `t(($) => $.connected.invites)`.
- No `framer-motion` imports were found.
- `LandscapeWarning.tsx` removes both `resize` and media-query listeners in effect cleanup.
- Data Dragon client uses the expected `https://ddragon.leagueoflegends.com` base URL, version endpoint, locale-specific champion JSON path, ky timeout, and retry configuration.
- Tailwind usage generally follows the existing utility-class style, though formatting is inconsistent between single-quoted and double-quoted JSX class strings.

## Required fixes before approval

- Remove unused imports, unused destructured values, unused props, and the unused Data Dragon helper from reviewed files.
- Add cleanup/cancellation for timers and in-flight async state updates in `lobby/route.tsx` and `invites/route.tsx`.
- Validate `championCandidate.id` before assigning it to `ChampionMetadata.key` in `ddragon-client.ts`.
