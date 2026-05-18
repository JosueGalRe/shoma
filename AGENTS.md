# PROJECT KNOWLEDGE BASE

**Generated:** 2026-05-13
**Commit:** 0b2abc87
**Branch:** main

## OVERVIEW

Sho'ma is a remote-control platform for the League of Legends client. This monorepo contains active next-gen packages (`loom`, `leyline`, `conduit`) alongside legacy copies (`legacy/web`, `legacy/rift`, `legacy/conduit`) plus shared packages (`protocol-contract`, `design-system`).

## STRUCTURE

```
.
├── loom/                # Next-gen mobile web UI (React + Vite + TanStack Router)
├── leyline/             # Next-gen relay server (Elysia + Bun + Effect-TS)
├── conduit/             # Next-gen desktop bridge (Tauri/Rust + React)
├── packages/
│   ├── protocol-contract/  # Shared protocol types/constants
│   └── design-system/      # Shared UI primitives + tokens
├── legacy/
│   ├── web/             # Legacy Vue 2 mobile UI
│   ├── rift/            # Legacy Node/Express relay server
│   └── conduit/         # C# .NET Framework WPF desktop bridge
└── docs/                # Migration docs and guides
```

## WHERE TO LOOK

| Task                     | Location                          | Notes                                          |
| ------------------------ | --------------------------------- | ---------------------------------------------- |
| Mobile UI (current)      | `loom/src/`                       | React 19, TanStack Router, Tailwind v4         |
| Mobile UI (legacy)       | `legacy/web/src/`                 | Vue 2 + Stylus, still functional               |
| Relay server (current)   | `leyline/src/`                    | Elysia, Bun native test runner                 |
| Relay server (legacy)    | `legacy/rift/src/`                | Express + ws + SQLite                          |
| Desktop bridge (current) | `conduit/src-tauri/src/`          | Tauri v2 + Rust                                |
| Desktop bridge (legacy)  | `legacy/conduit/`                 | C# .NET Framework 4.6.1 WPF                    |
| Shared protocol          | `packages/protocol-contract/src/` | Referenced via `@shoma/protocol-contract`      |
| Shared UI                | `packages/design-system/src/`     | Referenced via `@shoma/design-system`          |
| Build scripts            | Root `package.json`               | pnpm workspace filters                         |
| React diagnostics        | `docs/react-doctor.md`            | React Doctor integration and score enforcement |
| End-to-end flow docs     | `CODEBASE_SUMMARY.md`             | 274-line architecture reference                |

## CONVENTIONS

- **Package manager:** pnpm (`pnpm@11.1.1`)
- **Build tool:** Vite+ (unified toolchain: Vite + Vitest + Oxlint + Oxfmt + Rolldown)
- **Runtime:** Bun where needed (`bun test`, `bun --watch`)
- **Formatter:** `oxfmt` (no Prettier)
- **Linters:** Oxlint + ESLint flat config
- **React Health:** React Doctor (target score >= 75)
- **TS baseline:** `strict`, `moduleResolution: Bundler`, `target: ES2022`, `isolatedModules`, `noEmit`
- **Tests:** Bun native test runner (`bun test`), colocated under `tests/unit/` and `tests/integration/`
- **Legacy code:** `legacy/web/` and `legacy/rift/` are excluded from modern lint/format configs

## ANTI-PATTERNS (THIS PROJECT)

- `@typescript-eslint/no-explicit-any`: error (never suppress with `as any`)
- `unicorn/filename-case`: kebab-case required (except `__root`, `vite-env`, `routeTree.gen`)
- React hooks rules are strict; `react-hooks/refs` and `react-hooks/incompatible-library` are intentionally off
- `react-refresh/only-export-components` is disabled in route files and `components/ui/`

## COMMANDS

```bash
# Dev
pnpm run dev:loom
pnpm run dev:leyline

# Build all workspaces
pnpm run build

# Test all workspaces
pnpm run test

# Lint / format
pnpm run lint
pnpm run fmt
pnpm run fmt:check

# React diagnostics
pnpm run doctor:react
pnpm run doctor:react:check

# Type check
pnpm run typecheck

# Agent knowledge base update
pnpm run agents:update
```

.
├── loom/ # Next-gen mobile web UI (React + Vite + TanStack Router)
├── leyline/ # Next-gen relay server (Elysia + Bun + Effect-TS)
├── conduit/ # Next-gen desktop bridge (Tauri/Rust + React)
├── packages/
│ └── protocol-contract/ # Shared protocol types/constants
├── legacy/
│ ├── web/ # Legacy Vue 2 mobile UI
│ ├── rift/ # Legacy Node/Express relay server
│ └── conduit/ # C# .NET Framework WPF desktop bridge
└── docs/ # Migration docs and guides

