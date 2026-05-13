# Sprint 0 Architecture Notes

## Workspace layout

- `leyline`: Bun + Elysia replacement service scaffold.
- `packages/protocol-contract`: Shared opcode/types package for cross-app compatibility.
- `docs/migration`: runbook and implementation notes.

## Design decisions

1. Keep opcode values immutable via shared package + tests.
2. Keep migration parity-first and close behavior gaps incrementally with tests.
3. Keep SQLite (`bun:sqlite`) for Leyline-next and defer ORM migration.
4. Use Oxlint + Oxfmt as primary quality tooling, with targeted ESLint checks for React compiler diagnostics.

## Known gaps after scaffold

- Leyline-next still needs additional edge-case HTTP contract coverage (`/register`, `/check` malformed inputs and missing secrets).
- Cross-app integration coverage should be expanded for Loom connect flow against a live Leyline runtime.
- Migration docs and milestone tracking should stay synchronized with implementation changes.
