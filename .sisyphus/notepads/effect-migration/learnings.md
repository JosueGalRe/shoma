## W1-1 learnings

- `apps/rift-next` can use a small `src/core/effect/` barrel now; `makeRuntime` wraps `Layer.toRuntime` with `Effect.runSync(Effect.scoped(...))` for Elysia boundaries.
- `tsconfig.base.json` currently contributes `paths`, so `apps/rift-next/tsconfig.json` needs a local `paths: {}` override to keep `bunx tsc` happy without introducing `baseUrl`.
- Repo lint script `bun run lint` still fails because `lint:ox` points at an oxlint wrapper that wants `vp lint`; the supported `vp lint --max-warnings=0 apps/rift-next` path passes after fixing the existing `no-floating-promises` warning in `src/index.ts`.

## W1-2 learnings

- `apps/rift-next/src/core/config/env-config.ts` now keeps the synchronous `env` facade for existing consumers, while also exporting `ConfigService`, `ConfigLayer`, and `ConfigLive` backed by Effect Config.
- The Effect config load uses `Config.all` for `RIFT_JWT_SECRET`, `RIFT_DB_PATH`, `PORT`, and `HOSTNAME`, then applies typed startup failures for missing JWT secret and invalid port range.
- Package verification stayed green after the migration: `bun run --filter @mimic/rift-next build` and `bun test` in `apps/rift-next` both passed.

## W1-3 learnings

- The logger migration can keep `app.use(pinoLogger.into())` unchanged while moving the actual emit path behind `Effect.sync(...)`.
- `effect` in this workspace wants the `Context.Tag('rift/Log')<...>()` factory form; the tag value must be a real layer target, not a self-referential class type.
- Preserving the JSON shape is easiest by keeping the same `pinoLogger[level]({ event, ...context })` payload and only wrapping it in the Effect service.

## W1-4 Database Effect migration - 2026-05-11
- `apps/rift-next/src/core/database/database-service.ts` now owns typed Effect database operations, DatabaseService Tag, DatabaseLive, and an acquireRelease finalizer that closes the active SQLite connection with `close(false)`.
- `apps/rift-next/src/core/database/database.ts` preserves the previous synchronous API for existing callers by running the Effect service operations and mapping service `publicKey` values back to legacy `public_key` rows.
- Verification: LSP diagnostics clean for changed files; `bun test apps/rift-next/tests/integration/runtime.test.ts` passed; `bun run --filter @mimic/rift-next build` passed. Root `bun run build` still fails in unrelated `@mimic/conduit-next` Linux Rust dependency (`irelia` process constants are gated to Windows/macOS).

## W2-1 Effect Schema validation
- `index-utils.ts` remains boundary-compatible: schema decoders return typed validation errors internally, then existing public helpers still return `null`, `{ token?, publicKey? }`, or sanitized `ConduitOpenData` as before.
- `readConduitOpenData` preserves the previous lossy query/header behavior by decoding unknown records first, then keeping only string values instead of rejecting mixed records.
- `parseFrame` uses a variadic Effect Schema tuple (`Schema.Tuple([Schema.Number], Schema.Unknown)`) to match the legacy `[number, ...unknown[]]` frame guard; unsupported raw formats and invalid parsed payloads still throw the same public messages.

- W2-2 HTTP Effect migration:  now keeps Elysia as adapter, runs route programs through , maps typed HTTP/database/auth errors at the boundary, and reinitializes the HTTP DatabaseService from  so smoke tests keep isolated temp DBs.

- W2-2 HTTP Effect migration: apps/rift-next/src/index.ts now keeps Elysia as adapter, runs route programs through Effect.runPromiseExit, maps typed HTTP/database/auth errors at the boundary, and reinitializes the HTTP DatabaseService from initializeApp(databasePath) so smoke tests keep isolated temp DBs.

## W3-1 RealtimeService migration
- Migrated realtime websocket lifecycle logic into `apps/rift-next/src/core/realtime/realtime-service.ts` with `RealtimeService`, `RealtimeStateService`, typed realtime errors, and fiber-managed keepalive via `Effect.repeat` + `Schedule.fixed`.
- `RiftRealtimeManager` remains as a synchronous compatibility facade over the Effect service for existing unit tests; it must hold one concrete state instance per manager, not rebuild a `Layer.sync` state for each call.
- `Fiber.interruptFork` keeps legacy synchronous stop/shutdown paths compatible; awaiting `Fiber.interrupt` cannot be run through `Effect.runSync` because it may perform async work.
- `apps/rift-next/src/index.ts` now runs websocket callbacks through the Effect service instance while preserving existing log events and frame formats.

## W4-2 learnings

