# Task 1: Cancel Queue Lobby Flash Static Analysis

## Conclusion

The lobby flash is explainable from the current static data flow. During queue cancellation, `queueStatus.isSearching` can flip from `true` to `false` through the invalidated queue query while `members` can transiently become `[]` through an LCU observer update on the lobby session query key. When those two states overlap, `hasLobby = members.length > 0 || queueStatus.isSearching` evaluates to `false`, so `LobbyCreationContent` renders until a later lobby observer update restores the member list.

`useCancelQueue` does **not** currently invalidate `lobbySessionDescriptor`. Its invalidation list is only `queueDescriptor.queryKey`, `queueSearchDescriptor.queryKey`, and `gameflowPhaseDescriptor.queryKey`.

## Files analyzed

- `apps/web-next/src/features/lobby/hooks/use-lobby.ts`
- `apps/web-next/src/core/lcu/lcu-mutations.ts`
- `apps/web-next/src/core/lcu/lcu-observer-sync.ts`
- `apps/web-next/src/routes/connected/lobby/route.tsx`
- `apps/web-next/src/features/queue/use-queue.ts`
- `apps/web-next/src/core/lcu/lcu-queries.ts`
- `apps/web-next/src/core/lcu/parsers/lobby.ts`
- `apps/web-next/src/routes/connected/lobby/-components/lobby-queue-card.tsx` for the cancel click call site

## Data dependency trace

1. The lobby route renders `LobbyQueueCard` with `onLeaveQueue={actions.leaveQueue}` in `apps/web-next/src/routes/connected/lobby/route.tsx:78-85`.
2. `LobbyQueueCard` invokes `onLeaveQueue` from the leave button when `queueStatus.isSearching` is true in `apps/web-next/src/routes/connected/lobby/-components/lobby-queue-card.tsx:79-88`.
3. `useLobby` wires `actions.leaveQueue` to `leaveQueueMutation.mutateAsync()` through `sendAction` in `apps/web-next/src/features/lobby/hooks/use-lobby.ts:149-150` and `apps/web-next/src/features/lobby/hooks/use-lobby.ts:340-342`.
4. `leaveQueueMutation` is `useCancelQueue`. `useCancelQueue` sends `DELETE` to `LcuPaths.lobby.matchmakingSearch` and invalidates only `queueDescriptor`, `queueSearchDescriptor`, and `gameflowPhaseDescriptor` in `apps/web-next/src/core/lcu/lcu-mutations.ts:117-123`.
5. The mutation helper performs the HTTP request in `mutationFn` and then runs invalidations in `onSuccess` in `apps/web-next/src/core/lcu/lcu-mutations.ts:72-95`.
6. `useLobby` reads the invalidated `queueDescriptor` through `queueQuery` in `apps/web-next/src/features/lobby/hooks/use-lobby.ts:138` and derives `queueStatus = queueContent ?? emptyLobbyQueueStatus` in `apps/web-next/src/features/lobby/hooks/use-lobby.ts:244`.
7. `queueDescriptor` parses `/lol-lobby/v2/lobby/matchmaking/search` with `parseQueueStatus` and uses `emptyLobbyQueueStatus` as `notFoundValue` in `apps/web-next/src/core/lcu/lcu-queries.ts:251-256`.
8. `parseQueueStatus` returns `emptyLobbyQueueStatus` for `404`, `null`, `undefined`, or malformed content; otherwise `isSearching` is `Boolean(searchState && searchState !== 'Invalid' && searchState !== 'Error')` in `apps/web-next/src/core/lcu/parsers/lobby.ts:260-277`. After cancel, the invalidated queue refetch can therefore produce `queueStatus.isSearching === false`.
9. In parallel, `useLobby` reads `lobbySessionDescriptor` through `lobbyQuery` and subscribes it to LCU observer updates in `apps/web-next/src/features/lobby/hooks/use-lobby.ts:137` and `apps/web-next/src/features/lobby/hooks/use-lobby.ts:142`.
10. `useLcuObserverSync` handles every observed lobby event by parsing `result.content`, computing `value = parsed ?? notFoundValue ?? null`, and directly replacing the query cache with `queryClient.setQueryData(queryKey, value)` in `apps/web-next/src/core/lcu/lcu-observer-sync.ts:28-31`.
11. `lobbySessionDescriptor` observes the same path/query key as the lobby session (`LcuPaths.lobby.lobby`, `lcuQueryKey(LcuPaths.lobby.lobby)`) and parses observer content with `parseLobbyMembers(content, {}, null)` in `apps/web-next/src/core/lcu/lcu-queries.ts:235-248`.
12. `parseLobbyMembers` accepts payloads with optional `members`; when `members` is missing it falls back to `[]`, and malformed member entries are filtered out with `flatMap` returning `[]` in `apps/web-next/src/core/lcu/parsers/lobby.ts:62-65` and `apps/web-next/src/core/lcu/parsers/lobby.ts:215-258`.
13. `useLobby` derives rendered members from `lobbyQuery.data?.members ?? []` in `apps/web-next/src/features/lobby/hooks/use-lobby.ts:165-176`, then passes the enriched list through later memoized derivations to the returned `members` value in `apps/web-next/src/features/lobby/hooks/use-lobby.ts:202-241` and `apps/web-next/src/features/lobby/hooks/use-lobby.ts:411-434`.
14. The route computes `hasLobby = members.length > 0 || queueStatus.isSearching` in `apps/web-next/src/routes/connected/lobby/route.tsx:61`.
15. If both sides are false and the lobby query is not currently loading/fetching, the route returns `LobbyCreationContent` in `apps/web-next/src/routes/connected/lobby/route.tsx:63-69`.

