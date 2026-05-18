## 2026-05-05

- `use-lobby.ts` can remove pending mutation state entirely: the four control-flow `useEffect`s were only sequencing mutation side effects.
- `createLcuMutation` in `apps/web-next/src/core/lcu/lcu-mutations.ts` is typed as `void` at the call site for these lobby helpers, so direct payload passing in `use-lobby.ts` needs a local `as never` bridge to satisfy typecheck without changing public APIs.
- Guarding each callback with the mutation's `isPending` is enough to prevent duplicate clicks while keeping the hook surface unchanged.

- Fixed lobby mutation bridge by moving invite/promote/kick/change-role payloads to mutateAsync variables; member endpoints need a typed pathFactory while invite uses bodyFactory.
- use-lobby.ts can call guarded mutation callbacks directly, eliminating the four pending-mutation effects without as-never casts or hook-time placeholder values.

- `use-champ-select.ts` can derive session, ARAM bench, and selected champion state directly from query results while keeping Zustand for local selection/loading helpers only.
- For champ-select, the safest mirror removal pattern is: compute query-derived view state in `useMemo`, override the hook return shape, and keep action callbacks pointed at the direct query-derived current action.

- `routes/connected/lobby/route.tsx` no longer needs a local dodge-penalty mirror; reading `dodgePenalty` directly from `useLobby()` keeps the route pure.
- `clash` and `custom` route syncing works better as guarded feature hooks than as route-level mirrors, because the hooks can compare current store state before seeding from lobby members.
- When importing lobby member types into feature hooks, reference `src/features/lobby/lobby-store.ts` directly so TypeScript treats the type as type-only instead of a value re-export.

- In `use-social-lcu.ts`, query-backed friends/loading/error state can be returned directly from the hook; `SocialPanel` only needs store state for selection/messages/invite errors.
- The social invite path is cleaner when `inviteToLobby` accepts a `Friend` object directly, so the panel can pass the rendered friend row without looking it up in store state.

- In `apps/web-next/src/core/rift/hooks.ts`, the `setStateRef` sync effect was removable because the React state setter is stable; direct render-time assignment keeps the ref current without another hook.
- That file still needs `useEffect` for the other Rift/LCU lifecycle effects, so removing the ref-sync effect should not drop the import entirely.

- Query mirror effects in `use-lobby.ts` can be removed by deriving `members`, `isOwner`, `rolePreferences`, `queueStatus`, `dodgePenalty`, `invites`, and `sentInvites` from query data; summoner/icon enrichment can be layered with `useMemo` instead of writing enriched members back to Zustand.

- `use-queue.ts` and `use-ready-check.ts` can consume query data directly and gate one-shot notifications with refs that reset on transport changes, avoiding mirror effects without changing the hook return shape.
- The web-next typecheck can surface unrelated pre-existing errors after a refactor; the narrow `use-champ-select.ts` phase union mismatch was fixed by explicitly narrowing to `'pick' | 'ban'`.

- In champ-select, transition-guarded callbacks can replace notification `useEffect`s: keep a ref for the last turn key / low-timer emission, then fire the callback once when derived state crosses the threshold.
- ARAM card auto-draw can follow the same guard pattern at the route boundary: track whether cards were already drawn for the current ARAM entry and call `drawCards` only on the first matching transition.

- `use-connection-flow.ts` auto-connect can be narrowed to an explicit mount initializer by capturing initial search/store values in refs, keeping later query/store updates from retriggering connection attempts.
- `useGlobalSessionReconnect` does not need a separate `reconnect()` effect when the initial persisted session code can directly enable `useRiftClient`; clear the initial reconnect latch after the restored session connects so later disconnects stay explicit.

- Lobby summoner enrichment can live in a dedicated TanStack Query keyed by sorted lobby member IDs; failed per-summoner requests should return `null` entries and be filtered so one missing summoner does not fail the whole lobby view.
- Lobby profile icons should be keyed by `profileIconId`, not `summonerId`, when deriving `iconUrl`; `useQueries` plus `profileIconQueryOptions` replaces the previous icon URL state/effect pair.
- `RuneEditor` can consume the editable current page directly and keep a same-page `draftPage` only for optimistic edits; clear the draft in create/delete/switch handlers instead of syncing query data through an effect.

- Timer effects can be centralized in `src/hooks/useCountdown.ts`; champ-select can use `remaining` directly for phase countdowns, and social LCU mock fallback can derive fallback state from `isActive` instead of keeping timeout-driven local state.
- After Fase 4, `setInterval`/`setTimeout` remain only in core Rift transport/client internals and the shared countdown hook, with no timer calls inside feature `useEffect`s.

- In the remaining SHOULD_KEEP pass, the safe pattern was to add a single `// External system sync:` comment immediately before each retained `useEffect` without touching dependencies or control flow.
- The final documented sync sites were Rift client lifecycle, LCU request/observer lifecycles, PWA install listeners, landscape orientation listeners, reconnect navigation, connection-state navigation, and the global social invite handler.
- `lsp_diagnostics` stayed clean on all edited files after the comment-only changes.

