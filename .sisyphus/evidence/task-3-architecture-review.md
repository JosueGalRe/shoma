# Task 3 - Architecture Review: Effect Patterns in apps/rift-next

## Verification

- Effect source prerequisite: `~/.effect` exists.
- `lsp_diagnostics` on `apps/rift-next/src`: 0 diagnostics.
- `grep` confirmed Effect imports in 10 source files.
- `ast_grep_search` found 1 `as Effect.Effect` cast.
- This report mentions: DatabaseService, RealtimeService, LoggerService.

## Anti-patterns and Findings

1. Environment-erasing cast in RealtimeService
   Location: `apps/rift-next/src/core/realtime/realtime-service.ts:159-161`
   `serviceEffect` casts `Effect.Effect<A, E, RealtimeStateService>` to `Effect.Effect<A, E>`. This hides a required environment instead of providing it through a Layer or removing the environment from the constructed effect.

2. Realtime fire-and-forget boundary drops failures
   Location: `apps/rift-next/src/index.ts:277-279`, used at `304`, `318`, `321`, `327`, `330`, `333`, `342`, `357`
   `runRealtime` uses `Effect.runPromise(program)`, and most callers discard the promise with `void`. Unlike `runHttp`, it does not use `runPromiseExit`, `Exit.match`, or Cause mapping. Failures/defects can become unhandled promise rejections.

3. Database sync bridge converts typed failures into thrown defects
   Location: `apps/rift-next/src/core/database/database.ts:15-18`, `23-34`
   `getDatabaseService` throws `new Error('Database not loaded yet.')`, and `generateCode`, `lookup`, `potentiallyUpdate` use `Effect.runSync`. This bypasses typed errors like `DatabaseNotInitializedError` and can surface as defects when called from realtime dependencies.

4. DatabaseLive does not initialize the acquired service
   Location: `apps/rift-next/src/core/database/database-service.ts:164-170`
   `DatabaseLive` acquires `makeDatabaseService()` and releases `service.close`, but never runs `service.initialize`. Any consumer of `DatabaseLive` receives an uninitialized DatabaseService. This is confirmed by the existing test pattern at `apps/rift-next/tests/unit/realtime.test.ts:359-373`, where `generateCode` fails before initialization.

5. Scoped runtime helper is likely unsafe and unused
   Location: `apps/rift-next/src/core/effect/runtime.ts:4-6`
   `makeRuntime` uses `Effect.runSync(Effect.scoped(Layer.toRuntime(layer)))`. Because the scope is opened and closed during runtime construction, scoped resources may be finalized immediately. `grep` found only the definition and re-export, no real usage.

6. Manual tagged error classes instead of idiomatic `Data.TaggedError`
   Locations include:
   - `apps/rift-next/src/core/database/database-service.ts:12-28`
   - `apps/rift-next/src/core/realtime/realtime-service.ts:9-72`
   - `apps/rift-next/src/core/http/http-schemas.ts:7-20`
   - `apps/rift-next/src/index.ts:51-60`
   Errors use manual `_tag` fields. This works but is less idiomatic than `Data.TaggedError`, gives inconsistent `Error` behavior, and weakens stack/cause consistency.

7. Duplicate frame error taxonomy
   Locations:
   - `apps/rift-next/src/core/realtime/realtime-schemas.ts:5-12`
   - `apps/rift-next/src/core/realtime/realtime-service.ts:58-65`
   `FrameFormatError` / `FramePayloadError` are defined separately in schema and service modules. `parseFrame` throws generic `Error`s in `realtime-utils.ts:23`, `34`, `37`, then `parseRealtimeFrame` remaps them by message string at `realtime-service.ts:133-142`.

8. Type assertion on decoded frame
   Location: `apps/rift-next/src/core/realtime/realtime-schemas.ts:20`
   `([...result.right] as RiftFrame)` asserts the decoded tuple into `RiftFrame`. This is less problematic than the `serviceEffect` cast, but still bypasses the type system after Schema decoding.

## Service Evaluation

### DatabaseService

Locations:
- Interface/tag: `apps/rift-next/src/core/database/database-service.ts:31-39`
- Implementation: `apps/rift-next/src/core/database/database-service.ts:63-162`
- Layer: `apps/rift-next/src/core/database/database-service.ts:164-170`

Positive:
- Public methods return typed `Effect`s.
- SQLite operations are wrapped with `Effect.try`.
- `ensureDatabase` returns `DatabaseNotInitializedError` instead of throwing inside the service.

