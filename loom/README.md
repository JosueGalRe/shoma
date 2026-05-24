# Loom

Loom is the next-generation mobile web user interface for Sho'ma. It provides a responsive, mobile-first experience for managing your League of Legends client remotely, covering everything from the lobby to the end of champ select.

## Technology Stack

- **Framework:** React 19
- **Routing:** TanStack Router (file-based)
- **Styling:** Tailwind CSS v4
- **Build Tool:** Vite (via `vite-plus`)
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Validation:** Valibot

## Directory Structure

- `src/features/` — Domain-driven feature modules (e.g., lobby, champ-select)
- `src/components/` — Shared UI components and primitives
- `src/core/` — Cross-cutting runtime logic (relay, LCU parsers, state)
- `src/routes/` — File-based route definitions
- `src/lib/` — Shared utilities and helper functions
- `src/constants/` — Static constants and configuration values

## Development Commands

Run these commands from the `loom/` directory:

- `pnpm dev` — Start the development server
- `pnpm build` — Create a production build
- `pnpm typecheck` — Run TypeScript type checking
- `pnpm lint` — Lint the source code
- `pnpm test` — Run unit and integration tests
- `pnpm fmt` — Check code formatting

## Testing Conventions

- **Suffix:** Use the `-test.ts` (or `-test.tsx`) suffix for test files.
- **Colocation:** Pure libraries and utilities should have tests colocated with the source.
- **Broader Tests:** Use `tests/unit/` and `tests/integration/` for tests that span multiple modules or require complex setup.

## Documentation

- [Architecture Details](./context.md) — Deep dive into Loom's design and patterns.
- [Agent Rules](./AGENTS.md) — Guidelines and context for AI agents working on this package.

For information about the overall Sho'ma project, see the [root README](../README.md).
