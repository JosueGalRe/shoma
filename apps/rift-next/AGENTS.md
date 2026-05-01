# apps/rift-next KNOWLEDGE BASE

**Generated:** 2026-05-01

## OVERVIEW
Next-gen relay + registration server for Mimic. Replaces legacy `rift/` with Elysia and Bun.

## STRUCTURE
```
apps/rift-next/
├── src/
│   ├── index.ts              # Entry: boots Elysia, DB, starts listener
│   ├── web.ts                # HTTP API: `/register`, `/check`
│   ├── sockets.ts            # WebSocket broker: `/conduit`, `/mobile`
│   ├── database.ts           # SQLite: code ↔ pubkey registry
│   └── types.ts              # Shared opcodes + message shapes
└── tests/
    ├── unit/
    ├── integration/
    └── helpers/
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| HTTP API | `src/web.ts` | JWT-issued 6-digit codes |
| WebSocket tunnel | `src/sockets.ts` | Bridges mobile ↔ conduit via peer UUID |
| Database | `src/database.ts` | SQLite; `conduit_instances(code, public_key)` |
| Protocol types | `src/types.ts` | `OPEN`, `MSG`, `CLOSE`, `CONNECT` opcodes |
| Test helpers | `tests/helpers/auth-test-helpers.ts` | Shared auth setup for tests |

## CONVENTIONS
- **Runtime:** Bun (`bun src/index.ts` or `bun --watch src/index.ts`)
- **Framework:** Elysia for HTTP + WebSocket upgrades
- **DB:** SQLite (Bun native `bun:sqlite`)
- **Tests:** Bun native; integration tests spin up temp DB + server lifecycle

## ANTI-PATTERNS
- Do not store plaintext in the relay; Rift only routes encrypted payloads
- `RIFT_JWT_SECRET` env var is required at startup
