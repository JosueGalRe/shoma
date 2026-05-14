Split rune-editor into smaller components: RuneTreeSelector, PrimaryRuneGrid, SecondaryRuneGrid, StatShardGrid, RunePageControls. Fixed react-hooks-js/immutability warning by passing handler down.
Grouped boolean-heavy lobby props into `gameMode`, `session`, `permissions`, and `sheets` objects to clear react-doctor `no-many-boolean-props` warnings without changing render behavior.
Removed an unused `selectedFriendId` prop from `ChatPanel` to keep the social panel API aligned with actual usage and avoid dead prop drift.
# 2026-05-08 — Gameflow navigation hook

- `use-gameflow-navigation.ts` now imports `isGameflowPhase` from `../lib/resolve-gameflow-navigation` and no longer pulls the unused `gameflowPhases` store constant.
- The resolver module must export `isGameflowPhase` for the hook import to type-check and for `@mimic/web-next` to build cleanly.

## 2026-05-09 app key flow verification
- Added targeted Bun coverage in apps/web-next/src/core/state/tests/app-key-flows.test.tsx for connection/session, lobby/ui, champ-select picker store subscriptions, custom-game store team semantics, and settings/session persistence.
- Targeted command passes: bun test src/core/state/tests/app-key-flows.test.tsx => 6 tests, 17 assertions.
- Build command currently fails on TypeScript test typing issues in lcu-mutations.test.ts, use-lobby.sticky.test.ts, use-ready-check.test.ts, and lcu-mock.smoke.test.ts.
13: # 2026-05-09 ARAM card selection fix
14: - In `apps/web-next/src/features/champ-select/components/champion-picker.tsx`, ARAM card clicks now resolve the original `aramCards` index via `findIndex` before calling `aramSelectCard`.
15: - `lsp_diagnostics` on the changed file is clean; `bun run typecheck` still fails because of existing unrelated Bun test typing errors in `src/core/lcu/lcu-mutations.test.ts`, `src/features/lobby/hooks/tests/use-lobby.sticky.test.ts`, `src/features/ready-check/hooks/use-ready-check.test.ts`, and `src/testing/lcu-mock.smoke.test.ts`.

## Final Manual QA F3 Round 2 - 2026-05-09
- Required tests passed: persist-hydration (6), rift-store (8), aram-store (3), app-key-flows (6 from apps/web-next workspace; root invocation only failed alias resolution for @/).
- ARAM selection contract verified: selecting card index 1 returns champion 22 and moves unchosen champions 11 and blessed 33 to bench.
- Logout direct store exercise cleared deviceId, connectionCode, sessionCode, and returnUrl in state and persisted empty values to mimic:connection/mimic:session.
- Legacy migration covered by persist-hydration test for deviceID/conduitID/mimicSessionCode.

## 2026-05-09 Swiftplay selector stability fix
- `apps/web-next/src/features/swiftplay/swiftplay-store.ts` now computes `selectSwiftplayIsValid` directly from the two options, avoiding the object wrapper from `getValidationResult`.
- `selectSwiftplayErrors` now returns the module-level `EMPTY_ERRORS` array for the valid case; validation rules and `isOptionComplete()` stayed unchanged.
- `lsp_diagnostics` on the file is clean, but `bun run --filter @mimic/web-next typecheck` and `bun run --filter @mimic/web-next build` still fail on pre-existing Bun test typing issues in `src/core/lcu/lcu-mutations.test.ts`, `src/features/lobby/hooks/tests/use-lobby.sticky.test.ts`, `src/features/ready-check/hooks/use-ready-check.test.ts`, and `src/testing/lcu-mock.smoke.test.ts`.

## 2026-05-09 lobby role icon constants
- Added `apps/web-next/src/features/lobby/constants/role-icons.ts` with named `ROLE_ICONS` and `ROLE_ICONS_SELECTED` records for all 7 `LobbyRole` values.
- URLs use the shared CommunityDragon `/latest/` base path and the `icon-position-{role}(-blue).png` naming pattern.
- Verified live assets with `curl -I` returning HTTP 200 for top, top-blue, and fill variants.

- [f3 QA] In the disconnect-failure flow, the UI now shows a visible error banner: “Connection failed” / “Could not connect to Rift. Is the desktop app running?”. Screenshot evidence saved at `.sisyphus/evidence/f3-qa-fail.png` and console log capture at `.sisyphus/evidence/f3-qa-fail-console.json`.

