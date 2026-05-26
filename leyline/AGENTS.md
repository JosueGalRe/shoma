# leyline KNOWLEDGE BASE

**Generated:** 2026-05-13

## OVERVIEW
Next-gen relay + registration server for Sho'ma. Runs on Bun with Elysia and Effect-TS. Legacy version lives in `legacy/rift/`.

## STRUCTURE
```
leyline/
├── src/
│   ├── index.ts              # Entry: Elysia app + Effect runtime bootstrap
│   └── core/
│       ├── config/
│       │   └── env-config.ts
│       ├── database/
│       │   ├── database.ts
│       │   ├── database-service.ts
│       │   └── database-types.ts
│       ├── http/
│       │   ├── http-schemas.ts
│       │   ├── index-types.ts
│       │   └── index-utils.ts
│       ├── logger/
│       │   └── logger-utils.ts
│       └── realtime/
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
    │   ├── runtime-central.test.ts
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
| Config/env | `src/core/config/env-config.ts` | Reads `LEYLINE_JWT_SECRET`, `LEYLINE_DB_PATH`, `PORT`, `HOSTNAME` |
| Database access | `src/core/database/` | SQLite-backed storage and service helpers |
| HTTP schemas/helpers | `src/core/http/` | Request decoding and token handling |
| Realtime bridge | `src/core/realtime/` | Conduit/mobile relay logic and message schemas |
| Logger | `src/core/logger/logger-utils.ts` | Pino-based logger wiring |
| Effect runtime | `src/core/effect/` | Shared Effect-TS runtime/layer helpers |
| Tests | `tests/` | Bun-native unit, integration, and helper test code |

## CONVENTIONS
- **Runtime:** Bun (`bun src/index.ts`, `bun --watch src/index.ts`)
- **Build:** `pnpm exec tsc -p tsconfig.json`
- **Framework:** Elysia for HTTP and WebSocket handling
- **State/runtime:** Effect-TS (`effect` 4.0.0-beta.65) for layers, services, and error handling
- **DB:** SQLite via Bun native `bun:sqlite`
- **Logging:** `pino` with `pino-pretty` for local output
- **Auth:** `jsonwebtoken` for JWT signing and verification
- **Tests:** Bun native test runner (`bun test`)

## ANTI-PATTERNS
- Do not reference the old top-level relay modules; keep the `src/core/` layout.
- Do not store plaintext in the relay; the service only routes encrypted payloads
- `LEYLINE_JWT_SECRET` is required at startup
## Backend Rules (leyline)

### 1. File Separation
- Each file must have a single, clear responsibility.
- **Types**: Extract to `*-types.ts`.
- **Utils**: Extract to `*-utils.ts`.
- **Schemas**: Extract to `*-schemas.ts` (using `effect/Schema`).
- **Services**: Extract to `*-service.ts`.
- **Tests**: Use `tests/unit/` or `tests/integration/`. Co-located tests must use `.test.ts` suffix.

### 2. Strict Typing & Validation
- **No `any`**: Use `unknown` with proper narrowing or `effect/Schema` decoding.
- **No Type Assertions**: `as SomeType` is forbidden. Use `Schema.decode` or type guards.
- **Validation**: Use `effect/Schema` for all boundary validation (HTTP, WebSocket, Env). Do not use TypeBox or Valibot.
- **Private Fields**: Use JavaScript `#privateField` syntax instead of TypeScript `private`.
- **Booleans**: Use `Boolean(value)` instead of `!!value`.

### 3. Functions & Control Flow
- **Declarations**: Prefer `function` declarations for top-level logic.
- **Effect Functions**: `Effect.fn('Name')((...) => ...)` is the canonical pattern for Effect-based helpers and is exempt from the function declaration rule.
- **Arrow Functions**: Must use curly braces `{}` and explicit `return`. Implicit returns are only allowed for very short, single-line Effect pipes.
- **Conditionals**:
  - Curly braces `{}` are required for all blocks (`if`, `else`, `for`).
  - No nested ternaries. Use `Match.value` from Effect for complex branching.
- **Returns**: No returns without curly braces in conditionals.

### 4. Elysia Patterns
- **Handler Extraction**: Do not define complex logic inline in `app.get()` or `app.post()`.
- **Reference Passing**: Extract handlers to named functions and pass them by reference.
- **Getter Closures**: When passing mutable state (like DB or Realtime services) to routes, use getter functions `() => service` to avoid stale references.

### 5. Effect-TS Idioms
- **Services**: Use `Context.Service` for abstractions.
- **Layers**: Use `Layer` for wiring dependencies.
- **Generators**: Use `Effect.gen` for complex logic. Variable shadowing is permitted within `Effect.gen` blocks.
- **Errors**: Use `Schema.TaggedErrorClass` for domain errors.
- **Naming**: Use `_tag`, `_op`, `_id` for discriminated unions (exempt from underscore-dangle rules).

### 6. Imports & Constants
- **Type Imports**: Always use `import type`. Separate them from value imports.
- **Magic Strings**: Extract opcodes, error codes, and configuration keys to constants.
- **Enums**: Avoid TypeScript `enum`. Use `const` objects with `as const` and derive unions.
- **Ordering**: Value imports first, then type imports.

### 7. Testing
- **Runner**: Use Bun native test runner (`bun test`).
- **Naming**: Test files must use the `.test.ts` suffix.
- **Mocks**: Type assertions are permitted in test files for mocking purposes.
