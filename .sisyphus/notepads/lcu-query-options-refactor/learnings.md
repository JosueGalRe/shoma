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

## 2026-05-04 - LCU parser unit tests
- Parser tests under apps/web-next/tests/unit/lcu-parsers/ must import source with ../../../src/... because they are one directory deeper than existing tests/unit/*.test.ts files.
- Bun parser suite command verified: bun test apps/web-next/tests/unit/lcu-parsers/ (35 pass, 111 assertions).
- web-next build also verified after adding tests: bun run build from apps/web-next.

## 2026-05-04 - Legacy web endpoint discovery (manual inspection)

### Confirmed endpoints from legacy code:

**Create Lobby:**
- `GET /lol-platform-config/v1/namespaces/LcuSocial/EnabledGameQueues` - comma-separated queue IDs
- `GET /lol-platform-config/v1/namespaces/LcuSocial/DefaultGameQueues` - comma-separated queue IDs
- `GET /lol-game-queues/v1/queues` - list of all queues
- `POST /lol-lobby/v2/lobby` - create lobby with `{ queueId }`

**Queue Dodge Penalty:**
- `GET /lol-matchmaking/v1/search` - `errors[].penaltyTimeRemaining` field

**Rune Page CRUD:**
- `GET /lol-perks/v1/pages` - list pages
- `GET /lol-perks/v1/currentpage` - get current page
- `POST /lol-perks/v1/pages` - create page (body: RunePage without id)
- `PUT /lol-perks/v1/pages/{pageId}` - update page (body: full RunePage)
- `DELETE /lol-perks/v1/pages/{pageId}` - delete page
- `PUT /lol-perks/v1/currentpage` - set active page (body: string of page ID)

**Skin Inventory:**
- `GET /lol-champions/v1/inventories/{summonerId}/skins-minimal` - owned skins

**Rune Page Structure:**
```ts
interface RunePage {
  id: number;
  name: string;
  isEditable: boolean;
  isActive: boolean;
  order: number;
  primaryStyleId: number;
  subStyleId: number;
  selectedPerkIds: number[]; // [keystone, rune1, rune2, rune3, sec1, sec2, stat1, stat2, stat3]
}
```

**Create Lobby Queue Sorting Logic:**
1. Filter: category === "PvP", queueAvailability === "Available", id in enabledGameQueues
2. Group by: `${mapId}-${gameMode}`
3. Sort within group: defaultGameQueues order first
4. Sort sections: map 11 (Rift) > CLASSIC > ARAM > others

**Trade/Swap:**
- Legacy has `trades` field in champ-select state but NO explicit trade/swap mutation methods found
- This means legacy did NOT implement champion trade/swap UI, despite having the type
- **Decision**: Exclude trade/swap from parity plan (legacy doesn't have it either)

**Bench Swap:**
- `POST /lol-champ-select/v1/session/bench/swap/{championId}` - ALREADY in protocol-contract

**PWA Install:**
- Legacy uses `window.installPrompt` (Android Chrome specific)
- Modern approach: `beforeinstallprompt` event

**iOS Safe Area:**
- Legacy detects notch by checking `env(safe-area-inset-top)` padding
- Adds `has-notch` class to body
- Components use `calc(env(safe-area-inset-top) + Npx)` for padding


## 2026-05-04 - LCU endpoint discovery: champ-select, dodge, recommended runes, swiftplay

- Legacy web already proves the rune-page CRUD paths: `GET/POST /lol-perks/v1/pages`, `GET/PUT /lol-perks/v1/currentpage`, `GET/PUT/DELETE /lol-perks/v1/pages/{pageId}`. See `web/src/components/champ-select/rune-editor.ts` and `champ-select.ts` in the legacy repo.
- For Riot recommended rune sets, I found **no dedicated `recommended-runes` endpoint**. The strongest evidence is the perks recommendation family in current contracts:
  - `GET /lol-perks/v1/recommended-champion-positions`
  - `GET /lol-perks/v1/recommended-pages-position/champion/{championId}`
  - `POST /lol-perks/v1/recommended-pages-position/champion/{championId}/position/{position}`
  - `GET /lol-perks/v1/recommended-pages/champion/{championId}/position/{position}/map/{mapId}`
  - `GET /lol-perks/v1/quick-play-selections/champion/{championId}/position/{position}`
- The recommended-pages response is `LCUTypes.LolPerksPerkUIRecommendedPage[]`, and page records include `runeRecommendationId`, `recommendationChampionId`, `recommendationIndex`, and `quickPlayChampionIds`.
- Queue dodge penalty timer data comes from `GET /lol-matchmaking/v1/search`. Response shape includes `errors[].penaltyTimeRemaining` and `lowPriorityData.penaltyTimeRemaining`; the legacy lobby UI computes the displayed timer from `errors`.
- Champion trade in champ-select is split across two endpoint families in the sources I found:
  - legacy/community code uses `GET /lol-champ-select/v1/ongoing-trade` and `POST /lol-champ-select/v1/session/trades/{id}/{request|accept|decline|cancel}` plus `POST /lol-champ-select/v1/ongoing-trade/{id}/clear`
  - current contract types also expose `GET /lol-champ-select/v1/session/champion-swaps`, `GET /lol-champ-select/v1/session/champion-swaps/{id}`, and `POST /lol-champ-select/v1/session/champion-swaps/{id}/request`
- Champion swap / pick-order swap in champ-select is clearly exposed in current contracts:
  - `GET /lol-champ-select/v1/session/pick-order-swaps`
  - `GET /lol-champ-select/v1/session/pick-order-swaps/{id}`
  - `POST /lol-champ-select/v1/session/pick-order-swaps/{id}/{accept|cancel|decline|request}`
  - `GET /lol-champ-select/v1/session/position-swaps`
  - `POST /lol-champ-select/v1/session/position-swaps/{id}/{accept|cancel|decline|request}`
- I did **not** find a standalone `swiftplay` endpoint. Swiftplay-related submission appears to be carried on rune-page payloads instead: `PUT /lol-perks/v1/pages/{pageId}` accepts `quickPlayChampionIds`, `runeRecommendationId`, `recommendationChampionId`, `recommendationIndex`, `isRecommendationOverride`, `primaryStyleId`, `subStyleId`, and `selectedPerkIds`.
- The legacy web code only observes perks pages/currentpage and does not mention the recommendation APIs directly, so the recommendation and swiftplay paths are effectively new-discovery items for web-next.

## 2026-05-04 - LCU endpoint discovery (update 2: confirmed paths from community docs)

### 1. Riot Recommended Rune Sets

**Endpoint**: `GET /lol-perks/v1/recommended-pages/champion/{championId}/position/{position}/map/{mapId}`

**Evidence**: Found in [LeagueAkari/LeagueAkari](https://github.com/LeagueAkari/LeagueAkari/blob/main/src/shared/http-api-axios-helper/league-client/perks.ts) and [dysolix/hasagi-core](https://github.com/dysolix/hasagi-core/blob/main/src/types/lcu-endpoints.d.ts):

```typescript
// From LeagueAkari:
getRecommendedPages(championId: number, position: string, mapId: number) {
  return this._http.get<RecommendPage[]>(
    `/lol-perks/v1/recommended-pages/champion/${championId}/position/${position}/map/${mapId}`
  )
}
```

**Response shape** (from Python code analysis):
```typescript
interface RecommendedPage {
  primaryPerkStyleId: number;
  secondaryPerkStyleId: number;
  keystoneId: number;
  perkIds: number[];
  position: string;
  mapId: number;
  championId: number;
  recommendationIndex: number;
  runeRecommendationId: number;
  recommendationChampionId: number;
  quickPlayChampionIds: number[];
  summonerSpellIds: number[];
}
```

**Related endpoints** (for getting recommendation metadata):
- `GET /lol-perks/v1/recommended-champion-positions` - returns positions per champion
- `GET /lol-perks/v1/recommended-pages-position/champion/{championId}` - available positions for a champion
- `POST /lol-perks/v1/recommended-pages-position/champion/{championId}/position/{position}` - set recommendation preference

### 2. Queue Dodge Penalty Timer

**Endpoint**: `GET /lol-matchmaking/v1/search`

**Already in codebase**: This endpoint is confirmed in `web/src/components/lobby/lobby.ts` line 82:
```typescript
this.$root.observe("/lol-matchmaking/v1/search", result => {
    this.matchmakingState = result.status === 200 ? result.content : null;
});
```

**Dodge penalty computation** from `apps/web-next/src/core/lcu/parsers/queue.ts`:
```typescript
export function readDodgePenalty(queueState: QueueSearchState | null): number {
  const penalties = queueState?.errors?.map((error) => error.penaltyTimeRemaining ?? 0) ?? []
  return Math.max(0, ...penalties)
}
```

**Response shape**:
```typescript
interface QueueSearchState {
  errors?: Array<{
    errorType?: string;
    penaltyTimeRemaining?: number;
  }>;
  isCurrentlyInQueue?: boolean;
  queueType?: string;
  searchState?: string;
  timeInQueue?: number;
}
```

### 3. Champion Trade in Champ-Select

**Endpoints**:
- `GET /lol-champ-select/v1/session/trades` - current trades
- `GET /lol-champ-select/v1/session/trades/{id}` - specific trade
- `POST /lol-champ-select/v1/session/trades/{id}/request` - request a trade
- `POST /lol-champ-select/v1/session/trades/{id}/accept` - accept trade
- `POST /lol-champ-select/v1/session/trades/{id}/decline` - decline trade
- `POST /lol-champ-select/v1/session/trades/{id}/cancel` - cancel trade

**Evidence**: Found in [lcu.vivide.re](https://lcu.vivide.re/) swagger docs:
```
GET /lol-lobby-team-builder/champ-select/v1/session/trades
```

Note: The trade endpoints exist under `lol-lobby-team-builder` plugin (older) but may be replicated under `lol-champ-select/v1/session/trades` in newer clients.

### 4. Champion Swap (Pick Order Swap) in Champ-Select

**Endpoints**:
- `GET /lol-champ-select/v1/session/pick-order-swaps` - all pick order swaps
- `GET /lol-champ-select/v1/session/pick-order-swaps/{id}` - specific swap
- `POST /lol-champ-select/v1/session/pick-order-swaps/{id}/request` - request pick order swap
- `POST /lol-champ-select/v1/session/pick-order-swaps/{id}/accept` - accept swap
- `POST /lol-champ-select/v1/session/pick-order-swaps/{id}/decline` - decline swap
- `POST /lol-champ-select/v1/session/pick-order-swaps/{id}/cancel` - cancel swap

**Evidence**: From [dysolix/hasagi-core](https://github.com/dysolix/hasagi-core/blob/main/src/types/lcu-endpoints.d.ts) line 573:
```typescript
"/lol-champ-select/v1/session/pick-order-swaps": {
    get: { path: never, params: never, body: never, response: LCUTypes.TeamBuilderDirect_ChampSelectSwapContract[] }
},
"/lol-champ-select/v1/session/pick-order-swaps/{id}": {
    get: { path: [id: number], params: never, body: never, response: LCUTypes.TeamBuilderDirect_ChampSelectSwapContract }
},
```

**Also found**:
- `GET /lol-champ-select/v1/ongoing-pick-order-swap` - current ongoing pick order swap
- `POST /lol-champ-select/v1/ongoing-pick-order-swap/{id}/clear` - clear ongoing swap

### 5. Swiftplay Config Submission

**NOT FOUND**: No dedicated swiftplay submission endpoint discovered.

**Evidence from search**: The Swiftplay store in `apps/web-next/src/features/swiftplay/swiftplay-store.ts` defines config structure but there's no LCU mutation for submitting it.

**Analysis**: Swiftplay config may be submitted as part of:
1. **Rune page updates** (`PUT /lol-perks/v1/pages/{pageId}`) - rune pages have `quickPlayChampionIds`, `runeRecommendationId`, `recommendationChampionId`, `recommendationIndex` fields
2. **Lobby member data** (`PUT /lol-lobby/v2/lobby/memberData`) - may carry swiftplay preferences
3. **Matchmaking search** (`POST /lol-lobby/v2/lobby/matchmaking/search`) - swiftplay config may be attached to queue entry

**Current implementation**: The Swiftplay route only validates config locally and navigates to lobby - it does NOT submit config to LCU.

### Summary Table

| Feature | Endpoint | Method | Notes |
|---------|----------|--------|-------|
| Recommended Rune Sets | `/lol-perks/v1/recommended-pages/champion/{id}/position/{pos}/map/{mapId}` | GET | Returns 3 sets per champion/position/map |
| Dodge Penalty Timer | `/lol-matchmaking/v1/search` | GET | `errors[].penaltyTimeRemaining` |
| Champion Trade | `/lol-champ-select/v1/session/trades/{id}/*` | GET/POST | request/accept/decline/cancel |
| Pick Order Swap | `/lol-champ-select/v1/session/pick-order-swaps/{id}/*` | GET/POST | request/accept/decline/cancel |
| Swiftplay Config | **NOT FOUND** | - | May be submitted via rune page or lobby endpoints |

## 2026-05-04 - Typed LCU endpoint parsers

- Added strict typed parsers for `/lol-game-queues/v1/queues`, `/lol-perks/v1/pages`, and `/lol-champions/v1/inventories/{summonerId}/skins-minimal`; single-item parsers return `null` on malformed or missing required fields, while array parsers return `[]` for non-arrays and filter invalid entries.
- `gameQueuesDescriptor`, `perksPagesDescriptor`, and `createSkinInventoryDescriptor()` now use the typed parsers; `perksStylesDescriptor` and `suggestedPlayersDescriptor` intentionally remain on raw `readArray`.
- Confirmed dodge penalty remains centralized in `apps/web-next/src/core/lcu/parsers/queue.ts` as `readDodgePenalty(queueState)`; no duplicate parser was created.
- Verification: changed-file `lsp_diagnostics` clean, `bun test apps/web-next/tests/unit/lcu-parsers/` passed 50 tests / 138 assertions, and `bunx tsc --noEmit` from `apps/web-next` passed.