## 2026-05-11 rift-next final evidence consolidation
- Created `.sisyphus/evidence/INDEX.md` as a factual index for the rift-next diagnosis, migration plan, AGENTS.md update, and task-1 through task-9 evidence files.
- Verified required deliverables with `ls docs/rift-next-diagnostico.md docs/rift-next-plan-migracion.md apps/rift-next/AGENTS.md` and checked migration-plan guardrails with `grep`.

## 2026-05-11 realtime-utils unit coverage
- `parseFrame` accepts raw arrays, JSON strings, and `Uint8Array` payloads; invalid decoded arrays raise `Invalid websocket frame payload.`, while non-string/non-array inputs raise `Invalid websocket frame format.`
- `socketKey` preserves the `raw` object reference when present and falls back to the socket object itself otherwise.
- Verified with `bun test tests/unit/realtime-utils.test.ts` in `apps/rift-next` (9 tests passed) and clean `lsp_diagnostics` on the new test file.

## 2026-05-11 realtime-schemas unit coverage
- Added `apps/rift-next/tests/unit/realtime-schemas.test.ts` to cover `decodeRiftFrame`, `FramePayloadError`, and `FrameFormatError`.
- Verified with `bun test tests/unit/realtime-schemas.test.ts` and `bun test` in `apps/rift-next`; both passed.

## 2026-05-11 http-schemas unit coverage
- Added `apps/rift-next/tests/unit/http-schemas.test.ts` covering every exported decoder plus all four error classes in `apps/rift-next/src/core/http/http-schemas.ts`.
- `decodeRecord`, `filterStringRecord`, and `readConduitOpenShape` are exercised with nested data and non-object fallbacks to confirm the schema helpers keep only the expected string/request values.
- Verified with `bun test tests/unit/http-schemas.test.ts` and `bun test` in `apps/rift-next`; both passed, and `lsp_diagnostics` on the new file was clean.

## 2026-05-11 database-live characterization coverage
- Added `apps/rift-next/tests/unit/database-live.test.ts` to document the current `DatabaseLive` behavior: it acquires a service but does not call `initialize`, so `generateCode` fails with `DatabaseNotInitializedError` until initialization is invoked explicitly.
- Verified with `bun test tests/unit/database-live.test.ts`; `lsp_diagnostics` on the new file was clean.
- Full `bun test` in `apps/rift-next` still reports unrelated pre-existing failures in `tests/unit/runRealtime.test.ts`.

## 2026-05-11 runRealtime characterization coverage
- `Effect.runPromise(Effect.fail(...))` rejects with an Effect `FiberFailureImpl` wrapper, not the raw error value, so the test should assert the wrapper shape and message.
- A discarded `Effect.runPromise(Effect.die(...))` can be characterized safely in a subprocess; Bun’s test runner treats the unhandled rejection as a process-level failure in the parent test process.
# 2026-05-11 — rift-next effect cleanup
- `apps/rift-next/src/core/effect/runtime.ts` was unused and safe to remove.
- The matching barrel export in `apps/rift-next/src/core/effect/index.ts` was also removed, leaving no `makeRuntime` references in the workspace.
- Verified with `lsp_diagnostics`, `bun run build`, and `bun test` in `apps/rift-next`.

## 2026-05-11 rift-next realtime layer wiring
- `apps/rift-next/src/index.ts` now obtains the app-scoped realtime service through `RealtimeLive(realtimeDeps)` with `LoggerLive` and `RealtimeStateLive` provided as layers, instead of calling `makeRealtimeService` / `makeRealtimeStateService` directly.
- In this codebase, `Layer.mergeAll(LoggerLive, RealtimeStateLive, RealtimeLive(deps))` and `Layer.provideMerge` left `LoggerService | RealtimeStateService` unresolved for extraction; nested `Effect.provide(...RealtimeLive, ...RealtimeDependenciesLayer)` type-checks and runs cleanly.
- Verified with clean `lsp_diagnostics` on `apps/rift-next/src/index.ts`, `bun test` (59 pass), and `bun run build` in `apps/rift-next`.

## 2026-05-11 legacy database bridge docs
- Added a plain file-level comment to `apps/rift-next/src/core/database/database.ts` documenting it as a legacy synchronous bridge for imperative callers.
- Kept behavior unchanged; the bridge still wraps `DatabaseService` with `Effect.runSync` and thrown exceptions.
- Verified with clean `lsp_diagnostics` on the file and passing `bun test` / `bun run build` in `apps/rift-next`.

