# Task 13: Champ-select / ARAM store refactor

## Decision

Do **not** split `champ-select-store.ts` into slices for this task. The store is longer than the others mostly because it owns exported champ-select protocol types plus derived session helpers. The action logic remains one cohesive volatile domain: selection, session patching, turn state, and error handling all depend on the active champ-select action. Splitting into selection/session/error slices would introduce cross-slice orchestration without reducing the public API.

`aram-store.ts` also remains unsliced because it is compact and scoped to ARAM cards/rerolls/bench actions.

## Implementation

- Added `ChampSelectDerivedState` and `selectChampSelectDerivedState`, a memoized selector keyed by the current session reference.
- Kept derived fields (actions, bannedChampions, benchChampionIds, currentAction, phase, timer, teams, local turn flags) synchronized when sessions/actions change.
- Preserved existing public actions and hook return shape; added the required `benchChampionIds` field to `useChampSelect()` now that it inherits the expanded store state type.
- Documented in both stores that champ-select/ARAM are volatile and must not use persistence.
- Confirmed no `persist`, `createPersistedStore`, `localStorage`, or `sessionStorage` usage exists under `src/features/champ-select`.

## Verification

- `lsp_diagnostics` clean for:
  - `src/features/champ-select/champ-select-store.ts`
  - `src/features/champ-select/aram-store.ts`
  - `src/features/champ-select/hooks/use-champ-select.ts`
- `bun test tests/unit/aram-store.test.ts`: 3 pass / 0 fail.
- `bun run test:e2e tests/e2e/pick-ban.pw.ts`: 9 pass / 0 fail across Mobile, Tablet, Desktop projects.
- Persistence guard grep only matched decision comments, not persistence APIs.
- `bun run build` remains blocked by pre-existing unrelated errors in Bun test typings and lobby sticky tests; after fixing the hook return, no champ-select/ARAM build errors remain.
- Full `bun test` remains blocked by pre-existing unrelated failures recorded earlier: Rift handshake timeouts, i18n parity, arena route provider, ready-check snapshot text, match acceptance navigation, lobby sticky storage, and lobby route grace.
- `bun run lint` remains blocked by pre-existing unrelated errors/warnings in lcu mock tests, lobby sticky tests, provider fast-refresh warnings, feedback/lobby/social/arena tests.
