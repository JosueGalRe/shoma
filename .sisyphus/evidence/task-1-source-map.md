# Task 1 — Source Map: apps/rift-next/src

Verification: `find apps/rift-next/src -name '*.ts' | wc -l` => `16`

## File inventory
1. `apps/rift-next/src/index.ts` — Main Elysia bootstrap: wires HTTP routes, WS routes, DB init, runtime startup/shutdown, and the HTTP→Effect boundary.
2. `apps/rift-next/src/core/config/env-config.ts` — Reads/parses Bun env, exposes config service/layer, and validates `RIFT_JWT_SECRET`/`PORT`.
3. `apps/rift-next/src/core/database/database-service.ts` — Owns the SQLite-backed Effect service for initialize/close/code lookup/update operations.
4. `apps/rift-next/src/core/database/database.ts` — Imperative wrapper around the database service for legacy-style sync callers.
5. `apps/rift-next/src/core/database/database-types.ts` — SQLite row shapes used by queries and result mapping.
6. `apps/rift-next/src/core/effect/index.ts` — Re-export barrel for Effect runtime helpers.
7. `apps/rift-next/src/core/effect/runtime.ts` — Builds an Effect runtime from a layer for Elysia boundaries.
8. `apps/rift-next/src/core/http/http-schemas.ts` — Schema-based decoders and typed errors for HTTP/WebSocket request payloads.
9. `apps/rift-next/src/core/http/index-types.ts` — Shared HTTP/runtime type definitions for open data, startup options, and token payloads.
10. `apps/rift-next/src/core/http/index-utils.ts` — Extracts conduit auth/token/publicKey data from request shapes and headers/query params.
11. `apps/rift-next/src/core/logger/logger-utils.ts` — Pino-backed logger service/layer plus sync logger facade.
12. `apps/rift-next/src/core/realtime/realtime-schemas.ts` — Schema decoder for raw websocket frames.
13. `apps/rift-next/src/core/realtime/realtime-service.ts` — Core realtime broker service: mobile/conduit pairing, keepalive, routing, and connection lifecycle.
14. `apps/rift-next/src/core/realtime/realtime-types.ts` — Realtime socket, peer record, dependency, and frame types.
15. `apps/rift-next/src/core/realtime/realtime-utils.ts` — Parses websocket frames and normalizes socket identity keys.
16. `apps/rift-next/src/core/realtime/realtime.ts` — Imperative wrapper class around the Effect realtime service for legacy callers.

## Effect imports
- `index.ts`: `Cause`, `Effect`, `Exit`, `Layer`, `Option`
- `core/config/env-config.ts`: `Config as EffectConfig`, `Context`, `Effect`, `Layer`
- `core/database/database-service.ts`: `Context`, `Effect`, `Layer`
- `core/database/database.ts`: `Effect`
- `core/effect/runtime.ts`: `Effect`, `Layer`, `Runtime`
- `core/http/http-schemas.ts`: `Either`, `Schema`
- `core/logger/logger-utils.ts`: `Context`, `Effect`, `Layer`
- `core/realtime/realtime-schemas.ts`: `Either`, `Schema`
- `core/realtime/realtime-service.ts`: `Context`, `Effect`, `Fiber`, `Layer`, `Schedule`
- `core/realtime/realtime.ts`: `Effect`

## Mutable state
- `index.ts`: `let httpDatabase`, `let stopped`
- `core/database/database.ts`: `let databaseService`
- `core/database/database-service.ts`: mutable `state.database`; local `let code`
- `core/http/index-utils.ts`: local `let token`, `let publicKey`
- `core/realtime/realtime-service.ts`: `Map`/`Set` collections in `RealtimeState`, plus `keepAliveInterval` and `keepAliveFiber`

## External boundaries
- Elysia: `index.ts`
- SQLite (`bun:sqlite`): `core/database/database-service.ts`, `core/database/database.ts`
- JWT (`jsonwebtoken`): `index.ts`
- Pino / logger boundary: `core/logger/logger-utils.ts`, `index.ts`
- WebSocket boundary: `index.ts`, `core/realtime/realtime-types.ts`, `core/realtime/realtime-service.ts`, `core/realtime/realtime.ts`
