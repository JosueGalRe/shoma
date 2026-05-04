## 2026-05-04 - LCU parser foundation

- Created `apps/web-next/src/core/lcu/parsers/` with pure `unknown` input parsers for base primitives, lobby, ready-check, received invites, champ-select reroll points, and queue search state.
- Lobby and received-invite parsing intentionally keep separate string semantics: lobby preserves non-empty string behavior from `use-lobby.ts`, while received invites trim strings as `use-invites.ts` currently does.
- The parser barrel aliases lobby invitation parsing as `parseLobbyInvites` because both `lobby.ts` and `invites.ts` expose a local `parseInvites` function.
- Avoided importing feature-layer mode helpers from core parser files; `lobby.ts` keeps the existing queue/game-mode resolution behavior locally so direct Bun loading of parser files does not depend on the `@/` alias.
- `bun test apps/web-next/src/core/lcu/parsers/` currently fails because there are no `*.test`/`*.spec` files in that directory and this task explicitly forbids creating tests. Direct Bun loading with `./apps/web-next/src/core/lcu/parsers/*.ts` succeeds with `0 fail`.
- `bun run --filter @mimic/web-next build` is blocked by an existing unrelated TypeScript error at `apps/web-next/src/features/lobby/hooks/use-lobby.ts:318` (`localTransport` possibly null).

## 2026-05-04 - LCU mutation factory

- Created `apps/web-next/src/core/lcu/lcu-mutations.ts` with `createLcuMutation()` wrapping `transport.request(...)` in TanStack Query `useMutation`, throwing on missing transport and non-2xx LCU responses.
- Mutation invalidation keys follow the planned `['lcu', LcuPaths.*]` convention; lobby actions invalidate lobby/search/invitation data depending on affected state.
- Because the required factory name is `createLcuMutation()` while it calls a React hook, the file includes a targeted `react-hooks/rules-of-hooks` disable at that call site; convenience wrappers use hook-style names.
- `lsp_diagnostics` on `lcu-mutations.ts` is clean. Full `web-next` lint/build remain blocked by pre-existing unrelated issues in `lcu-observer-sync.ts`, `rift/hooks.ts`, and `use-lobby.ts:318`.

## 2026-05-04 - LCU observer React Query cache sync

- Added `apps/web-next/src/core/lcu/lcu-observer-sync.ts` as a side-effect-only hook: it observes an LCU path through `LcuTransport.observe()`, parses `result.content`, and writes non-null parsed values into React Query via `queryClient.setQueryData()`.
- The hook intentionally keeps no local React state and returns no data; it is meant to run alongside `useQuery` consumers so WebSocket snapshots keep the query cache fresh without forcing refetches.
- Cleanup follows the async observer contract: `transport.observe()` returns `Promise<Unsubscribe>`, so effect disposal resolves the promise, invokes the unsubscribe, and ignores cleanup errors.
- `lsp_diagnostics` on `apps/web-next/src/core/lcu/lcu-observer-sync.ts` reports no diagnostics. `bun run --filter @mimic/web-next build` is still blocked by the existing unrelated `apps/web-next/src/features/lobby/hooks/use-lobby.ts:318` nullability error.

## 2026-05-04 - LCU query descriptors

- Created apps/web-next/src/core/lcu/lcu-queries.ts with createLcuQueryOptions, stable [lcu, path] query keys, staleTime Infinity, and descriptor-level 404 fallbacks for matchmaking search because LcuTransport.request resolves LCU HTTP status codes in LcuResult rather than throwing on 404.
- lobbyDescriptor currently parses lobby members with empty icon/current-summoner context so future feature migration can layer enrichment separately without changing the descriptor API.
- Focused type-check used /tmp/opencode/tsconfig.lcu-queries.json to isolate the new file; full app bunx tsc --noEmit is still blocked by the existing apps/web-next/src/features/lobby/hooks/use-lobby.ts:318 nullability error.

## 2026-05-04 - Ready-check React Query pilot migration

