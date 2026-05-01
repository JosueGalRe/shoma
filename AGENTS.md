# PROJECT KNOWLEDGE BASE

**Generated:** 2026-05-01
**Commit:** ba99e32
**Branch:** web-next-rolldown-i18n

## OVERVIEW
Mimic is a remote-control platform for the League of Legends client. This monorepo contains a legacy stack (`web/`, `rift/`, `conduit/`) alongside next-gen replacements (`apps/web-next`, `apps/rift-next`) plus a shared protocol package.

## STRUCTURE
```
.
├── apps/
│   ├── web-next/      # Next-gen mobile web UI (React + Vite + TanStack Router)
│   └── rift-next/     # Next-gen relay server (Elysia + Bun)
├── packages/
│   └── protocol-contract/  # Shared protocol types/constants
├── web/               # Legacy Vue 2 mobile UI
├── rift/              # Legacy Node/Express relay server
├── conduit/           # C# .NET Framework WPF desktop bridge
└── docs/              # Migration docs and guides
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Mobile UI (current) | `apps/web-next/src/` | React 19, TanStack Router, Tailwind v4 |
| Mobile UI (legacy) | `web/src/` | Vue 2 + Stylus, still functional |
| Relay server (current) | `apps/rift-next/src/` | Elysia, Bun native test runner |
| Relay server (legacy) | `rift/src/` | Express + ws + SQLite |
| Desktop bridge | `conduit/` | C# .NET Framework 4.6.1 WPF |
| Shared protocol | `packages/protocol-contract/src/` | Referenced via `@mimic/protocol-contract` |
| Build scripts | Root `package.json` | Bun workspace filters |
| End-to-end flow docs | `CODEBASE_SUMMARY.md` | 274-line architecture reference |

## CONVENTIONS
- **Package manager:** Bun (`bun@1.1.38`)
- **Formatter:** `oxfmt` (no Prettier)
- **Linters:** Oxlint + ESLint flat config
- **TS baseline:** `strict`, `moduleResolution: Bundler`, `target: ES2022`, `isolatedModules`, `noEmit`
- **Tests:** Bun native test runner (`bun test`), colocated under `tests/unit/` and `tests/integration/`
- **Legacy code:** `web/` and `rift/` are excluded from modern lint/format configs

## ANTI-PATTERNS (THIS PROJECT)
- `@typescript-eslint/no-explicit-any`: error (never suppress with `as any`)
- `unicorn/filename-case`: kebab-case required (except `__root`, `vite-env`, `routeTree.gen`)
- React hooks rules are strict; `react-hooks/refs` and `react-hooks/incompatible-library` are intentionally off
- `react-refresh/only-export-components` is disabled in route files and `components/ui/`

## COMMANDS
```bash
# Dev
bun run dev:web-next
bun run dev:rift-next

# Build all workspaces
bun run build

# Test all workspaces
bun run test

# Lint / format
bun run lint
bun run fmt
bun run fmt:check
```

## NOTES
- Root README is stale: it references `conduit/` which may not exist in current tree.
- `apps/web-next` uses `vite: npm:rolldown-vite@7.3.1` (non-standard Vite distribution).
- `packages/protocol-contract` exports TS source directly (`main`/`types` → `./src/index.ts`).
- No `.github/workflows`; CI is legacy Travis (`.travis.yml`).
