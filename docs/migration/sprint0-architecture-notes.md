# Sprint 0 Architecture Notes

## Workspace layout
- `apps/rift-next`: Bun + Elysia replacement service scaffold.
- `packages/protocol-contract`: Shared opcode/types package for cross-app compatibility.
- `docs/migration`: runbook and implementation notes.

## Design decisions
1. Keep opcode values immutable via shared package + tests.
2. Keep migration parity-first; placeholder logic explicitly marked in source.
3. Prefer minimum viable scaffolding before introducing DB/ws complexity.

## Known gaps after scaffold
- Dependencies are not installed yet (`bun install` needed).
- `apps/rift-next` still uses placeholder code generation for `/register`.
- WS parity routes are not implemented yet (planned Sprint 2).
