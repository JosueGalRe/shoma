# F2 Re-run: Code Quality Review for web-next UI redesign

Verdict: REJECT

## Scope
Reviewed the five fixed files requested:

- `apps/web-next/src/routes/connected/champ-select/-components/ChampionsTab.tsx`
- `apps/web-next/src/routes/connected/champ-select/-components/ChampSelectTabs.tsx`
- `apps/web-next/src/routes/connected/lobby/route.tsx`
- `apps/web-next/src/routes/connected/invites/route.tsx`
- `apps/web-next/src/core/http/ddragon-client.ts`

## Evidence

### Source inspection
- No unused imports observed in the five reviewed files by import-line grep plus source usage inspection.
- `invites/route.tsx` uses `shareCopiedTimeoutRef`, clears the existing timeout before setting a new one, clears on unmount, and resets the ref to `null` in the timer callback.
- `lobby/route.tsx` includes async cancellation via a scoped `cancelled` flag and checks it before post-await state/log updates.
- `ddragon-client.ts` no longer uses unvalidated `as string`; it validates `championCandidate.id` is a non-empty string before assigning metadata `key`.

### Required grep checks
- `as any|@ts-ignore|TODO|FIXME|HACK` across `apps/web-next/src`: only generated `apps/web-next/src/routeTree.gen.ts` contains `as any` entries. No reviewed fixed file matched.
- `as string` in `apps/web-next/src/core/http/ddragon-client.ts`: no matches.
- Import grep was run for the reviewed component/route/http files and reviewed manually against usages.

### LSP diagnostics
- `ChampionsTab.tsx`: no diagnostics.
- `ChampSelectTabs.tsx`: no diagnostics.
- `lobby/route.tsx`: no diagnostics.
- `invites/route.tsx`: no diagnostics.
- `ddragon-client.ts`: no diagnostics.

### Tests and build
- `bun run test` in `apps/web-next`: 30 pass, 0 fail, 79 assertions across 9 files.
- `bun run build` in `apps/web-next`: `tsc -b && vp build` completed successfully. Build emitted the existing `/assets/map-bg.jpg` runtime-resolution warning.

### Lint/code quality
- Direct repo `bun run lint` is blocked by the current `lint:ox` script invoking an IDE-only oxlint wrapper.
- `bunx vp lint --max-warnings=0` on the five reviewed files executed source analysis and found one reviewed-file warning:
  - `apps/web-next/src/routes/connected/lobby/route.tsx:217`: `react-hooks/exhaustive-deps` reports missing dependencies `lobbyDetails.members` and `lobbyDetails.members.length` for the member profile loading effect.
- The same `vp lint` invocation also reports tsconfig compatibility errors from `apps/web-next/tsconfig.json`; those are tool/config-level findings outside the five reviewed files, but the hook dependency warning is directly in scope.

## Rejection reason
Rejecting because the rerun still has an in-scope code-quality warning in `lobby/route.tsx` (`react-hooks/exhaustive-deps`). The previously rejected items appear addressed, but this reviewed file does not pass the configured React hooks quality check.

---

# F2 Re-re-run: Code Quality Review for web-next UI redesign

Verdict: APPROVE

## Scope
Reviewed the fixed member profile loading effect in `apps/web-next/src/routes/connected/lobby/route.tsx`, focused on lines 134-219 and the prior `react-hooks/exhaustive-deps` rejection.

## Evidence

### Source inspection
- Lines 130-132 maintain `membersRef` from `lobbyDetails?.members`.
- Lines 134-219 read `const members = membersRef.current` inside the effect instead of directly reading `lobbyDetails?.members`.
- Line 219 uses dependency array `[memberSummonerIds, status]`.
- The effect keeps cancellation handling after awaited work and avoids introducing new reviewed-code anti-patterns such as disabling hook lint, suppressing TypeScript, or broadening dependencies unnecessarily.

### Hook warning check
- Source grep for `react-hooks/exhaustive-deps`, `membersRef`, direct `lobbyDetails?.members`, and `[memberSummonerIds, status]` found the expected ref/dependency usage and no hook-warning suppression comment.
- `bunx vp lint --max-warnings=0 apps/web-next/src/routes/connected/lobby/route.tsx` from the repo root analyzed 1 file and reported `Found 0 warnings and 6 errors`; the errors are the existing `apps/web-next/tsconfig.json` compatibility errors (`baseUrl` removed and non-relative `paths`) already noted in the prior rerun. The previous in-file `react-hooks/exhaustive-deps` warning is no longer present.

### LSP diagnostics
- `lsp_diagnostics apps/web-next/src/routes/connected/lobby/route.tsx`: no diagnostics found.

### Tests and build
- `bun run --filter @mimic/web-next build`: passed, exit code 0. Vite built 2092 modules; emitted the existing `/assets/map-bg.jpg` runtime-resolution warning.
- `bun run --filter @mimic/web-next test`: passed, exit code 0. `30 pass`, `0 fail`, `79 expect()` calls across 9 files.

## Approval reason
Approving because the fixed effect now uses `membersRef.current`, the dependency array is `[memberSummonerIds, status]`, LSP is clean, build and tests pass, and the targeted lint rerun reports no `react-hooks/exhaustive-deps` warning for `lobby/route.tsx`.
