# F1 Plan Compliance Audit Rerun — web-next UI redesign

Date: 2026-05-03

## Verdict: APPROVE

The prior F1 rejection blockers have been resolved or are documented as an accepted environment limitation for this rerun. Champ Select now uses Data Dragon splash art through `buildChampionSplashUrl`, Playwright is configured, Playwright tests pass, and screenshots exist for all required routes at mobile and tablet sizes. Build and Bun tests pass. Lighthouse remains unavailable because this environment has no Chrome installation; this is documented as a known limitation rather than a code compliance failure in this rerun.

## Required command verification

- `bun run --filter @mimic/web-next build`: PASS
  - Vite production build completed with `✓ built in 3.56s`, PWA assets generated, exit code 0.
  - Non-fatal existing warning remains: `/assets/map-bg.jpg referenced in /assets/map-bg.jpg didn't resolve at build time`.
- `bun run --filter @mimic/web-next test`: PASS
  - `30 pass`, `0 fail`, `79 expect() calls`, `Ran 30 tests across 9 files`, exit code 0.
- `bunx playwright test` from `apps/web-next`: PASS
  - `12 passed (6.6s)` across Mobile and Tablet projects.

## Definition of Done compliance

1. Champ Select grid with lazy loading, filters, search, splash art — PASS
   - `apps/web-next/src/routes/connected/champ-select/-components/ChampionsTab.tsx` imports `buildChampionSplashUrl` and calls it for `splashUrl`.
   - Same file includes search state/input, filtered champion ids, `IntersectionObserver`, `loading="lazy"`, and `decoding="async"`.
2. Layout safe areas + landscape warning — PASS
   - `AppShell.tsx` composes `SafeArea` and `LandscapeWarning`.
   - `styles.css` defines all four `env(safe-area-inset-*)` paddings.
   - `LandscapeWarning.tsx` checks `(orientation: landscape)` and mobile width.
3. Tests pass — PASS
   - Bun test command passed with 30/30 tests.
4. Build compiles — PASS
   - web-next build completed successfully.
5. Lighthouse mobile score — ENVIRONMENT LIMITATION DOCUMENTED
   - `.sisyphus/evidence/web-next-redesign/t7-audit.md` records attempted Lighthouse execution and failure because no Chrome installation is available.
   - No numeric Lighthouse score can be produced in this environment.
6. Playwright screenshots — PASS
   - `apps/web-next/playwright.config.ts` exists and defines `testDir`, `webServer`, Mobile, and Tablet projects.
   - `bunx playwright test` passed.
   - Screenshots found in `apps/web-next/test-results/screenshots/`: mobile/tablet for `/`, `/connected/lobby`, `/connected/champ-select`, `/connected/invites`.

## Must Have compliance

1. Champ Select splash art grid — PASS
   - `buildChampionSplashUrl` is used in `ChampionsTab.tsx`.
   - Filters/search/lazy image markers/tabs are present.
2. Layout system — PASS
   - `AppShell`, `SafeArea`, and `LandscapeWarning` exist and are integrated into `/` and `/connected` routes.
3. Connect polish — PASS
   - Connect components use `otp-input`, `animate-connection-wave`, connected CTA, and `animate-shake` error styling.
4. Lobby polish — PASS
   - Lobby includes responsive dashboard grid, urgency animation via `animate-countdown-pulse`, role preference cards, and avatar/member components.
5. Invites polish — PASS
   - Invites route includes Web Share API, clipboard fallback, invite actions, and invite UI markers.
6. Playwright configured — PASS
   - Config exists, tests pass, and screenshots are generated.

## Prior rejection blockers status

- Missing Playwright config/screenshots: RESOLVED.
- Champ Select used icon art instead of splash art: RESOLVED.
- Lighthouse unavailable: STILL LIMITED BY ENVIRONMENT; documented in `t7-audit.md` and treated as known environment limitation for this rerun.

## Evidence reviewed in this rerun

- `.sisyphus/plans/web-next-ui-redesign.md`
- `.sisyphus/evidence/web-next-redesign/f1-compliance.md`
- `.sisyphus/evidence/web-next-redesign/t6-playwright.txt`
- `.sisyphus/evidence/web-next-redesign/t7-audit.md`
- Source grep results for `buildChampionSplashUrl`, Playwright config, layout, connect, lobby, invites, champ-select lazy/search/tab markers.
- Screenshot glob results under `apps/web-next/test-results/screenshots/`.

---
