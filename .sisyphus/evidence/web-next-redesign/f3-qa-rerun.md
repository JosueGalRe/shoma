# F3 QA Re-run — web-next UI redesign

Date: 2026-05-02
Verdict: APPROVE

## Required verification

- Build: PASS — `bun run build` in `apps/web-next` completed `tsc -b && vp build` successfully; Vite built 2092 modules and generated PWA assets.
- Tests: PASS — `bun test` in `apps/web-next` passed 30 tests across 9 files with 0 failures and 79 assertions.
- Playwright: PASS — `bunx playwright test` in `apps/web-next` ran 12 tests and all passed in 6.4s.
- Diagnostics: PASS — `lsp_diagnostics` for `apps/web-next` reported 0 errors; only existing TypeScript hints were present.

## Playwright configuration review

- `apps/web-next/playwright.config.ts` is properly scoped to `./tests/e2e` and `**/*.pw.ts`, avoiding Bun test discovery conflicts.
- `baseURL` and `webServer.url` both target `http://localhost:5173`.
- `webServer.command` is `bun run dev` with `reuseExistingServer: true`.
- Two viewport projects are configured:
  - Mobile: 375x812
  - Tablet: 768x1024

## Screenshot artifact verification

Directory checked: `apps/web-next/test-results/screenshots/`

All 8 required screenshots exist:

- `mobile-home.png`
- `mobile-connected-lobby.png`
- `mobile-connected-champ-select.png`
- `mobile-connected-invites.png`
- `tablet-home.png`
- `tablet-connected-lobby.png`
- `tablet-connected-champ-select.png`
- `tablet-connected-invites.png`

Coverage matches all 4 routes in both configured viewports:

- `/`
- `/connected/lobby`
- `/connected/champ-select`
- `/connected/invites`

## Manual visual/code review

- `ChampionsTab.tsx` uses rectangular splash art cards, not square icons: champion items use `aspect-[16/9]`, splash URLs from `buildChampionSplashUrl`, and images use `h-full w-full object-cover`.
- Responsive classes look appropriate for the reviewed paths:
  - Connected shell uses `px-4 py-3 sm:px-6`, `flex-wrap`, max-width content, and responsive padding.
  - Lobby and invites grids use single-column mobile layout with `sm:grid-cols-2`.
  - Champ-select content uses responsive horizontal padding and a bounded viewport height.
  - Champion grid scales from `grid-cols-2` through `sm`, `md`, `lg`, and `xl` breakpoints.
- Screenshot visual review found no blocking issues: no broken assets, clipping, major overlap, or missing route states in Mobile or Tablet captures.

## Non-blocking notes

- Home Connect button and input placeholder appear somewhat low-contrast in screenshots.
- Connected mobile nav wraps `Champ Select` to a second row on narrow viewport; it remains readable and non-overlapping.
- Connected route screenshots show the expected unavailable fallback state when no desktop session is connected.

## Final verdict

APPROVE — build, tests, Playwright, screenshot generation, Playwright config, splash-card styling, and responsive review all pass the requested QA criteria.
