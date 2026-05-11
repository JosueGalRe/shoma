# apps/web-next KNOWLEDGE BASE

**Generated:** 2026-05-01

## OVERVIEW
Next-gen mobile web UI for Mimic. Replaces legacy `web/` with React 19, TanStack Router, and Tailwind v4.

## STRUCTURE
```
apps/web-next/
├── src/
│   ├── main.tsx              # Entry: router + query client + runtime setup
│   ├── routes/               # TanStack Router file-based routes
│   │   ├── __root/           # Root layout
│   │   ├── index/            # Landing/connect page
│   │   └── connected/        # Authenticated game-flow pages
│   │       └── lobby/
│   │           └── -components/   # Route-scoped private components
│   ├── core/                 # Cross-cutting runtime modules
│   │   ├── rift/             # WebSocket + encryption handshake
│   │   └── http/             # API client
│   ├── features/             # Domain-driven feature folders
│   │   └── connect/          # Connection flow (hooks + components)
│   ├── components/ui/        # shadcn/ui primitives
│   ├── i18n/                 # Translation keys + setup
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── helpers/
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Route definitions | `src/routes/**` | File-based; `routeTree.gen.ts` is generated |
| Rift connection | `src/core/rift/` | WebSocket + crypto handshake |
| LCU request helpers | `src/core/http/` | `ky`-based API client |
| UI primitives | `src/components/ui/` | shadcn/ui; `react-refresh` rule disabled here |
| i18n keys | `src/i18n/` | `i18next` + `react-i18next` |
| Feature logic | `src/features/**` | `connect/` is the primary feature right now |

## CONVENTIONS
- **Router:** TanStack Router with file-based routing; private route helpers prefixed with `-`
- **Styling:** Tailwind CSS v4 with `tw-animate-css`; `sortTailwindcss` enabled in formatter
- **Imports:** `~/*` or `@/` aliases; internal packages use `@mimic/` prefix
- **Tests:** Bun native; `*.test.ts` naming; integration tests use mocked crypto + websocket lifecycle

## ANTI-PATTERNS
- Do not manually edit `routeTree.gen.ts`
- Do not export non-components from `routes/**` (react-refresh rule is off, but keep exports minimal)
- Avoid `any`; Oxlint enforces `no-explicit-any`
