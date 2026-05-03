
## T7 Performance Audit - 2026-05-02

- Data Dragon champion assets should be warmed from `apps/web-next/index.html` with both `preconnect` and `dns-prefetch` for `https://ddragon.leagueoflegends.com`.
- Champ Select champion icons are already protected from eager network fan-out by `data-src` + `IntersectionObserver`, with native `loading="lazy"` and `decoding="async"` as additional safeguards.
- Current TanStack routes use `createFileRoute` and `routeTree.gen.ts` static imports; production bundling still emits separate vendor/runtime chunks, but route modules are not lazy file routes.
- This environment lacks Chrome, so Lighthouse needs a browser-enabled runner to produce JSON output.

## F1 Compliance Audit - 2026-05-02

- Final plan compliance should remain REJECT until Playwright config/screenshots exist, Lighthouse mobile score evidence is produced or explicitly waived, and Champ Select uses Data Dragon splash art (current champions grid uses `buildChampionIconUrl`).
- Required web-next verification commands passed during F1: `bun run --filter @mimic/web-next test` reported 30 pass / 0 fail, and `bun run --filter @mimic/web-next build` exited 0.

## F2 Code Quality Review - 2026-05-02

- Directory-level `lsp_diagnostics` can be capped; targeted diagnostics on required files found additional unused imports/destructured values in Champ Select, Lobby, and Data Dragon files.
- Quality review should reject even when build/tests pass if reviewed UI routes leave async timers or in-flight state updates without cleanup.

## F3 QA - 2026-05-02

- `@mimic/web-next` build and Bun tests passed for the redesign QA gate: 30/30 tests, 0 failures.
- This workspace currently has no `apps/web-next/playwright.config.ts` and no Playwright spec/e2e files under `apps/web-next`.
- Playwright browser automation cannot launch here because Chrome/Chromium is missing at `/opt/google/chrome/chrome`; screenshot QA requires installing browsers first.
- Manual review confirmed the redesign uses mobile-first responsive classes and defined animation utilities; only non-blocking TypeScript hints found were unused symbols in `ChampionsTab.tsx`.

## F4 Scope Fidelity - 2026-05-02

- Scope fidelity should remain REJECT while unrelated untracked paths exist outside `apps/web-next/src/` (`apps/conduit-next/`, `.github/`, root `mimic-*.cjs`) and `apps/web-next/tsconfig.tsbuildinfo` remains modified.
- Dependency guardrails passed for F4: `apps/web-next/package.json` had no diff, with no new `@tanstack/react-virtual`, `framer-motion`, or UI-library additions.
- Champ Select currently implements lazy icon grid, tabs, search, and Data Dragon class filters, but does not satisfy the planned splash-art grid requirement.

## F2 Cleanup Pass - 2026-05-02

- `buildChampionSplashUrl` already lives in `routes/connected/lobby/-lobby-utils.ts`, so Champ Select can switch to splash art without adding a new asset helper.
- Rectangular champion cards need matching `aspect-[16/9]` skeletons and button containers; keeping square sizing makes the splash art look cropped and awkward.
- The lobby profile loader needs both request timeout cleanup and an async cancellation flag so state updates stop when the route changes.

## F1 compliance rerun — 2026-05-03
- Rerun verdict approved after fixes: `ChampionsTab.tsx` now uses `buildChampionSplashUrl`, Playwright config exists, `bunx playwright test` passes 12/12, and 8 screenshots exist for 4 routes across Mobile/Tablet.
- Lighthouse remains blocked by missing Chrome in this environment; keep documenting it as an environment limitation unless rerun in Chrome-enabled CI/local environment.

## F4 scope rerun — 2026-05-03
- Scope rerun approved: `apps/web-next/package.json` has no diff, `apps/web-next` has no `framer-motion` or `createLazyFileRoute` matches, Champ Select now uses `buildChampionSplashUrl`, and `RunesTab.tsx` remains simple page selection only.
- Treat `.github/`, `apps/conduit-next/`, and root `mimic-*.cjs` untracked files as other-plan artifacts (`conduit-tauri-migration`, `playwright-lobby-e2e`), not blockers for the web-next redesign scope check.