- Migrated `apps/web-next/src/features/ready-check/hooks/use-ready-check.ts` from `useLCUObserver` to `useQuery(createLcuQueryOptions(readyCheckDescriptor, transport))` plus `useLcuObserverSync(readyCheckDescriptor, transport)`.
- Kept Zustand as the UI-state owner for ready-check status, countdown timer, and notification gating; React Query now owns only the parsed LCU ready-check snapshot.
- Ready-check accept/decline callbacks now call `useAcceptReadyCheck` and `useDeclineReadyCheck` mutations, then update the local UI store on mutation success.
- Timer synchronization now reads `readyCheckQuery.data?.timer` through the parsed descriptor result while preserving the existing countdown interval, expiration, notification, and vibration behavior.
- `lsp_diagnostics` on the migrated hook is clean. `bun run build` in `apps/web-next` remains blocked by the pre-existing unrelated `src/features/lobby/hooks/use-lobby.ts:318` nullability error.

## 2026-05-04 - Lobby React Query migration

- Migrated `apps/web-next/src/features/lobby/hooks/use-lobby.ts` off `useLCURequest`/`useLCUObserver`; lobby, queue search, received invitations, and current summoner now use `useQuery(createLcuQueryOptions(...))` plus `useLcuObserverSync(...)`.
- Lobby keeps Zustand as the UI-state owner while query functions parse the LCU snapshots; the lobby descriptor is locally extended to preserve lobby mode and member parsing, and the invites descriptor is locally extended to preserve the lobby store invite shape.
- Dynamic lobby actions (`invitePlayer`, `promotePlayer`, `kickPlayer`, `changeRole`) use the mutation hooks from `lcu-mutations.ts` by storing the pending runtime payload for the render that creates the mutation config; fixed queue actions call `useJoinQueue`/`useCancelQueue` directly.
- Member enrichment still loads per-member summoner details and DDragon icons after the parsed lobby snapshot, then writes enriched names/icons back into the lobby store.
- Verification: `lsp_diagnostics` on `use-lobby.ts` is clean, no targeted lobby tests exist under `src/features/lobby`, and `bun run build` in `apps/web-next` passes.

## 2026-05-04 - Queue React Query migration

- Migrated `apps/web-next/src/features/queue/use-queue.ts` from legacy `useLCUObserver`/`useLCURequest` data sources to `useQuery(createLcuQueryOptions(...))` plus `useLcuObserverSync()` for `queueSearchDescriptor` and `gameflowPhaseDescriptor`.
- Queue cancellation now uses `useCancelQueue(transport, queryClient)`, preserving the local Zustand reset after mutation success while centralizing LCU DELETE behavior and matchmaking-search invalidation in `lcu-mutations.ts`.
- The queue hook explicitly binds `queueSearchDescriptor` to the shared parser `QueueSearchState` type because the descriptor-level 404 fallback is `{}`; this keeps 404 matchmaking search responses as empty queue domain state without local error handling.
- Preserved existing queue-start/match-found notifications and the one-second Zustand timer interval. `lsp_diagnostics` on `apps/web-next/src/features/queue/use-queue.ts` is clean.

## 2026-05-04 - Swiftplay summoner spells React Query swap

- Migrated `apps/web-next/src/routes/connected/swiftplay/route.tsx` from `useLCURequest` to `useQuery(createLcuQueryOptions(summonerSpellsDescriptor, transport))` for summoner spells only; the rest of the route logic stayed unchanged.
- The dropdowns now read from `spellsQuery.data ?? []`, which keeps the UI behavior identical while moving spell loading onto the shared LCU query descriptor.
- `lsp_diagnostics` on the edited route is clean.

## 2026-05-04 - Invites React Query migration

- Migrated `apps/web-next/src/features/invites/use-invites.ts` from `useLCUObserver` to `useQuery(createLcuQueryOptions(invitesDescriptor, transport))` plus `useLcuObserverSync(invitesDescriptor, transport)`.
- Removed duplicate invite parsing from the feature hook; `invitesDescriptor` now supplies the parsed invite list while Zustand remains responsible for UI add/remove state and new-invite notifications.
- Added `useAcceptInvite` and `useDeclineInvite` mutations in `apps/web-next/src/core/lcu/lcu-mutations.ts`; the hook uses the same pending dynamic-ID mutation pattern as lobby actions.
- Verification: `lsp_diagnostics` on both changed files is clean, no targeted invite tests exist, and `bun run build` in `apps/web-next` passes.