## Exact cancel-time state sequence

1. User clicks the cancel/leave button while searching.
2. `LobbyQueueCard` calls `actions.leaveQueue` through `onLeaveQueue`.
3. `useLobby.actions.leaveQueue` calls `sendAction('lobby.errors.leaveQueueFailed', () => leaveQueueMutation.mutateAsync())`.
4. `useCancelQueue.mutateAsync()` sends `DELETE` to `LcuPaths.lobby.matchmakingSearch`.
5. On successful DELETE, `createLcuMutation.onSuccess` invalidates `queueDescriptor.queryKey`, `queueSearchDescriptor.queryKey`, and `gameflowPhaseDescriptor.queryKey`.
6. Because `lobbySessionDescriptor.queryKey` is absent from that invalidation list, membership changes during cancel do not come from mutation invalidation. They can still come from `useLcuObserverSync(lobbySessionDescriptor, transport)`.
7. If LCU emits a lobby observer update whose content is temporarily empty, partial, missing `members`, or contains malformed member records, `lobbySessionDescriptor.parse` calls `parseLobbyMembers`, which returns `{ members: [], localSummonerId: ... }`.
8. `useLcuObserverSync` writes that parsed object directly into TanStack Query with `queryClient.setQueryData(lobbySessionDescriptor.queryKey, value)`.
9. `useLobby` immediately derives `rawMembers = lobbyQuery.data?.members ?? []`, so the returned `members` list becomes `[]` for at least the render(s) caused by that cache update.
10. The invalidated queue query/refetch or queue observer state can also settle to `emptyLobbyQueueStatus` / non-searching queue content, making `queueStatus.isSearching === false`.
11. The route evaluates `members.length > 0 || queueStatus.isSearching` as `false`.
12. Since this observer-driven membership replacement is not necessarily a query fetch, `isLobbyLoading` and `isLobbyFetching` can both be false; the loading guard does not protect this state.
13. `LobbyCreationContent` renders for the overlapping empty-members/non-searching frame(s).
14. A later LCU lobby observer update with the full lobby payload repopulates `members`; `hasLobby` becomes `true` again and the lobby UI returns.

## Root cause statement

The fragile point is the route-level lobby existence predicate. It treats `members.length === 0` as absence of a lobby except while searching, but the cache source for `members` is observer-driven and can be replaced by a syntactically valid empty parsed state. Queue cancellation removes the `queueStatus.isSearching` fallback at the same time, exposing the transient empty lobby session as "no lobby".

## Confirmation: `lobbySessionDescriptor` invalidation

`useCancelQueue` does not invalidate `lobbySessionDescriptor`. The function imports and invalidates `queueDescriptor`, `queueSearchDescriptor`, and `gameflowPhaseDescriptor` only for cancel. `lobbySessionDescriptor` is not imported in `lcu-mutations.ts`, and the cancel invalidation array at `apps/web-next/src/core/lcu/lcu-mutations.ts:122` does not include the lobby session query key.

## Static-analysis limits

This investigation proves the application code permits the reported transient state. It does not prove that the live League Client always emits the intermediate empty/partial lobby event on every cancel, because live browser/LCU automation was explicitly out of scope. The code evidence does show that if such an observer event is emitted, this UI will render the lobby creation screen until a subsequent populated lobby event arrives.
