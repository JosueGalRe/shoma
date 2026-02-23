# Sprint 0 Runbook

## Scope

- Establish Bun workspace foundation.
- Create shared protocol-contract package.
- Bootstrap `apps/rift-next` service skeleton.

## Local commands

- Install dependencies: `bun install`
- Run rift-next in watch mode: `bun run dev:rift-next`
- Run all tests: `bun test`

## Current status

- Workspace root package created.
- Shared protocol opcodes package created.
- Rift-next Elysia scaffold created with placeholder parity endpoints.

## Next milestone (Sprint 1)

- Replace placeholder `/register` code generation with SQLite-backed implementation.
- Add contract tests for `/register` and `/check`.
