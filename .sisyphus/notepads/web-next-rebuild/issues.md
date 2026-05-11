- Playwright browser verification was blocked because the MCP environment has no Chrome binary at `/opt/google/chrome/chrome`.
- Installing Playwright Chrome required sudo, which is unavailable in this environment.

## T17: E2E Playwright migration
- `bun --cwd apps/web-next run test:e2e` is rejected by this Bun CLI before the package script runs; `bun run --cwd apps/web-next test:e2e` is the verified equivalent and passes.

- Follow-up: the equals form `bun --cwd=apps/web-next run test:e2e` is accepted by this Bun CLI and passes; only the space-separated `bun --cwd apps/web-next ...` spelling is rejected.

## Final verification fixes
- A naive hook-deps fix in `useChampSelect` (`[championsQuery.data, store]`) passed TypeScript but caused Playwright browser errors on `/connected/champ-select` due to repeated `store.setChampions()` updates. The verified fix is selecting `setChampions` directly from Zustand and depending on that action.

## 2026-05-03 - T19 Mode Rules Engine
- Root bun run build still fails outside this task in @mimic/protocol-contract and @mimic/rift-next with TS5090 about non-relative paths without baseUrl; @mimic/web-next build exits 0.
- Root bun run lint fails before ESLint because bunx oxlint --config oxlint.config.ts apps packages reports that wrapper is IDE-only; bun run lint:eslint also includes many existing apps/web-next/src-old errors. apps/web-next lint exits 0.
## 2026-05-04
- The i18n bootstrap assumed `navigator.language` existed in all environments; unit tests importing notification code needed a browser-API guard.

## 2026-05-04 - T23 ARAM Champion Cards
- Post-implementation review initially failed because local card bench entries were vulnerable to session-sync overwrite and card selection committed before the async LCU selection succeeded; both were fixed and re-verified.

## T25 Clash Flow - 2026-05-04
- Playwright browser smoke was blocked because Chrome is not installed at /opt/google/chrome/chrome. HTTP smoke for /connected/clash returned 200 from the running Vite app instead.
- Existing working tree contained unrelated modified/untracked files before final cleanup review, including connected-layout-utils and custom-flow files; left them untouched.