## 2026-05-11 rift-next token error migration
- `apps/rift-next/src/index.ts` now uses `Data.TaggedError('TokenSignError')<{ cause: unknown }>` and `Data.TaggedError('InvalidTokenError')<{ cause: unknown }>`. 
- The call sites now construct the errors with `{ cause }`, preserving the existing `_tag` matching in `mapHttpError` and `isRiftHttpError`.
- `bun test tests/unit/http-smoke.test.ts` passed; `bun run build` still fails in unrelated `apps/rift-next/src/core/realtime/realtime-service.ts` type errors (`RealtimeDatabaseError` import conflict and missing database error names).

## 2026-05-11 env-config TaggedError migration
- `apps/rift-next/src/core/config/env-config.ts` now defines `MissingJwtSecretError` and `InvalidPortError` with `Data.TaggedError(...)` while keeping explicit `_tag` fields for existing `mapHttpError` narrowing.
- The payloads carry `message` so the old human-readable error strings stay intact; `InvalidPortError` still keeps `port`.
- `bun test tests/unit/http-smoke.test.ts` passed after the change; repo-level `bun run build` still fails in pre-existing `rift-next` realtime typings and `conduit-next` platform-specific Rust bindings.

## 2026-05-11 env-config unit coverage
- Added `apps/rift-next/tests/unit/env-config.test.ts` to exercise `ConfigLayer` via `Effect.runPromiseExit(Effect.provide(..., ConfigLayer))` and `ConfigService`.
- The test suite snapshots and restores Bun env keys around each case so default-value checks do not depend on the host environment.
- Verified with clean `lsp_diagnostics` on the new file and `bun test tests/unit/env-config.test.ts` in `apps/rift-next`.

## T3 LCU normalizers - 2026-05-12
- Added pure web/src/lib/lcu-normalizers.ts utilities for champion pick intent sentinels, Regalia array/object response shapes, and platform ID region normalization.
- Sona Regalia pattern is tolerant: a valid inventory entry is any object with an items array.
- Targeted test command: bun test src/lib/lcu-normalizers.test.ts passes.
- web build is currently blocked by pre-existing unused @ts-expect-error directives in unrelated test files.

## 2026-05-12 bench aria-label fallback
- `web/src/features/champ-select/components/bench.tsx` now uses `t('champSelect.unknownChampion', 'Unknown champion')` instead of `String(championId)` when a champion name cannot be resolved.
- Verified with clean `lsp_diagnostics`; there were no colocated bench tests to run.

## 2026-05-12 skin picker dropdown removal
- `web/src/features/champ-select/components/skin-picker.tsx` now renders only the title and skin card grid; the native `<select>` and option list were removed.
- The grid button selection flow stayed intact, and `bun run build` in `web/` completed successfully after the change.

## 2026-05-13 loom ui wrapper restore
- Restored `loom/src/components/ui/{button,card,input,badge,alert}.tsx` to thin re-exports from `@shoma/design-system` after the legacy `lol-*` implementations were reintroduced.
- Updated `loom/src/components/ui/icon-grid-selector.tsx` to use semantic tokens (`border-primary`, `bg-secondary`, `text-primary`, `text-muted`, `border-border`, `ring-ring`) and a CSS var glow shadow instead of `lol-*` classes.
- Verification passed: `lsp_diagnostics` clean on all changed files and `bun run --filter @shoma/loom build` exited 0.

## 2026-05-14 surface hover token wiring
- Added `--shoma-surface-hover: #0F1F3A` to `packages/design-system/src/styles/tokens.css` immediately after `--shoma-surface-elevated` so `hover:bg-surface-hover` has a backing token again.
- Added the semantic alias `--color-surface-hover: var(--shoma-surface-hover)` to `packages/design-system/src/styles/theme.css` alongside the other component-facing aliases.
- `pnpm --filter @shoma/design-system run test` passed; `pnpm --filter loom run typecheck` returned `tsc -b` with no errors in the captured output.
- `lsp_diagnostics` could not run because the configured `biome` LSP is not installed in this environment.
## 2026-05-14
- Added the missing `surface-hover` hex value to the `token-contract.test.ts` semantic token fixture to keep the test aligned with `semanticTokenNames`.
- The design-system contract test also reads `src/tokens/semantic.css`, so that stale copy needed the same `--shoma-surface-hover` value before the suite would pass.

## 2026-05-14 loom body token consumption
- Wired `loom/src/styles.css` body defaults to the design system tokens: `--font-primary`, `--color-background`, and `--color-foreground`.
- This keeps the app shell aligned with Spiegel / surface / text tokens instead of inheriting browser defaults.
- Verification: `pnpm --filter loom run typecheck` completed with no reported errors in the captured output; `lsp_diagnostics` could not run because `biome` is not installed in this environment.
