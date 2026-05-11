# Learnings

## 2026-05-09 - Cancel queue lobby flash static analysis

- Cancel queue is wired from `LobbyQueueCard` → `useLobby.actions.leaveQueue` → `useCancelQueue.mutateAsync()` and sends `DELETE` to `LcuPaths.lobby.matchmakingSearch`.
- `useCancelQueue` invalidates only `queueDescriptor`, `queueSearchDescriptor`, and `gameflowPhaseDescriptor`; it does not invalidate `lobbySessionDescriptor`.
- `lobbySessionDescriptor` can still change during cancel through `useLcuObserverSync`, which directly calls `queryClient.setQueryData` for observer content.
- `parseLobbyMembers` returns an empty `members` array when the lobby observer payload is missing `members`, has `members: []`, or contains malformed member records.
- The flash root cause is the overlap of `members.length === 0` from observer-updated lobby data and `queueStatus.isSearching === false` from cancel/refetch, causing `hasLobby = members.length > 0 || queueStatus.isSearching` to temporarily render `LobbyCreationContent`.
- Sticky members in `useLobby` now use the live lobby array when present, fall back to the last non-empty snapshot only during empty transient states, and clear immediately on `None`/`ChampSelect` or after a 3000ms idle window when not searching.

- Route-level `hasLobby` now carries a 3000ms grace window after `queueStatus.isSearching` flips true → false, and it clears immediately on `None`/`ChampSelect` to match the hook-level sticky reset behavior.
## 2026-05-09
- `useLobby` sticky-member tests can run without a DOM by mocking React hooks and TanStack Query, then driving rerenders through a tiny in-test harness.
- Bun’s `mock.timers` helper wasn’t available in this environment, so a local fake clock around `setTimeout`/`clearTimeout` was enough to verify the 3000ms grace window deterministically.
- The hook’s sticky state is easiest to assert by rendering with controlled query payloads: non-empty lobby data seeds the sticky cache, empty payloads preserve it, and phase changes to `None`/`ChampSelect` bypass it immediately.
- Route-level lobby grace tests also work without a browser DOM by mocking `react`, `react/jsx-runtime`, `react/jsx-dev-runtime`, and `@tanstack/react-router`, then resolving the route component with a tiny hook harness.

## 2026-05-09 F2 code quality review
- Reviewed use-lobby.ts, lobby route, and sticky/grace tests. LSP diagnostics clean on all four files; banned-pattern grep found no as any, @ts-ignore, TODO/FIXME/HACK, or console.log. Verdict: APPROVE.

## 2026-05-09 F1 plan compliance audit
- Scope stayed within `features/lobby`, `routes/connected/lobby`, and `core/lcu/lcu-mutations.ts`.
- No gameflow phase-to-route mapping changes, no global TanStack Query cache policy changes, no UI redesign, and no indefinite empty-lobby masking were introduced.
- The 3000ms grace window is time-bounded, and sticky members clear on `None`/`ChampSelect`.
