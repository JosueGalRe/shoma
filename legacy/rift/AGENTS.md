# rift KNOWLEDGE BASE

**Generated:** 2026-05-01

## OVERVIEW

Legacy relay + registration server for Mimic. Node.js + Express + TypeScript + ws + SQLite. Superseded by `rift`.

## STRUCTURE

```
rift/
├── src/
│   ├── index.ts              # Entry: HTTP server + WebSocket upgrade
│   ├── web.ts                # HTTP API: `/register`, `/check`
│   ├── sockets.ts            # WebSocket broker
│   ├── database.ts           # SQLite registry
│   └── types.ts              # Opcode protocol shapes
```

## WHERE TO LOOK

| Task             | Location          | Notes                                     |
| ---------------- | ----------------- | ----------------------------------------- |
| HTTP API         | `src/web.ts`      | JWT code generation + verification        |
| WebSocket tunnel | `src/sockets.ts`  | Mobile ↔ conduit bridging                 |
| Database         | `src/database.ts` | `conduit_instances(code, public_key)`     |
| Protocol         | `src/types.ts`    | `OPEN`, `MSG`, `CLOSE`, `CONNECT` opcodes |

## CONVENTIONS

- **Runtime:** Node.js (`yarn start`, `yarn watch`)
- **Framework:** Express + `ws` for WebSocket upgrades
- **DB:** SQLite via `sqlite3` package
- **TS config:** Legacy CommonJS (`module: commonjs`, `target: es2018`)
- **Excluded from modern lint/format:** `rift/` is ignored by ESLint and Oxlint configs

## ANTI-PATTERNS

- Do not add new features here; target `rift` instead
- Uses CommonJS emit; modern code uses ESM
