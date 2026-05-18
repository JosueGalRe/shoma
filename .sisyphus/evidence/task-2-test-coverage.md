# Task 2 — rift-next test execution and coverage map

## Test execution

Command executed from `apps/rift-next`:

```bash
bun test
```

Captured output: `.sisyphus/evidence/task-2-test-output.txt`

Result observed:

```text
bun test v1.3.13-canary.1 (bf2e2cec)

 33 pass
 0 fail
 75 expect() calls
Ran 33 tests across 5 files. [1335.00ms]
```

No skipped or todo tests were found in the current `apps/rift-next/tests/**/*.ts` files.

## Test files mapped to source behavior

| Test file                                         | Source files covered                                                                                                                                                                                                                                                                                                                                              | Coverage notes                                                                                                                                                                                                                                                                      | Effect usage                                                                                                                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/unit/http-smoke.test.ts`                   | `src/index.ts`; indirectly `src/core/http/http-schemas.ts`, `src/core/http/index-utils.ts`, `src/core/database/database.ts`, `src/core/database/database-service.ts`, `src/core/config/env-config.ts`, `src/core/logger/logger-utils.ts`                                                                                                                          | Exercises `/register` and `/check` through `app.handle`, including missing pubkey/token, JWT secret failure, valid registration, repeated pubkey code reuse, valid/missing/malformed token checks.                                                                                  | Imperative Bun async tests; no `effect` import or `Effect.runPromise`.                                                                                                                                                                  |
| `tests/unit/index.test.ts`                        | `src/index.ts` export of `extractConduitAuth`; directly `src/core/http/index-utils.ts`; indirectly `src/core/http/http-schemas.ts`, `src/core/http/index-types.ts`                                                                                                                                                                                                | Exercises conduit auth extraction from legacy headers and URL query params.                                                                                                                                                                                                         | Pure imperative Bun tests; no `effect` import.                                                                                                                                                                                          |
| `tests/unit/realtime.test.ts`                     | Directly `src/core/realtime/realtime.ts`, `src/core/realtime/realtime-service.ts`, `src/core/realtime/realtime-types.ts`, `src/core/database/database-service.ts`, `src/core/logger/logger-utils.ts`, `src/index.ts`; indirectly `src/core/realtime/realtime-utils.ts`, `src/core/realtime/realtime-schemas.ts`                                                   | Exercises conduit/mobile open, message routing, invalid opcodes, malformed frames, unknown peers, keepalive, deterministic keepalive with `TestClock`, shutdown cleanup, missing/offline conduit response, uninitialized database failure, and `/register` missing pubkey response. | Mixed. Uses Effect directly via `Effect.void` logger stubs, `Effect.runPromise`, `Effect.gen`, `Effect.provide(TestContext.TestContext)`, `TestClock.adjust`, and `Effect.runPromiseExit`; other manager tests are imperative wrappers. |
| `tests/integration/websocket-integration.test.ts` | `src/index.ts`; indirectly `src/core/realtime/realtime-service.ts`, `src/core/realtime/realtime-utils.ts`, `src/core/realtime/realtime-schemas.ts`, `src/core/database/database.ts`, `src/core/database/database-service.ts`, `src/core/http/http-schemas.ts`, `src/core/http/index-utils.ts`, `src/core/config/env-config.ts`, `src/core/logger/logger-utils.ts` | Starts an Elysia server and uses real `WebSocket` clients. Exercises legacy opcode relay, missing public key close, invalid token close, stale token code close, conduit eviction for same code, and mobile peer closure when conduit disconnects.                                  | Imperative async integration tests; no direct Effect execution in the test code.                                                                                                                                                        |
| `tests/integration/runtime.test.ts`               | `src/index.ts`; indirectly the same HTTP/WebSocket/database/realtime stack as runtime startup and shutdown                                                                                                                                                                                                                                                        | Exercises `startRuntime`, root route response, idempotent `stop()`, and runtime stop closing active WebSocket clients.                                                                                                                                                              | Imperative async integration tests; no direct Effect execution in the test code.                                                                                                                                                        |
| `tests/helpers/auth-test-helpers.ts`              | Test helper only                                                                                                                                                                                                                                                                                                                                                  | Reads JWT secret and decodes register tokens for tests.                                                                                                                                                                                                                             | Imperative helper; no Effect usage.                                                                                                                                                                                                     |
| `tests/helpers/db-test-helpers.ts`                | Test helper only                                                                                                                                                                                                                                                                                                                                                  | Creates and removes temporary SQLite DB files.                                                                                                                                                                                                                                      | Imperative helper; no Effect usage.                                                                                                                                                                                                     |
| `tests/helpers/ws-test-helpers.ts`                | Test helper only                                                                                                                                                                                                                                                                                                                                                  | Queues parsed WebSocket frames and waits for open/close events.                                                                                                                                                                                                                     | Imperative Promise/event helper; no Effect usage.                                                                                                                                                                                       |

## Source file coverage inventory

| Source file                             | Test coverage status                                  | Evidence                                                                                                                                                                                             |
| --------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`                          | Covered directly by HTTP/unit/runtime/WebSocket tests | Imported by all 5 executed test files; route handlers and runtime lifecycle are exercised.                                                                                                           |
| `src/core/config/env-config.ts`         | Indirect only                                         | Used through `src/index.ts` and database defaults. Missing JWT secret path is covered; config parsing edge cases such as invalid `PORT` are not targeted directly.                                   |
| `src/core/database/database.ts`         | Indirect only                                         | Used by app initialization and HTTP/WebSocket flows; no standalone tests for wrapper functions `generateCode`, `lookup`, `potentiallyUpdate`.                                                        |
| `src/core/database/database-service.ts` | Partially direct                                      | `realtime.test.ts` verifies uninitialized `generateCode` failure; HTTP/integration tests indirectly cover initialize, generate, lookup, update. Query/open failure paths are not directly simulated. |
| `src/core/database/database-types.ts`   | Type-only / no runtime tests                          | Interfaces only; no direct behavioral surface.                                                                                                                                                       |
| `src/core/effect/index.ts`              | Untested                                              | No test imports `src/core/effect`.                                                                                                                                                                   |
| `src/core/effect/runtime.ts`            | Untested                                              | No test imports or exercises `makeRuntime`.                                                                                                                                                          |
| `src/core/http/http-schemas.ts`         | Indirect only                                         | Invalid/missing request shapes are covered through HTTP endpoints and `extractConduitAuth`; schema helpers are not directly unit-tested.                                                             |
| `src/core/http/index-types.ts`          | Type-only / no runtime tests                          | Types only; no direct behavioral surface.                                                                                                                                                            |
| `src/core/http/index-utils.ts`          | Partially direct                                      | `index.test.ts` targets `extractConduitAuth`; other helpers (`readPubkeyFromBody`, `readConduitOpenData`, `readTokenCode`) are covered indirectly through app paths.                                 |
| `src/core/logger/logger-utils.ts`       | Indirect/stubbed only                                 | Realtime unit tests use `LoggerService` stubs; app/integration tests instantiate logger middleware, but logging behavior/shape is not asserted.                                                      |
| `src/core/realtime/realtime.ts`         | Direct                                                | `realtime.test.ts` exercises `RiftRealtimeManager` imperative wrapper methods.                                                                                                                       |
| `src/core/realtime/realtime-service.ts` | Direct                                                | `realtime.test.ts` exercises service construction, connection routing, keepalive with `TestClock`, shutdown, invalid frames/opcodes, and database-not-initialized error behavior.                    |
| `src/core/realtime/realtime-schemas.ts` | Indirect only                                         | Malformed frame tests go through `parseFrame`/service handling; no standalone schema decoder tests.                                                                                                  |
| `src/core/realtime/realtime-types.ts`   | Type-only / direct type use in tests                  | Test fakes implement `RealtimeSocket`; no runtime behavior.                                                                                                                                          |
| `src/core/realtime/realtime-utils.ts`   | Indirect only                                         | Frame parsing and socket identity behavior are exercised through realtime service tests; no focused unit tests for `parseFrame` or `socketKey`.                                                      |

