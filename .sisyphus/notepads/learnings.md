Split rune-editor into smaller components: RuneTreeSelector, PrimaryRuneGrid, SecondaryRuneGrid, StatShardGrid, RunePageControls. Fixed react-hooks-js/immutability warning by passing handler down.
Grouped boolean-heavy lobby props into `gameMode`, `session`, `permissions`, and `sheets` objects to clear react-doctor `no-many-boolean-props` warnings without changing render behavior.
Removed an unused `selectedFriendId` prop from `ChatPanel` to keep the social panel API aligned with actual usage and avoid dead prop drift.
# 2026-05-08 — Gameflow navigation hook

- `use-gameflow-navigation.ts` now imports `isGameflowPhase` from `../lib/resolve-gameflow-navigation` and no longer pulls the unused `gameflowPhases` store constant.
- The resolver module must export `isGameflowPhase` for the hook import to type-check and for `@mimic/web-next` to build cleanly.

## 2026-05-09 app key flow verification
- Added targeted Bun coverage in apps/web-next/src/core/state/tests/app-key-flows.test.tsx for connection/session, lobby/ui, champ-select picker store subscriptions, custom-game store team semantics, and settings/session persistence.
- Targeted command passes: bun test src/core/state/tests/app-key-flows.test.tsx => 6 tests, 17 assertions.
- Build command currently fails on TypeScript test typing issues in lcu-mutations.test.ts, use-lobby.sticky.test.ts, use-ready-check.test.ts, and lcu-mock.smoke.test.ts.
13: # 2026-05-09 ARAM card selection fix
14: - In `apps/web-next/src/features/champ-select/components/champion-picker.tsx`, ARAM card clicks now resolve the original `aramCards` index via `findIndex` before calling `aramSelectCard`.
15: - `lsp_diagnostics` on the changed file is clean; `bun run typecheck` still fails because of existing unrelated Bun test typing errors in `src/core/lcu/lcu-mutations.test.ts`, `src/features/lobby/hooks/tests/use-lobby.sticky.test.ts`, `src/features/ready-check/hooks/use-ready-check.test.ts`, and `src/testing/lcu-mock.smoke.test.ts`.

## Final Manual QA F3 Round 2 - 2026-05-09
- Required tests passed: persist-hydration (6), rift-store (8), aram-store (3), app-key-flows (6 from apps/web-next workspace; root invocation only failed alias resolution for @/).
- ARAM selection contract verified: selecting card index 1 returns champion 22 and moves unchosen champions 11 and blessed 33 to bench.
- Logout direct store exercise cleared deviceId, connectionCode, sessionCode, and returnUrl in state and persisted empty values to mimic:connection/mimic:session.
- Legacy migration covered by persist-hydration test for deviceID/conduitID/mimicSessionCode.
