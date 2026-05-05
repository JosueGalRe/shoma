## 2026-05-04 - Social fallback behavior

- The social store now starts empty and loading to avoid mock friends flashing before LCU data arrives.
- `useSocialLCU` only calls `resetToMockData()` when Rift is explicitly `disconnected`, or after an 8 second connected-with-transport timeout if no friends data arrives.
- Friends are first parsed with the available group map and re-fetched/re-hydrated when the friend-group map changes, preserving the existing `useLcuFriends` hook for other consumers.
