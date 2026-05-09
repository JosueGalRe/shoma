## 2026-05-08

- `apps/web-next/public/queue-pop.mp3` already matched `legacy/web/src/static/queue-pop.mp3`, so the asset was effectively already ported.
- The queue-pop feedback logic fits well as a small pure tracker behind the React hook; that makes the transition behavior easy to unit test without a DOM.
- `apps/web-next` build is currently blocked by an unrelated existing compile error in `src/features/ready-check/components/ready-check-overlay.test.tsx` (`bun:test` has no exported member `mock`).
- 2026-05-08: Test LCU mock harness lives in `apps/web-next/src/testing/lcu-mock.ts`; `createMockLcuTransport()` keeps path state as `{ status, content }`, defaults missing requests to 404/null, and reuses production `pathToObservePattern()` so wildcard observer paths behave like `LcuTransport`.
- 2026-05-08: `apps/web-next` typecheck/build are currently blocked by unrelated `src/features/ready-check/components/ready-check-overlay.test.tsx` errors (`@testing-library/react` missing and `bun:test` `mock` export mismatch), while `bun test src/testing/lcu-mock.smoke.test.ts` passes.

## Ready Check Overlay
- Extracted the ready-check UI from the route into a reusable `ReadyCheckOverlay` component.
- The overlay uses `useReadyCheck` hook to manage state and `useQuery` to get the `readyCheckSnapshot`.
- The overlay is visible when `readyCheckSnapshot?.state === 'InProgress'` or `status === 'pending'`.
- The progress bar width is calculated based on the remaining time `((12 - timer) / 12) * 100`.
- The component is tested by calling the function directly and inspecting the returned React elements, since `@testing-library/react` is not available in the project.
- 2026-05-08: `useGameflowNavigation(Route.fullPath)` can return the validated current phase while keeping its navigation side effect, which lets `routes/connected/route.tsx` pass that same phase into `useQueuePopFeedback` without duplicating the gameflow query.
- 2026-05-08: Mounting `ReadyCheckOverlay` as the final child inside the connected `AppShell` keeps header/outlet/social/invite structure intact while allowing the fixed overlay to cover every connected child route.

- 2026-05-08: Champ-select picker visibility is route-owned in apps/web-next/src/routes/connected/champ-select/route.tsx; auto-open uses currentAction.id plus a manual-close ref so a user-closed picker does not reopen until the next local pick/ban action.
- 2026-05-08: `routes/connected/ready-check/route.tsx` now uses `beforeLoad` + `redirect({ to: '/connected/lobby' })`, and opening `/connected/ready-check` in the browser lands on `/connected/lobby`.
- 2026-05-08: Browser QA evidence for mock gameflow transitions is in `.sisyphus/evidence/task-8-browser-qa/`. Fresh run had no uncaught browser errors, but the ready-check overlay remained visible after mocking `gameflowPhase` back to `Lobby` and returning to `/connected/lobby`.
- 2026-05-08: `apps/web-next/src/features/gameflow/hooks/use-gameflow-navigation.test.ts` avoids Bun/React DOM friction by mocking `react` (`useEffect` runs immediately, `useRef` persists per test) and calling the hook directly; a local `declare module 'bun:test'` shim lets `mock.module()` type-check even though this workspace’s Bun typings do not export `mock`.
- 2026-05-08: `apps/web-next/src/features/gameflow/tests/match-acceptance-flow.test.ts` uses Bun module mocks around `useGameflowNavigation` plus `createMockLcuTransport().mockGameflowPhase()` to verify Lobby -> Matchmaking -> ReadyCheck -> ChampSelect -> Lobby route decisions without a DOM or real LCU connection; targeted test passes, while full `bun test` remains blocked by unrelated existing suite failures.
- 2026-05-08: Bun test resolution here is path-sensitive: direct `@/` imports inside files under test need to be rewritten to local-relative paths, otherwise `bun test` fails before mocks can help.
- 2026-05-08: `ReadyCheckOverlay` now gates visibility on both ready-check state and `gameflowPhase === 'ReadyCheck'`, and the focused overlay test mocks the LCU query helper module so it stays isolated from the broader parser/import graph.
- 2026-05-08: `bun test` for the targeted `web-next` files now passes, and `bun run --filter @mimic/web-next build` passes; the root workspace build is still blocked by unrelated existing errors in `rift-next` and `conduit-next`.