- Clash route now derives team members and eligibility directly from `useLobby()` with `useMemo`; the deleted `use-clash-team-sync.ts` hook is no longer referenced.
- Custom route derives lobby players for display and only writes a lobby player into the custom store from explicit user actions such as moving teams; bots/config remain store-backed.
- Champ-select turn and low-timer notifications use ref-guarded render-time callback checks; the duplicate notification `useEffect`s were removed.
- `use-connection-flow.ts` still needs two lifecycle effects, documented as `SHOULD_KEEP`, because they bridge mount-time auto-connect and external Rift client state into store/navigation side effects.

## Agent QA - 2026-05-05

- `apps/web-next`: `bun run typecheck` exited 0.
- `apps/web-next`: `bun run build` exited 0.
- Remaining non-import useEffect references: 13. Documented External system sync comments: 9.
- Timer scan outside useCountdown reported Rift transport/client timer usage, not React useEffect timer usage.

## Scope Fidelity Check - 2026-05-05

- Audited active `apps/web-next/src` files for the requested paths. No direct `useEffect` remains in the target files or `routes/connected/**`; query data is consumed directly and mutations are invoked from callbacks/handlers.
- Rejection finding: timer fidelity is incomplete because `use-ready-check.ts` and `use-queue.ts` still return direct LCU timer fields instead of `useCountdown`, while `useCountdown.ts` itself still has internal control-flow effects for prop-to-state reset and expiry orchestration.
- Additional scope note: matching `apps/web-next/src-old` copies still contain multiple `useEffect`/timer sites under invites, queue, and connected routes, so audits must explicitly decide whether `src-old` is excluded from the refactor scope.

## Code quality review - 2026-05-05

- cleans up its interval with , but reviewed hooks should avoid replacing with render-phase notifications or other side effects.
- LSP diagnostics can be clean while lint still catches React Hooks and unbound-method issues in this refactor.

## Code quality review correction - 2026-05-05

- useCountdown cleans up its interval with window.clearInterval, but reviewed hooks should avoid replacing useEffect with render-phase notifications or other side effects.
- LSP diagnostics can be clean while lint still catches React Hooks and unbound-method issues in this refactor.

## Final verification fixes - 2026-05-05

- Browser notifications in champ-select, queue, and ready-check are render side effects; keep them inside documented `useEffect` blocks with ref guards so they only fire on state transitions after render.
- Mutation race guards should check `isPending` before calling `mutateAsync`; ready-check accepts/declines should guard against either ready-check mutation already being pending.
- `useCountdown` keeps its reset and expiry effects because they synchronize internal countdown state with prop changes and invoke the external expiry callback.

## 2026-05-05 Scope Fidelity Check

- useEffect count under apps/web-next/src is exactly 17, excluding src-old.
- useCountdown exists and is used in champ-select and social fallback, but queue and ready-check timer intervals were removed without useCountdown replacement.
- Typecheck command `bun run typecheck` in apps/web-next completed with tsc -b exit 0.

## F4 Timer Fidelity Fix - 2026-05-05

- Queue and ready-check timers do need local browser-clock progression; LCU query snapshots seed timer values but are not sufficient for the per-second UI behavior the removed intervals provided.
- `useCountdown` now exposes `elapsed` in addition to `remaining`, allowing queue elapsed time to be derived from the latest `timeInQueue` snapshot plus local elapsed seconds while ready-check uses `remaining` for local expiry.
- Queue uses `MAX_QUEUE_TIMER_SECONDS - snapshotTimer` as the countdown seed so fresh LCU snapshots reset local elapsed progression instead of double-counting server-provided elapsed time.

## 2026-05-05 Scope Fidelity Check

- APPROVE: active src has exactly 17 useEffect call sites; queue and ready-check both use useCountdown for local timer progression; no render-time store mutations found in timer hooks; targeted LSP diagnostics, typecheck, and lint passed.

## 2026-05-05

- `vp lint --max-warnings=0` caught one last redundant spread in `champion-picker.tsx`; `filter()` already returns a new array, so a second spread was unnecessary.
- `bun run typecheck` and `bun run lint` both passed after the cleanup, so the remaining review issues were behavioral rather than static.

## 2026-05-05 Code Quality Review rerun

- Modified web TS files scanned: no console.log/warn/error hits.
- Exact useQuery lifecycle callback scan found 0 onSuccess/onError callbacks inside useQuery calls.
- notify() calls are all inside useEffect callbacks and guarded by refs in champ select, queue, and ready check hooks.
- Added useEffect lines replace/consolidate existing effects; notification effects remain external-system sync only.
- Verification passed: per-file LSP diagnostics clean, bun run lint exit 0, bun run typecheck exit 0.
