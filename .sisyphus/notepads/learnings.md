Split rune-editor into smaller components: RuneTreeSelector, PrimaryRuneGrid, SecondaryRuneGrid, StatShardGrid, RunePageControls. Fixed react-hooks-js/immutability warning by passing handler down.
Grouped boolean-heavy lobby props into `gameMode`, `session`, `permissions`, and `sheets` objects to clear react-doctor `no-many-boolean-props` warnings without changing render behavior.
Removed an unused `selectedFriendId` prop from `ChatPanel` to keep the social panel API aligned with actual usage and avoid dead prop drift.
# 2026-05-08 — Gameflow navigation hook

- `use-gameflow-navigation.ts` now imports `isGameflowPhase` from `../lib/resolve-gameflow-navigation` and no longer pulls the unused `gameflowPhases` store constant.
- The resolver module must export `isGameflowPhase` for the hook import to type-check and for `@mimic/web-next` to build cleanly.
