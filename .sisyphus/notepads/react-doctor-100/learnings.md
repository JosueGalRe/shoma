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
