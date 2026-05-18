## 2026-05-05

- Problem: `useRiftClient` now depends on the whole `options` object, which is fragile unless every caller memoizes it.
- Problem: the lobby dodge-penalty countdown can become stale without the removed local timer behavior.
