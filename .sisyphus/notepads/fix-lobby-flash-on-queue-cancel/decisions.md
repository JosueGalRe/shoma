## 2026-05-09

- Did not add `lobbySessionDescriptor.queryKey` to `useCancelQueue.invalidateKeys`.
- Reason: `lobbySessionDescriptor` shares the same query key as `lobbyDescriptor`, so invalidating it on queue cancel would immediately refetch the lobby query.
- That refetch can surface the empty/transition payload before members repopulate, which risks reintroducing the lobby flash/flicker instead of fixing it.
- Kept the flicker fix dependent on sticky members + grace timing, not on more aggressive lobby invalidation.
