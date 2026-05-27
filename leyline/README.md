# Leyline

Leyline is the next-generation relay and registration backend for Sho'ma. Built with Elysia, Bun, and Effect-TS, it brokers encrypted connections between Loom (mobile UI) and Conduit (desktop bridge) without ever inspecting plaintext game data.

## Technology Stack

- **Runtime:** Bun
- **Framework:** Elysia (HTTP & WebSockets)
- **Logic & Error Handling:** Effect-TS
- **Database:** SQLite (via `bun:sqlite`)
- **Authentication:** JWT (via `jsonwebtoken`)
- **Logging:** Pino

## Directory Structure

- `src/index.ts` — Entry point: Elysia app setup and Effect runtime bootstrap
- `src/core/` — Core business logic and infrastructure
  - `auth/` — JWT signing and verification
  - `config/` — Environment variable handling
  - `database/` — SQLite storage and service layers
  - `http/` — HTTP route handlers and error mapping
  - `realtime/` — WebSocket relay logic and message schemas
  - `logger/` — Pino logger configuration
- `tests/` — Bun-native test suite
  - `unit/` — Isolated logic tests
  - `integration/` — End-to-end flow and WebSocket tests

## Development Commands

Run these commands from the `leyline/` directory:

- `bun run dev` — Start the development server with hot reload
- `bun run start` — Start the production server
- `bun run build` — Run TypeScript compiler
- `bun run typecheck` — Run type checking without emitting files
- `bun run test` — Run the test suite
- `pnpm run lint` — Lint the source code using Oxlint

## Documentation

- [Deployment Guide](./DEPLOY.md) — Instructions for deploying to Railway.
- [Agent Rules](./AGENTS.md) — Guidelines and context for AI agents working on this package.

For information about the overall Sho'ma project, see the [root README](../README.md).
