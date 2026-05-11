## 2026-05-11
- `apps/rift-next/tests/unit/realtime.test.ts` now exercises `makeRealtimeService(...)` directly and wraps calls with `Effect.runSync` / `Effect.runSyncExit`.
- The old sync facade was only wrapping the Effect service and can be removed once tests stop importing it.
