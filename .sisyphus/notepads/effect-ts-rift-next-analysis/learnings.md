## 2026-05-11 — Task 4 security review

- `apps/rift-next/src/index.ts` maps most 500 errors to `Internal server error.`, but `/register` leaks the config name `Missing RIFT_JWT_SECRET.` when JWT secret is absent.
- HTTP schema decoders in `core/http/http-schemas.ts` enforce required string fields only; they do not validate empty strings, lengths, JWT shape, pubkey format, or 6-digit code semantics.
- CORS is documented in `task-4-security-review.md`: `Access-Control-Allow-Origin: *` is set for normal responses and OPTIONS preflight.
- `/conduit` WS auth fails closed during `open`, but later WS handlers use `void runRealtime(...)` without catch boundaries for defects/rejected promises.

## Task 2 test analysis

- `apps/rift-next` currently runs `bun test` cleanly: 33 pass, 0 fail, 75 assertions across 5 executed test files. Evidence captured in `.sisyphus/evidence/task-2-test-output.txt`.
- Test Effect usage is concentrated in `tests/unit/realtime.test.ts` via `Effect.runPromise`, `Effect.runPromiseExit`, `Effect.gen`, `Effect.provide(TestContext.TestContext)`, and `TestClock`; HTTP/WebSocket/runtime tests are imperative Bun tests.
- Direct untested source gaps include `src/core/effect/index.ts` and `src/core/effect/runtime.ts`; several config/schema/logger/utility files are covered only indirectly through `src/index.ts` flows.

- Task 1 map complete: 16 TS files cataloged; mutable state concentrated in database-service and realtime-service; external boundaries are Elysia/SQLite/JWT/pino/ws.
- Consolidación de hallazgos de múltiples tareas en un único reporte estructurado.
- Uso de severidades (High/Medium/Low) para priorizar hallazgos técnicos.
- Identificación de discrepancias entre la implementación de servicios y sus Layers en Effect-TS.

## 2026-05-11 — AGENTS refresh

- `apps/rift-next/AGENTS.md` now matches the real `src/core/{config,database,effect,http,logger,realtime}/` layout and removes stale `src/web.ts` / `src/sockets.ts` / `src/database.ts` references.
- Documented the current stack as Bun + Elysia + Effect-TS + SQLite (`bun:sqlite`) + `pino` + `jsonwebtoken`.

## 2026-05-11 - Task 9 rift-next verification

- apps/rift-next build captured in .sisyphus/evidence/task-9-build.txt: exit 0.
- apps/rift-next bun test captured in .sisyphus/evidence/task-9-test.txt: 33 pass, 0 fail, exit 0.
- Root bun run lint captured in .sisyphus/evidence/task-9-lint.txt: exits 1 because bunx oxlint wrapper reports IDE-extension-only usage and recommends vp lint. No code changes were made.

## 2026-05-11 — AGENTS refresh verification

- `apps/rift-next/AGENTS.md` now reflects the actual `src/core/{config,database,effect,http,logger,realtime}/` layout plus `src/index.ts` and the current `tests/{unit,integration,helpers}/` files.
- The requested stale path check passed: `grep -c 'src/web.ts\|src/sockets.ts\|src/database.ts' apps/rift-next/AGENTS.md` returned `0`.
- `lsp_diagnostics` has no markdown/patch server in this workspace, so docs verification relied on file reads plus the grep check.

## 2026-05-11

- `Schema.decodeUnknown(...)` returns a readonly tuple for `RiftFrame`; map it back to a mutable tuple with `Effect.map((frame): RiftFrame => [...frame])` instead of using a cast.
- When a parser becomes Effect-based, update the adjacent unit tests to execute it with `Effect.runSync` / `Effect.either`.
