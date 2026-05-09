## 2026-05-08

- Replaced external settings links with `button` elements in `apps/conduit-next/src/App.tsx` to remove anchor-is-invalid and prevent-default warnings while keeping the existing `settings-link` styling.
- Added an inline React Doctor suppression for `async-defer-await` on the listener bootstrap because the awaited values are needed for the cleanup branch.
- Verified `apps/conduit-next/src/about/AboutWindow.ts` had no references in TS/TSX, Rust, or `tauri.conf.json`, so deleting the file is the cleanest way to remove the `knip/files` warning.

## Dead-code audit findings - 2026-05-08

- React Doctor diagnostics JSON contained 183 total rows; dead-code/Knip-style rows are emitted as `files`, `exports`, and `types` rules rather than `knip/*` names.
- `.sisyphus/evidence/dead-code-audit.md` records all 183 rows with 48 `safe-delete`, 101 `explicit-re-export-keep`, 30 `knip-ignore`, and 4 `needs-investigation` classifications.
- PWA files (`public/sw.js`, `src/pwa-sw.ts`) should be ignored because the service worker path is build/runtime injected.
- Empty core barrels (`src/core/*/index.ts`) are API consistency barrels; classify as `knip-ignore` unless a later cleanup changes import policy.
- Zustand store modules should not be deleted solely from Knip output; store state/action exports are public contracts and should be explicitly re-exported or ignored first.

- Suppressed 8 intentional `knip/files` false positives in `react-doctor.config.json`: the PWA service worker pair (`apps/web-next/public/sw.js`, `apps/web-next/src/pwa-sw.ts`), four API consistency barrels (`src/core/http|platform|query|rift/index.ts`), the state barrel (`src/core/state/index.ts`), and the social hooks barrel (`src/features/social/hooks/index.ts`).
- Kept the ignores file-level and exact-path only so real dead-code warnings stay visible.

## Dead-code cleanup follow-up - 2026-05-08

- `apps/web-next/tests/unit/ddragon-client.test.ts` imports `getLatestDdragonVersion`, `getChampions`, `getChampion`, and `getProfileIconUrl` directly from `src/core/http/ddragon-client.ts`; removing those runtime exports breaks the unit suite even if the audit labels them safe-delete.
- `bun run build` passed in `apps/web-next` after the dead-code cleanup.
- `bun run lint` is still blocked by unrelated baseline warnings in `src/core/rift/rift-client-provider.tsx` and a few existing test files.

## js-hoist-intl fix - 2026-05-08

- `apps/web-next/src/features/social/components/SocialPanel.tsx` now hoists `Intl.DateTimeFormat` to module scope as `messageTimeFormatter`, which removes the `react-doctor/js-hoist-intl` warning without changing the hour/minute formatting output.
- `lsp_diagnostics` on the edited file came back clean; the remaining lint/react-doctor output is from unrelated baseline issues elsewhere in the repo.

## js-set-map-lookups fix - 2026-05-08

- Swapped repeated `indexOf`/`includes` lookups for `Map`/`Set` in `apps/web-next/src/routes/connected/create-lobby/route.tsx` and `apps/web-next/src/routes/connected/lobby/route.tsx` so React Doctor’s lookup warning is addressed without changing queue ordering.
- `lsp_diagnostics` was clean on both edited files.
- `bun run doctor:react` no longer reports the `js-set-map-lookups` issue on these routes, but `bun run lint` still fails on pre-existing workspace tooling/baseline warnings outside this change.

## 2026-05-08 champ-select js-combine-iterations cleanup

- `champ-select/route.tsx` needs the branded `ChampionId` constructor when building a `Set`, otherwise the compiler widens the collection to `Set<number>` and the prop type check fails.
- `rune-editor.tsx` is easiest to satisfy with a prebuilt `ReactElement[]` plus a `localPage` null guard; that keeps the JSX output identical while removing the `.filter().map()` chain.

