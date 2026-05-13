# Sprint 0 Runbook

## Scope

- Establish Bun workspace foundation.
- Create shared protocol-contract package.
- Bootstrap `leyline` service skeleton.

## Local commands

- Install dependencies: `bun install`
- Run leyline in watch mode: `bun run dev:leyline`
- Run all tests: `bun test`

## Current status

- Workspace root package created.
- Shared protocol opcodes package created.
- Leyline-next HTTP endpoints are SQLite-backed (`/register`, `/check`) with unit and integration coverage.
- Leyline-next websocket parity routes are implemented and covered in integration tests.
- Loom-next migrated to Rolldown (`rolldown-vite`) with `advancedChunks` and i18next selector plugin.
- Workspace quality pipeline now uses Oxlint + Oxfmt + targeted ESLint checks.

## Next milestone (Sprint 1)

- Harden Leyline-next HTTP contract behavior (missing secret, malformed token, invalid payloads).
- Add cross-app integration coverage for Loom connect flow against leyline runtime.
- Keep migration execution order: Leyline hardening first, then loom, then conduit.