````

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Mobile UI (current) | `loom/src/` | React 19, TanStack Router, Tailwind v4 |
| Mobile UI (legacy) | `legacy/web/src/` | Vue 2 + Stylus, still functional |
| Relay server (current) | `leyline/src/` | Elysia, Bun native test runner |
| Relay server (legacy) | `legacy/rift/src/` | Express + ws + SQLite |
| Desktop bridge (current) | `conduit/src-tauri/src/` | Tauri v2 + Rust |
| Desktop bridge (legacy) | `legacy/conduit/` | C# .NET Framework 4.6.1 WPF |
| Shared protocol | `packages/protocol-contract/src/` | Referenced via `@shoma/protocol-contract` |
| Build scripts | Root `package.json` | pnpm workspace filters (`pnpm -r run`, `pnpm --filter`) |
| React diagnostics | `docs/react-doctor.md` | React Doctor integration and score enforcement |
| End-to-end flow docs | `CODEBASE_SUMMARY.md` | 274-line architecture reference |

## CONVENTIONS
- **Package manager:** pnpm (`pnpm@10.10.0`), Bun runtime where needed (`bun@1.3.13`)
- **Formatter:** `oxfmt` (no Prettier)
- **Linters:** Oxlint + ESLint flat config
- **React Health:** React Doctor (target score >= 75)
- **TS baseline:** `strict`, `moduleResolution: Bundler`, `target: ES2022`, `isolatedModules`, `noEmit`
- **Tests:** Bun native test runner (`bun test`) where runtime features are required; pnpm for everything else. Colocated under `tests/unit/` and `tests/integration/`
- **Legacy code:** `legacy/web/` and `legacy/rift/` are excluded from modern lint/format configs

## ANTI-PATTERNS (THIS PROJECT)
- `@typescript-eslint/no-explicit-any`: error (never suppress with `as any`)
- `unicorn/filename-case`: kebab-case required (except `__root`, `vite-env`, `routeTree.gen`)
- React hooks rules are strict; `react-hooks/refs` and `react-hooks/incompatible-library` are intentionally off
- `react-refresh/only-export-components` is disabled in route files and `components/ui/`

## COMMANDS
```bash
# Dev
pnpm run dev:loom
pnpm run dev:leyline

# Build all workspaces
pnpm run build

# Test all workspaces
pnpm run test

# Lint / format
pnpm run lint
pnpm run fmt
pnpm run fmt:check

# React diagnostics
pnpm run doctor:react
pnpm run doctor:react:check

# Type check
pnpm run typecheck

# Agent knowledge base update
pnpm run agents:update
````

## NOTES

- Root README is stale: it references the old monorepo layout.
- `loom` uses `vite: npm:rolldown-vite@7.3.1` (non-standard Vite distribution).
- `packages/protocol-contract` exports TS source directly (`main`/`types` → `./src/index.ts`).
- GitHub Actions exist for Conduit builds (`.github/workflows/conduit-mac.yml`, `conduit-windows.yml`).
- Legacy Travis CI (`.travis.yml`) is for the old web app only.

## Agent Skills

The following skills are available for this project. Agents should load relevant skills via `skill(name="...")` when working in the corresponding domain.

### Frontend (`loom`)

| Skill                            | When to Use                                                |
| -------------------------------- | ---------------------------------------------------------- |
| `react-patterns`                 | React 19 code, hooks, Server Components, Suspense, Actions |
| `tanstack-query-best-practices`  | Data fetching, caching, mutations, server state            |
| `tanstack-router-best-practices` | Routing, navigation, data loading                          |
| `zustand`                        | Store code, state management, slices                       |
| `vercel-react-best-practices`    | Performance optimization, bundle size, rendering           |
| `vercel-composition-patterns`    | Component design, compound components, render props        |
| `web-design-guidelines`          | UI/UX review, accessibility audit                          |

### Backend (`leyline`)

| Skill       | When to Use                                   |
| ----------- | --------------------------------------------- |
| `effect-ts` | Effect code, services, layers, error handling |

### General

| Skill                       | When to Use                                |
| --------------------------- | ------------------------------------------ |
| `diagnose`                  | Debugging bugs or performance regressions  |
| `tdd`                       | Test-first development, red-green-refactor |
| `typescript-advanced-types` | Complex type logic, generics, mapped types |
| `playwright`                | E2E testing, browser automation            |

### Browser Automation

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:

1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes

<!-- effect-solutions:start -->

## Effect Best Practices

**IMPORTANT:** Always consult effect-solutions before writing Effect code.

1. Run `effect-solutions list` to see available guides
2. Run `effect-solutions show <topic>...` for relevant patterns (supports multiple topics)
3. Search `~/.local/share/effect-solutions/effect` for real implementations

Topics: quick-start, project-setup, tsconfig, basics, services-and-layers, data-modeling, error-handling, config, testing, cli.

Never guess at Effect patterns - check the guide first.

## Local Effect Source

The Effect v4 repository is cloned to `~/.local/share/effect-solutions/effect` for reference.
Use this to explore APIs, find usage examples, and understand implementation
details when the documentation isn't enough.

<!-- effect-solutions:end -->
