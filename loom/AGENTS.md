# loom KNOWLEDGE BASE

**Generated:** 2026-05-13

## OVERVIEW

Next-gen mobile web UI for Sho'ma. Built with React 19, TanStack Router, and Tailwind v4. Legacy version lives in `legacy/web/`.

## STRUCTURE

```
loom/
├── src/
│   ├── main.tsx              # Entry: router + query client + runtime setup
│   ├── routes/               # TanStack Router file-based routes
│   │   ├── __root/           # Root layout
│   │   ├── index/            # Landing/connect page
│   │   └── connected/        # Authenticated game-flow pages
│   │       └── lobby/
│   │           └── -components/   # Route-scoped private components
│   ├── core/                 # Cross-cutting runtime modules
│   │   ├── relay/            # WebSocket + encryption handshake
│   │   ├── lcu/              # LCU parsers, queries, mutations
│   │   ├── state/            # Zustand stores (gameflow, session, settings)
│   │   └── http/             # API client (Data Dragon + CommunityDragon)
│   ├── features/             # Domain-driven feature folders
│   │   ├── connect/          # Connection flow
│   │   ├── lobby/            # Lobby + queue + ready-check
│   │   ├── champ-select/     # Pick/ban/runes/skins
│   │   ├── social/           # Friends list + chat
│   │   └── queue/            # Queue overlay
│   ├── components/ui/        # shadcn/ui primitives (from design-system)
│   ├── lib/                  # Shared utilities (asset-resolver, fuzzy-search, normalizers)
│   ├── i18n/                 # Translation keys + setup
│   └── testing/              # Shared test mocks and helpers
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/                  # Playwright tests (*.pw.ts)
```

## WHERE TO LOOK

| Task                | Location                | Notes                                                        |
| ------------------- | ----------------------- | ------------------------------------------------------------ |
| Route definitions   | `src/routes/**`         | File-based; `routeTree.gen.ts` is generated                  |
| Relay connection    | `src/core/relay/`       | WebSocket + crypto handshake                                 |
| LCU request helpers | `src/core/http/`        | `ky`-based API client                                        |
| LCU parsers         | `src/core/lcu/parsers/` | Gameflow, lobby, champ-select, chat, queue                   |
| UI primitives       | `src/components/ui/`    | shadcn/ui; `react-refresh` rule disabled here                |
| Shared utilities    | `src/lib/`              | Asset resolver, fuzzy search, deduped-query, LCU normalizers |
| i18n keys           | `src/i18n/`             | `i18next` + `react-i18next`                                  |
| Feature logic       | `src/features/**`       | `connect/` is the primary feature right now                  |

## CONVENTIONS

- **Router:** TanStack Router with file-based routing; private route helpers prefixed with `-`
- **Styling:** Tailwind CSS v4 with `tw-animate-css`; `sortTailwindcss` enabled in formatter
- **Imports:** `~/*` or `@/` aliases; internal packages use `@shoma/` prefix
- **Tests:** Bun native (`*.test.ts`); Playwright for E2E (`*.pw.ts`); integration tests use mocked crypto + websocket lifecycle
- **State:** Zustand with `createPersistedStore` helper; persistence scoped per store
- **Dev server:** Vite on `0.0.0.0` with LAN access; HTTPS via self-signed cert when needed

## ANTI-PATTERNS

- Do not manually edit `routeTree.gen.ts`
- Do not export non-components from `routes/**` (react-refresh rule is off, but keep exports minimal)
- Avoid `any`; Oxlint enforces `no-explicit-any`
