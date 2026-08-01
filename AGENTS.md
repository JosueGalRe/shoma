# PROJECT KNOWLEDGE BASE

**Generated:** 2026-05-25
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

## TOOLCHAIN

### vite-plus (`vp`)

This repo uses `vite-plus` (aliased as `vp`), a unified toolchain that wraps Vite, Oxlint, Oxfmt, and Rolldown. The `vite` package itself is overridden to a pinned `@voidzero-dev/vite-plus-core@0.2.6` in `pnpm-workspace.yaml`.

- `vp dev` — start dev server
- `vp build` — production build
- `vp check` — typecheck + lint + format check
- `vp lint` — run oxlint + eslint
- `vp fmt` — run oxfmt (or `vp fmt --check`)

These commands are used in `loom/` and `conduit/`. `leyline/` does not use `vp`; it runs `bun` directly.

### Package Manager

- **pnpm:** `pnpm@11.1.1` is required.
- **Workspace catalog:** Shared dependency versions are pinned in `pnpm-workspace.yaml` under the `catalog:` field.

## CONVENTIONS

- **Formatter:** `oxfmt` (no Prettier). Config lives in `vite.fmt.ts`.
  - No semicolons, single quotes, printWidth 128, arrowParens always, trailingComma all.
- **Linters:** Oxlint + ESLint flat config. Config lives in `vite.lint.ts`.
  - `oxlint-plugin-react-doctor` enforces React quality rules (target score >= 75).
- **React Health:** React Doctor (target score >= 75). Config in `doctor.config.json`.
- **TS baseline:** `strict`, `moduleResolution: Bundler`, `target: ES2022`, `isolatedModules`, `noEmit`
- **Legacy code:** `legacy/web/` and `legacy/rift/` are excluded from modern lint/format configs
- **Component structure:** 1 component per file. Exception: design-system compound components (shadcn-style, e.g. `card.tsx`, `alert.tsx`) keep their related sub-components in one file.
- **File suffixes:** Use `-types.ts`, `-utils.ts`, and `-styles.ts` for supporting files that accompany a primary module. Primary modules that *are* the types/utils module keep plain names (e.g. `core/types/branded.ts`, `http-decoders.ts`).
- **Styling:** Use `tailwind-variants` for class strings exceeding 80 characters.
- **Imports:** Always use `import type` for type-only imports.
- **Control flow:** Curly braces are required for all blocks (if, while, etc.).

## ANTI-PATTERNS (THIS PROJECT)

- **Type safety:** No `any` (use `unknown` or specific types). No `as SomeType` assertions (`as const` is fine).
- **Complexity:** No nested ternaries.
- `unicorn/filename-case`: kebab-case required (except `__root`, `vite-env`, `routeTree.gen`, and TanStack Router route-local files prefixed with `-`, e.g. `-route-component.tsx`, `-utils.ts`)
- React hooks rules are strict; `react-hooks/refs` and `react-hooks/incompatible-library` are intentionally off
- `react-refresh/only-export-components` is disabled in route files and `components/ui/`

## COMMANDS

```bash
# Dev
pnpm run dev:loom    # :5176
pnpm run dev:leyline # :51001
pnpm run dev:conduit # Tauri dev window

# Build all workspaces
pnpm run build

# Test all workspaces
pnpm run test

# Lint / format
pnpm run lint       # oxlint + eslint
pnpm run fmt        # oxfmt
pnpm run fmt:check

# React diagnostics
pnpm run doctor:react
pnpm run doctor:react:check

# Type check
pnpm run typecheck

# Agent knowledge base update
pnpm run agents:update  # NOTE: currently a placeholder script
```

### Per-Package Commands

**loom:**

```bash
pnpm --filter @shoma/loom dev        # vp dev
pnpm --filter @shoma/loom build      # tsc + vp build
pnpm --filter @shoma/loom typecheck  # tsc --noEmit
pnpm --filter @shoma/loom lint        # vp lint --max-warnings=0
pnpm --filter @shoma/loom test        # vitest run
pnpm --filter @shoma/loom fmt        # vp fmt --check
```

**leyline:**

```bash
pnpm --filter @shoma/leyline dev     # bun --watch src/index.ts
pnpm --filter @shoma/leyline start    # bun src/index.ts
pnpm --filter @shoma/leyline build    # tsc -p tsconfig.json
pnpm --filter @shoma/leyline test     # bun test
```

**conduit:**

```bash
pnpm --filter @shoma/conduit dev        # cargo tauri dev
pnpm --filter @shoma/conduit build      # cargo tauri build
pnpm --filter @shoma/conduit build:windows-x64
pnpm --filter @shoma/conduit build:mac-arm64
pnpm --filter @shoma/conduit typecheck  # tsc -b --noEmit
```

## TESTING

| Package   | Runner     | Config                      | Notes                                                                      |
| --------- | ---------- | --------------------------- | -------------------------------------------------------------------------- |
| `loom`    | Vitest     | `loom/vitest.config.ts`     | `jsdom` env; `-test.ts` colocated next to source for pure helpers/hooks, `tests/unit\|integration/` for cross-module (see `loom/tests/README.md`) |
| `loom`    | Playwright | `loom/playwright.config.ts` | E2E tests in `tests/e2e/` with `*.pw.ts` suffix; viewport presets for mobile/tablet/desktop                     |
| `leyline` | Bun        | native `bun test`           | Tests in `tests/unit/`, `tests/integration/`                               |
| `conduit` | Bun        | native `bun test`           | Frontend tests colocated in `src/` (`*.test.ts`); Rust tests via `cargo test` in `src-tauri/` |
| `packages/*` | Bun     | native `bun test`           | Flat `tests/` dir at package root (`*.test.ts`)                                             |

## CI / RELEASE

- **Conduit CI:** `.github/workflows/conduit.yml` builds on PR/push to `main`, releases on `conduit-v*` tags.
  - Release targets: `aarch64-apple-darwin` (macOS) and `x86_64-pc-windows-msvc` (Windows NSIS).
  - Requires Rust + system deps (`libwebkit2gtk-4.1-dev`, etc.) on Ubuntu CI.
- **Legacy Travis CI:** `.travis.yml` is for the old web app only; ignore for modern packages.

## NOTES

- Root README is stale: it references the old monorepo layout.
- `loom` uses `vite: npm:rolldown-vite@7.3.1` (non-standard Vite distribution).
- `packages/protocol-contract` exports TS source directly (`main`/`types` → `./src/index.ts`).
- `pnpm run agents:update` is currently a placeholder; manual edits to `AGENTS.md` files are the source of truth.
- `prepare` script patches `@effect/language-service` via `effect-language-service patch` (skipped in CI/Vercel).
- `leyline` tsconfig extends `tsconfig.base.json` but sets `rootDir: "../.."` and `outDir: "dist"`.

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
| `conduit-release`           | Conduit release automation and updater verification |

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