## 2026-05-08 champion-picker key cleanup

- `apps/web-next/src/features/champ-select/components/champion-picker.tsx` now uses `card.championId` as the list key because `ChampionCard` only carries `championId` and `isBlessed`, and the ARAM store dedupes champion IDs before rendering.
- `lsp_diagnostics` on the edited file stayed clean, `bun run doctor:react` no longer reports the array-key warning for this file, and the direct workspace lint check (`vp lint` on the file) passed.
- The repo-level `bun run lint` script still fails in `lint:ox` before app linting starts, so that failure is unrelated to this change.

## Lobby loader async-parallel cleanup - 2026-05-08

- `apps/web-next/src/routes/connected/lobby/route.tsx` now batches the `route-loader` and `lcu-queries` dynamic imports with `Promise.all`, which removes the sequential-await warning without changing loader behavior.
- `lsp_diagnostics` on the edited file stayed clean, and a file-scoped `bunx vp lint --max-warnings=0 src/routes/connected/lobby/route.tsx` returned 0 warnings/errors.
- Repo-wide `bun run lint` and `bun run doctor:react` still surface unrelated baseline issues elsewhere, so the route-specific verification is the meaningful signal for this fix.

## Connect screen prevent-default cleanup - 2026-05-08

- `apps/web-next/src/features/connect/components/connect-screen.tsx` no longer uses a form submit handler; the Connect button now calls a shared submit function directly, and the input handles `Enter` with `onKeyDown` so keyboard submission still works.
- `lsp_diagnostics` on the edited file stayed clean, and a file-scoped `vp lint apps/web-next/src/features/connect/components/connect-screen.tsx` returned 0 warnings/errors.
- `bun run doctor:react` no longer reports a warning for this file, but repo-wide `bun run lint` still fails because of pre-existing issues in `apps/web-next/src-old` and existing tests.

## Landscape warning external-store cleanup - 2026-05-08

- `apps/web-next/src/components/layout/LandscapeWarning.tsx` now uses `useSyncExternalStore` for the browser orientation/width snapshot instead of effect-driven local state, which removes the `react-doctor/rerender-state-only-in-handlers` warning for this component.
- CDP verification on `/connected` showed portrait mobile `390x844` hides the warning, landscape mobile `667x375` shows it, and desktop landscape `1024x768` hides it.
- `bun run lint` remains blocked by unrelated repo baseline/tooling issues (`lint:ox` invokes the Vite Plus oxlint wrapper; direct `vp lint` also reports existing `src-old`, tsconfig, Fast Refresh, and test warnings), while file-scoped `vp lint` for `LandscapeWarning.tsx` passes.

## Conduit App reducer/ref cleanup - 2026-05-08

- `apps/conduit-next/src/App.tsx` now keeps the non-rendered connection URL in `connectionStateRef` and drives QR regeneration from reducer-backed `state.accessCode`, which removes the QR effect dependency on connection state.
- Grouping `status`, `accessCode`, `showSettings`, `isGeneratingCode`, and `copied` in one reducer lets setup/listener callbacks dispatch one grouped update and clears the React Doctor reducer/cascading/rerender warnings for `@mimic/conduit-next`.
- `bun run doctor:react` reports no issues and 100/100 for `@mimic/conduit-next`; `bun run test` in `apps/conduit-next` passes. `bun run build` still fails on Linux in the Rust dependency `irelia` because process-name constants are cfg-gated to Windows/macOS.

- 2026-05-08: React Doctor 0.1.2 did not honor bare `// @knip` comments for dead-code diagnostics; project-relative `ignore.overrides` with `knip/exports` and `knip/types` was required for actual suppression while keeping source comments as audit markers.
- 2026-05-08: React Doctor scans workspace packages from the package root, so web-next ignore globs need `src/...` / `public/...` forms in addition to root-level `apps/web-next/...` forms.
