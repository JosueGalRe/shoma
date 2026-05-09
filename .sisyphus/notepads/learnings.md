Split rune-editor into smaller components: RuneTreeSelector, PrimaryRuneGrid, SecondaryRuneGrid, StatShardGrid, RunePageControls. Fixed react-hooks-js/immutability warning by passing handler down.
Grouped boolean-heavy lobby props into `gameMode`, `session`, `permissions`, and `sheets` objects to clear react-doctor `no-many-boolean-props` warnings without changing render behavior.
Removed an unused `selectedFriendId` prop from `ChatPanel` to keep the social panel API aligned with actual usage and avoid dead prop drift.