## Source files without targeted tests

Files with no direct, focused test import/assertion:

- `src/core/config/env-config.ts`
- `src/core/database/database.ts`
- `src/core/database/database-types.ts` (type-only)
- `src/core/effect/index.ts`
- `src/core/effect/runtime.ts`
- `src/core/http/http-schemas.ts`
- `src/core/http/index-types.ts` (type-only)
- `src/core/logger/logger-utils.ts`
- `src/core/realtime/realtime-schemas.ts`
- `src/core/realtime/realtime-utils.ts`

The most important behavioral gaps are `src/core/effect/runtime.ts` / `src/core/effect/index.ts` (zero observed usage), direct config parsing failures, database wrapper failure modes, schema helper edge cases, logger output contracts, and direct realtime utility/schema tests.

## Quality evaluation

Strengths:

- The suite includes both unit-style manager/service tests and integration tests with real Elysia HTTP/WebSocket behavior.
- Runtime lifecycle behavior is covered, including idempotent stop and active WebSocket shutdown.
- Realtime tests include negative paths for invalid opcodes, malformed frames, missing auth, invalid/stale tokens, unknown peers, and conduit eviction.
- One realtime test uses `TestClock`, which is a good Effect-aware pattern for deterministic keepalive timing.

Weaknesses / risks:

- Most tests are black-box imperative tests; Effect usage is concentrated in `tests/unit/realtime.test.ts` only.
- Error-channel assertions are sparse outside `DatabaseNotInitializedError`; many typed errors are only observed via HTTP/WebSocket side effects.
- Several source files have only indirect coverage, so regressions in low-level schema/config/logger utilities may be hidden by route-level behavior.
- `src/core/effect/runtime.ts` appears completely unexercised by the current suite.
- Timer-based tests still use `Bun.sleep` in several places; only one keepalive case is deterministic through Effect `TestClock`.
