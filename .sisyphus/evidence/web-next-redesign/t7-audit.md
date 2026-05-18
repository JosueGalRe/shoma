## T7 Performance Audit - 2026-05-02

### Changes

- Added Data Dragon connection hints in `apps/web-next/index.html`:
  - `<link rel="preconnect" href="https://ddragon.leagueoflegends.com" />`
  - `<link rel="dns-prefetch" href="https://ddragon.leagueoflegends.com" />`

### Font loading

- `apps/web-next/src/styles.css` imports Google Fonts with `display=swap` in the URL:
  - `Cinzel` + `Crimson Pro` use `&display=swap`.
- No extra font-display change was needed.

### Champ Select lazy image loading

- `apps/web-next/src/routes/connected/champ-select/-components/ChampionsTab.tsx` has:
  - `loading="lazy"`
  - `decoding="async"`
  - `IntersectionObserver` with `rootMargin: '50px'`
  - champion icon URLs stored in `data-src` until an image intersects
- Manual check: initial champion grid network pressure should be limited to visible grid cells plus the 50px preload margin, not all ~160 champion icons, because images render without `src` until observed.

### Route/code splitting

- `apps/web-next/src/main.tsx` creates a TanStack router with `defaultPreload: 'intent'`.
- `apps/web-next/src/routes/**` currently uses `createFileRoute`, not `createLazyFileRoute`.
- `apps/web-next/src/routeTree.gen.ts` statically imports route modules.
- Production build still splits vendor/runtime chunks via bundler output: `i18n`, `tanstack`, `vendor`, `react`, and app `index` chunks.

### Verification

- LSP diagnostics: attempted on `apps/web-next/index.html`, but the configured Biome LSP binary is not installed in this environment (`Command not found: biome`).
- Tests: `bun run --filter @mimic/web-next test` exited 0.
  - 30 pass, 0 fail, 79 expectations, 9 files.
- Build: `bun run --filter @mimic/web-next build` exited 0.
  - CSS: 72.59 kB gzip 11.86 kB.
  - JS chunks: i18n 56.12 kB, tanstack 118.64 kB, vendor 149.00 kB, app index 158.55 kB, react 189.80 kB.

### Lighthouse

- Attempted: `bunx lighthouse http://localhost:5173 --output=json --output-path=.sisyphus/evidence/web-next-redesign/t7-lighthouse.json --chrome-flags="--headless --no-sandbox"`
- Result: Lighthouse could not run because no Chrome installation is available in the environment.
- No `t7-lighthouse.json` was generated; this audit file records the attempted command and fallback manual checks.
