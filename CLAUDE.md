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

## CONVENTIONS

- **Package manager:** pnpm (`pnpm@11.1.1`)
- **Build tool:** Vite+ (unified toolchain: Vite + Vitest + Oxlint + Oxfmt + Rolldown)
- **Runtime:** Bun where needed (`bun test`, `bun --watch`)
- **Formatter:** `oxfmt` (no Prettier)
- **Linters:** Oxlint + ESLint flat config
- **React Health:** React Doctor (target score >= 75)
- **TS baseline:** `strict`, `moduleResolution: Bundler`, `target: ES2022`, `isolatedModules`, `noEmit`
- **Tests:** Bun native test runner (`bun test`), colocated under `tests/unit/` and `tests/integration/`; loom uses Vitest + Playwright
- **Legacy code:** `legacy/web/` and `legacy/rift/` are excluded from modern lint/format configs

## ANTI-PATTERNS (THIS PROJECT)

- `@typescript-eslint/no-explicit-any`: error (never suppress with `as any`)
- `unicorn/filename-case`: kebab-case required (except `__root`, `vite-env`, `routeTree.gen`)
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

## NOTES

- Root README is stale: it references the old monorepo layout.
- `loom` uses `vite: npm:rolldown-vite@7.3.1` (non-standard Vite distribution).
- `packages/protocol-contract` exports TS source directly (`main`/`types` → `./src/index.ts`).
- `pnpm run agents:update` is currently a placeholder; manual edits to `AGENTS.md` files are the source of truth.
- `prepare` script patches `@effect/language-service` via `effect-language-service patch` (skipped in CI/Vercel).
- `leyline` tsconfig extends `tsconfig.base.json` but sets `rootDir: "../.."` and `outDir: "dist"`.
- CI: `.github/workflows/conduit.yml` handles builds/releases on `conduit-v*` tags (macOS aarch64, Windows x64 NSIS).
- Legacy Travis CI (`.travis.yml`) is for the old web app only.

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
