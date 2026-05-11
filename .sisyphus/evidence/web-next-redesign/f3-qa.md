# F3 QA — web-next UI redesign

Verdict: APPROVE

## Verification evidence

- Build: `bun run --filter @mimic/web-next build` passed with exit code 0. Vite built 2092 modules and generated the PWA assets. Non-blocking build note: `/assets/map-bg.jpg` remains runtime-resolved.
- Unit tests: `bun run --filter @mimic/web-next test` passed: 30 pass, 0 fail, 79 assertions across 9 files.
- Playwright config: `apps/web-next/playwright.config.ts` does not exist.
- Playwright tests: no `*playwright*`, `*.spec.*`, or `*.e2e.*` files were found under `apps/web-next`.
- Playwright runner attempt: `bunx playwright test` from `apps/web-next` failed with Bun ESM loader `bun:` protocol errors and `No tests found`.
- Playwright browser automation: attempted via MCP, but Chromium/Chrome is not installed at `/opt/google/chrome/chrome`; tool reported `Run "npx playwright install chrome"`. Screenshots could not be generated in this environment.
- LSP diagnostics on reviewed files: no diagnostics for `LandscapeWarning.tsx`, `connect-entry-form.tsx`, `invites/route.tsx`, `button.tsx`, or `card.tsx`; `ChampionsTab.tsx` has non-blocking TypeScript hints for unused `formatChampionLabel` import and unused `championId` prop.

## Manual visual and interaction review

- `ChampionsTab.tsx`: lazy loading is implemented with `data-src`, an `IntersectionObserver`, and `loading="lazy"`/`decoding="async"`. Images start transparent and fade in on `onLoad`. Champion grid uses mobile-first `grid-cols-4`, then `sm:grid-cols-5`, `md:grid-cols-6`, `lg:grid-cols-8`, which fits the target breakpoints. Role filters use horizontal overflow for small screens.
- `LandscapeWarning.tsx`: mobile landscape blocking logic checks `(orientation: landscape)` plus `window.innerWidth < 768`, renders a fixed full-screen overlay with high z-index, backdrop blur, centered rotate guidance, and removes listeners on unmount. This matches the portrait-only requirement.
- `connect-entry-form.tsx`: pending and error states map to defined utility animations (`animate-connection-wave`, `animate-shake`), pending disables the input and hides action buttons, and numeric OTP sanitization enforces six digits. Buttons stack on mobile and switch to row layout at `sm:`.
- `invites/route.tsx`: share sheet logic prefers `navigator.share` when `navigator.canShare?.(shareData)` succeeds, catches share failures, then falls back to clipboard copy with a two-second copied state. The layout is mobile-first with `px-5` and `sm:grid-cols-2` enhancement.
- `styles.css`: League palette, dark theme variables, animation utilities, safe-area utility, OTP styling, avatar rings, and map overlay are defined in Tailwind layers and match the requested gold/teal dark theme direction.
- `Button` and `Card`: primitives still preserve variant/size composition via `cva` and `cn`; redesign adds visual styling and active/hover transitions without removing existing props or `asChild` support.
- Existing lobby components: reviewed lobby route, invite panel, received invites card, and lobby members card. Mobile-first layout is preserved; moderation controls are visible by default on mobile and hover-revealed only at `sm:` and up, avoiding touch-device regressions.

## Responsive review

- `sm:`, `md:`, and `lg:` usage is present in the changed UI areas and follows a mobile-first pattern: base classes target narrow screens, while larger breakpoints add columns, padding, row layouts, or desktop hover behavior.
- Target widths reviewed by code path: 375px/414px remain single-column or four-column icon grids; 768px gains `sm:`/`md:` enhancements; 1024px gains `lg:` champion/lobby icon density.

## Limitations and non-blocking findings

- No screenshots were generated because the environment lacks a Playwright browser installation.
- Real browser interaction could not be completed through Playwright MCP for the same reason; review fell back to build/test/LSP plus source-level manual QA as requested.
- Non-blocking cleanup opportunity: remove the unused `formatChampionLabel` import and unused `championId` parameter in `ChampionsTab.tsx`.
