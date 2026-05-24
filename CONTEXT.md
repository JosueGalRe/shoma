# Sho'ma Project Context

## Overview
Sho'ma is a remote-control platform for the League of Legends client. It consists of a mobile-first web UI (**Loom**), a desktop bridge (**Conduit**), and a relay server (**Leyline**).

## Architecture & Monorepo Structure
The project is a pnpm monorepo with the following structure:

- `loom/`: Next-gen mobile web UI (React 19 + TanStack Router + Tailwind v4).
- `leyline/`: Next-gen relay server (Elysia + Bun + Effect-TS).
- `conduit/`: Next-gen desktop bridge (Tauri v2 + Rust + React).
- `packages/`:
  - `protocol-contract/`: Shared protocol types and constants.
  - `design-system/`: Shared UI primitives and tokens.
- `legacy/`: Stale versions of the web UI, relay server, and desktop bridge.

## Loom (Next-gen UI)
Loom has undergone a significant structural refactor to a domain-driven architecture.

### Directory Structure
- `src/features/`: Domain-driven feature folders (e.g., `lobby`, `champ-select`, `social`).
  - Each feature folder typically contains `components/`, `hooks/`, `utils/`, and `types/`.
- `src/core/`: Cross-cutting runtime modules (e.g., `relay`, `lcu`, `state`, `http`).
- `src/routes/`: TanStack Router file-based routes.
  - Private route helpers and components are prefixed with `-`.
- `src/components/ui/`: shadcn/ui primitives (sourced from `design-system`).
- `src/lib/`: Shared utilities (asset-resolver, fuzzy-search, normalizers).

### File Conventions
- **Suffixes:** Supporting files use explicit suffixes:
  - `-types.ts`: TypeScript interfaces and types.
  - `-utils.ts`: Pure utility functions.
  - `-styles.ts`: Tailwind variant definitions (using `tailwind-variants`).
- **Naming:** All files and directories use `kebab-case` (except for specific router files like `__root.tsx`).

## Tooling & Conventions

### Package Management
- **pnpm:** The project uses `pnpm@11.1.1`.

### Build & Linting
- **Vite+ (vite-plus):** A unified toolchain for build, lint, and format.
- **Linter:** Uses a combination of `oxlint` (for speed) and `eslint` (for complex rules).
- **Formatter:** `oxfmt` (via `vite-plus fmt`).
- **React Health:** `react-doctor` is integrated to enforce code quality (target score >= 75).

### Testing
- **Vitest:** The primary test runner for `loom`.
- **Bun Test:** Used for `leyline` and `conduit` frontend tests.
- **Playwright:** Used for E2E testing in `loom` (`*.pw.ts`).

### Key Lint Rules
- `typescript/no-explicit-any`: Disallows `any` (use `unknown` or specific types).
- `typescript/consistent-type-assertions: never`: Disallows `as Type` assertions.
- `unicorn/filename-case`: Enforces `kebab-case` for all files.
- `curly: all`: Requires curly braces for all control flow blocks.
- `no-nested-ternary`: Disallows nested ternary expressions.
- `typescript/consistent-type-imports`: Enforces `import type` for type-only imports.

## Development Commands
- `pnpm run dev:loom`: Start Loom dev server.
- `pnpm run dev:leyline`: Start Leyline dev server.
- `pnpm run lint`: Run linter across all workspaces.
- `pnpm run fmt`: Format code across all workspaces.
- `pnpm run test`: Run tests across all workspaces.
- `pnpm run doctor:react`: Run React diagnostics.