- `packages/protocol-contract/src/index.ts` now dual-exports schemas for the core protocol shapes: `LcuHttpMethodSchema`, `RiftOpcodeSchema`, `MobileOpcodeSchema`, `RiftFrameSchema`, `MobileFrameSchema`, and the concrete LCU body schemas used by web-next.
- `effect` had to be declared explicitly in `packages/protocol-contract/package.json`; once installed, both `bun run --filter @mimic/protocol-contract build` and `bun run --filter @mimic/web-next build` passed.
- `Schema.optional(...)` works cleanly for the partial LCU patch bodies, so the schemas stay additive without changing the existing type exports.

### Original RiftRealtimeManager inventory
- Mutable state: `conduitConnections` maps connection code to conduit socket; `conduitSocketToCode` maps socket identity to code; `conduitToMobileMap` maps conduit identity to attached mobile peer records; `mobileToConduitMap` maps mobile identity to its conduit peer record; `mobileSockets` tracks open mobile sockets; `conduitSockets` tracks open conduit sockets; `keepAliveInterval` tracked the legacy interval and is retained as a nullable state field while keepalive now uses a fiber.
- Methods preserved: `handleMobileOpen` tracks mobile sockets and logs `mobile_open`; `handleConduitOpen` validates token/pubkey, verifies JWT, updates public key, evicts prior conduit, tracks maps/sets, logs `conduit_open`; `handleConduitMessage` parses `REPLY`, validates peer id, ignores unknown peers, forwards `RECEIVE`; `handleConduitClose` detaches peers, closes mobiles, clears conduit maps, logs `conduit_close`; `handleMobileMessage` handles `CONNECT`/`SEND`, duplicate sessions, missing conduits, and forwarding `OPEN`/`CONNECT_PUBKEY`/`MSG`; `handleMobileClose` removes peer and sends conduit `CLOSE`; `startKeepAlive` restarts ping loop; `stopKeepAlive` stops it; `shutdown` stops keepalive, closes sockets, clears all state, and logs `realtime_shutdown_complete`.

## W4-1 TestClock realtime tests - 2026-05-11
- `RiftRealtimeManager` keeps the legacy sync API tests, while deterministic keepalive coverage should use `makeRealtimeService` directly with `TestContext.TestContext` and `TestClock.adjust`.
- `Effect.repeat(..., Schedule.fixed(5))` performs one immediate tick after `Effect.yieldNow()`, then one tick per adjusted interval; 15ms at 5ms interval produced exact ping counts of 4.
- Database uninitialized paths can be asserted with `Effect.runPromiseExit` plus `Cause.failureOption` to preserve the typed `DatabaseNotInitializedError`.

## W3-1 RealtimeService service provision - 2026-05-11
- `serviceEffect` in `apps/rift-next/src/core/realtime/realtime-service.ts` must be scoped inside `makeRealtimeService` so it can close over the concrete `RealtimeStateService` instance and use `Effect.provideService(effect, RealtimeStateService, state)` instead of erasing the requirement with a cast.
- Verification for this cleanup: LSP diagnostics clean; AST search found no `as Effect.Effect<...>` cast in `realtime-service.ts`; `bun test tests/unit/realtime.test.ts` passed 14/14; full `apps/rift-next` `bun test` passed 59/59; `bun run build` passed.

- 2026-05-11: `apps/rift-next/src/index.ts` realtime fire-and-forget effects now use `Effect.runPromiseExit` with `Exit.match`; failures are logged as `realtime_effect_failed` with `Cause.squash(cause)` to avoid unhandled promise rejections. Verified with `bun test tests/integration/websocket-integration.test.ts`, full `bun test`, and `bun run build` in `apps/rift-next`.

- 2026-05-11: Rift database bridge migration: `apps/rift-next/src/core/database/database.ts` should expose Effect-returning compatibility helpers only. Realtime handlers can yield database dependency Effects directly because `makeRealtimeService` already executes handler bodies inside Effect programs.

- 2026-05-11: `apps/rift-next/src/index.ts` now has zero `Effect.runSync` calls. `initializeApp(databasePath)` returns an initialization Effect that creates/initializes the HTTP database and assigns the realtime service created from `RealtimeLive`; callers that manually initialize `app` need to run it with `Effect.runPromise`.
- 2026-05-11: `RealtimeDependencies.verifyToken` is Effect-returning (`Effect.Effect<TokenPayload | null, never>`) so JWT verification can use `Effect.try` and `LoggerService` while preserving invalid-token behavior as `null`.
- 2026-05-11: `startRuntime()` is now the awaited Effect boundary (`async`) for rift-next startup: initialization and keepalive start complete before `app.listen`, and `stop()` awaits realtime shutdown plus database close before stopping Elysia.
