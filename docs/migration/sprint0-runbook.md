# Sprint 0 Runbook

## Scope

- Establish Bun workspace foundation.
- Create shared protocol-contract package.
- Bootstrap `rift` service skeleton.

## Local commands

- Install dependencies: `bun install`
- Run rift in watch mode: `bun run dev:rift`
- Run all tests: `bun test`

## Current status

- Workspace root package created.
- Shared protocol opcodes package created.
- Rift-next HTTP endpoints are SQLite-backed (`/register`, `/check`) with unit and integration coverage.
- Rift-next websocket parity routes are implemented and covered in integration tests.
- Web-next migrated to Rolldown (`rolldown-vite`) with `advancedChunks` and i18next selector plugin.
- Workspace quality pipeline now uses Oxlint + Oxfmt + targeted ESLint checks.

## Next milestone (Sprint 1)

- Harden Rift-next HTTP contract behavior (missing secret, malformed token, invalid payloads).
- Add cross-app integration coverage for web connect flow against rift runtime.
- Keep migration execution order: Rift hardening first, then web, then conduit.
