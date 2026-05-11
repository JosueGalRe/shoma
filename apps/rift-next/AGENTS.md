# apps/rift-next KNOWLEDGE BASE

**Generated:** 2026-05-11

## OVERVIEW
Next-gen relay + registration server for Mimic. It replaces the legacy `rift/` service and runs on Bun with Elysia and Effect-TS.

## STRUCTURE
```
apps/rift-next/
├── src/
│   ├── index.ts
│   └── core/
│       ├── config/
│       │   └── env-config.ts
│       ├── database/
│       │   ├── database.ts
│       │   ├── database-service.ts
│       │   └── database-types.ts
│       ├── effect/
│       │   ├── index.ts
│       │   └── runtime.ts
│       ├── http/
│       │   ├── http-schemas.ts
│       │   ├── index-types.ts
│       │   └── index-utils.ts
│       ├── logger/
│       │   └── logger-utils.ts
│       └── realtime/
│           ├── realtime.ts
│           ├── realtime-service.ts
│           ├── realtime-schemas.ts
│           ├── realtime-types.ts
│           └── realtime-utils.ts
└── tests/
    ├── unit/
    │   ├── index.test.ts
    │   ├── http-smoke.test.ts
    │   └── realtime.test.ts
    ├── integration/
    │   ├── runtime.test.ts
    │   └── websocket-integration.test.ts
    └── helpers/
        ├── auth-test-helpers.ts
        ├── db-test-helpers.ts
        └── ws-test-helpers.ts
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| App entrypoint | `src/index.ts` | Boots Elysia, wires Effect layers, starts the server |
| Config/env | `src/core/config/env-config.ts` | Reads `RIFT_JWT_SECRET`, `RIFT_DB_PATH`, `PORT`, `HOSTNAME` |
| Database access | `src/core/database/` | SQLite-backed storage and service helpers |
| HTTP schemas/helpers | `src/core/http/` | Request decoding and token handling |
| Realtime bridge | `src/core/realtime/` | Conduit/mobile relay logic and message schemas |
| Logger | `src/core/logger/logger-utils.ts` | Pino-based logger wiring |
| Effect runtime | `src/core/effect/` | Shared Effect-TS runtime/layer helpers |
| Tests | `tests/` | Bun-native unit, integration, and helper test code |

## CONVENTIONS
- **Runtime:** Bun (`bun src/index.ts`, `bun --watch src/index.ts`)
- **Framework:** Elysia for HTTP and WebSocket handling
- **State/runtime:** Effect-TS (`effect` ^3.14.0) for layers, services, and error handling
- **DB:** SQLite via Bun native `bun:sqlite`
- **Logging:** `pino` with `pino-pretty` for local output
- **Auth:** `jsonwebtoken` for JWT signing and verification
- **Tests:** Bun native test runner

## ANTI-PATTERNS
- Do not reference the old top-level relay modules; keep the `src/core/` layout.
- Do not store plaintext in the relay; the service only routes encrypted payloads
- `RIFT_JWT_SECRET` is required at startup
