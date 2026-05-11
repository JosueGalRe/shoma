# PROJECT KNOWLEDGE BASE

**Generated:** 2026-05-11
**Commit:** 9d17ff7
**Branch:** refactor/extract-apps-to-root

## OVERVIEW
Mimic is a remote-control platform for the League of Legends client. This monorepo contains active next-gen packages (`web`, `rift`, `conduit`) alongside legacy copies (`legacy/web`, `legacy/rift`, `legacy/conduit`) plus a shared protocol package.

## STRUCTURE
```
.
├── web/                 # Next-gen mobile web UI (React + Vite + TanStack Router)
├── rift/                # Next-gen relay server (Elysia + Bun + Effect-TS)
├── conduit/             # Next-gen desktop bridge (Tauri/Rust + React)
├── packages/
│   └── protocol-contract/  # Shared protocol types/constants
├── legacy/
│   ├── web/             # Legacy Vue 2 mobile UI
│   ├── rift/            # Legacy Node/Express relay server
│   └── conduit/         # C# .NET Framework WPF desktop bridge
└── docs/                # Migration docs and guides
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Mobile UI (current) | `web/src/` | React 19, TanStack Router, Tailwind v4 |
| Mobile UI (legacy) | `legacy/web/src/` | Vue 2 + Stylus, still functional |
| Relay server (current) | `rift/src/` | Elysia, Bun native test runner |
| Relay server (legacy) | `legacy/rift/src/` | Express + ws + SQLite |
| Desktop bridge (current) | `conduit/src-tauri/src/` | Tauri v2 + Rust |
| Desktop bridge (legacy) | `legacy/conduit/` | C# .NET Framework 4.6.1 WPF |
| Shared protocol | `packages/protocol-contract/src/` | Referenced via `@mimic/protocol-contract` |
| Build scripts | Root `package.json` | Bun workspace filters |
| React diagnostics | `docs/react-doctor.md` | React Doctor integration and score enforcement |
| End-to-end flow docs | `CODEBASE_SUMMARY.md` | 274-line architecture reference |

## CONVENTIONS
- **Package manager:** Bun (`bun@1.1.38`)
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
bun run dev:web
bun run dev:rift

# Build all workspaces
bun run build

# Test all workspaces
bun run test

# Lint / format
bun run lint
bun run fmt
bun run fmt:check

# React diagnostics
bun run doctor:react
bun run doctor:react:check
```

## NOTES
- Root README is stale: it references the old monorepo layout.
- `web` uses `vite: npm:rolldown-vite@7.3.1` (non-standard Vite distribution).
- `packages/protocol-contract` exports TS source directly (`main`/`types` → `./src/index.ts`).
- GitHub Actions exist for Conduit builds (`.github/workflows/conduit-mac.yml`, `conduit-windows.yml`).
- Legacy Travis CI (`.travis.yml`) is for the old web app only.