Issues:
- `DatabaseLive` is incomplete because it does not run `initialize`.
- The legacy bridge in `core/database/database.ts` reintroduces thrown errors and `runSync`.
- The service depends on mutable closure state, which is acceptable for this small DB boundary but should stay contained.

Assessment: usable service implementation, but Layer integration is underdeveloped and the sync bridge weakens typed error guarantees.

### RealtimeService

Locations:
- Interface/tag: `apps/rift-next/src/core/realtime/realtime-service.ts:88-114`
- Implementation: `apps/rift-next/src/core/realtime/realtime-service.ts:180-425`
- Layer: `apps/rift-next/src/core/realtime/realtime-service.ts:428-437`

Positive:
- State is centralized in `RealtimeStateService`.
- Socket cleanup and shutdown paths are explicit.
- `handleConduitOpen` has typed failure for auth/open rejection.

Issues:
- `serviceEffect` hides the `RealtimeStateService` requirement by cast.
- Many declared error classes are not used as Effect failures; handlers often log/close/return instead.
- Sync dependencies `lookup` and `potentiallyUpdate` can throw via `Effect.runSync` wrappers.
- Runtime boundary in `index.ts` does not handle failures consistently.

Assessment: behavior is understandable, but Effect is being used mostly as a sequencing wrapper rather than a fully typed service boundary.

### LoggerService

Locations:
- Interface/tag: `apps/rift-next/src/core/logger/logger-utils.ts:10-17`
- Layer: `apps/rift-next/src/core/logger/logger-utils.ts:64-69`
- Sync facade: `apps/rift-next/src/core/logger/logger-utils.ts:71-84`

Positive:
- Small service surface.
- `LoggerLive` is simple and easy to provide.
- Log level filtering is centralized.

Issues:
- The exported `logger` object calls `Effect.runSync` for each log.
- `syncLogger` in `apps/rift-next/src/core/realtime/realtime.ts:7-11` wraps calls to the sync logger inside `Effect.sync`, creating nested Effect execution.
- `index.ts:270-275` manually rebuilds a LoggerService-like object instead of reusing `LoggerLive`.

Assessment: adequate for current behavior, but there are two logging APIs: Effect service and sync facade. This adds cognitive overhead.

## Dead or Underutilized Code

1. `makeRuntime`
   `apps/rift-next/src/core/effect/runtime.ts:4-6` is only re-exported from `core/effect/index.ts`; no source consumer was found.

2. `DatabaseLive`
   Defined at `database-service.ts:164-170`, but `index.ts:29` builds `HttpLayer` manually with `Layer.effect(DatabaseService, Effect.sync(() => httpDatabase))`.

3. `RealtimeLive`, `RealtimeStateLive`, `makeRealtimeStateLayer`
   Defined at `realtime-service.ts:127-129` and `428-437`, but runtime construction in `index.ts:269-275` manually creates state and service.

4. `ConfigLayer` / `ConfigLive`
   Defined at `env-config.ts:81-83`; runtime code uses the `env` object directly.

5. Several RealtimeError variants
   `ConduitMessageError`, `MobileMessageError`, `InvalidOpcodeError`, `InvalidPeerIdError`, `UnknownPeerError`, `DuplicateMobileSessionError`, `MissingMobilePeerError`, `InvalidConnectCodeError`, and `SocketCloseError` are declared in `realtime-service.ts:15-72`, but current handler logic mostly logs/closes/returns rather than failing with them.

## Error Handling Assessment

- HTTP boundary is the strongest part: `runHttp` uses `Effect.runPromiseExit`, extracts failures from `Cause`, maps known typed errors, and returns generic 500 for unknown failures.
- Realtime boundary is weaker: `runRealtime` directly runs promises and callers usually discard them.
- Database errors are typed inside `DatabaseService`, but the compatibility wrapper in `core/database/database.ts` loses those typed guarantees.
- Defects are not consistently normalized at realtime boundaries.
- Manual tagged classes work for `_tag` matching, but `Data.TaggedError` would be more idiomatic and consistent.

## Recommended Minimal Follow-ups

1. Preserve behavior, but change `runRealtime` to use `Effect.runPromiseExit` and log failures/defects instead of discarding them.
2. Remove or mark unused Layer/runtime helpers if the app is intentionally using manual construction.
3. If keeping `DatabaseLive`, make acquisition run `initialize` before providing the service.
4. Avoid expanding RealtimeError unless handlers will actually fail with those errors.
5. Gradually migrate manual tagged errors to `Data.TaggedError` only where it does not alter observable behavior or tests.
