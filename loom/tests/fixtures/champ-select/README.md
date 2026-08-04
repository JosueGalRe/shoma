# Champ-select LCU fixtures

Raw LCU responses captured from a live client (patch 16.12) with `pnpm run capture:lcu`.
These are the ground truth for the champ-select rewrite (backlog #1) — parser shapes and
contract tests should be derived from these payloads, not from community repos.

## Confirmed contract findings

### Champion Cards live in `subset-champion-list` (confirmed)

Found via websocket capture (20260803-124024, ARAM queue 2400): a single `Create` event
on `/lol-lobby-team-builder/champ-select/v1/subset-champion-list` carrying `[254, 804]`
— the local player's 2 offered cards. The session flags it with
`allowSubsetChampionPicks: true`, and the client fires `grid-champions/{id}` Updates for
exactly those ids. `aw-set` is empty in BOTH namespaces (HTTP GET and WS events) — dead
lead, ignore it.

### Champion swaps have a rich dedicated resource

`/lol-champ-select/v1/ongoing-champion-swap` (WS Create/Update/Delete captured):
`{id, initiatedByLocalPlayer, otherSummonerIndex, requesterChampionId,
requesterChampionName, requesterChampionSplashPath, responderChampionName, …}`.
Far richer than the coarse `trades[]` in the session — this is what the trade UI needs.

### `actions` is 2D — `Action[][]`

Array of turn-groups, each holding its actions. Draft example: group 0 = 10 bans,
group 1 = `ten_bans_reveal`, groups 2-7 = picks. Sona's 3D typing (`flat(2)`) is wrong;
`flat()` is correct. Action fields superset community types: `actorCellId`, `championId`,
`completed`, `duration`, `id`, `isAllyAction`, `isInProgress`, `pickTurn`, `type`.

### Do not assume a ban phase exists

ARAM (queue 2400, 2026-08-03 capture): single group of 10 `pick` actions, no ban group,
no `ten_bans_reveal`. Normal Draft (queue 400) DOES have bans: the 20260803-125720 WS
capture shows all 10 ban actions completing with real championIds and `ten_bans_reveal`
completing (an earlier 400 draft had everyone no-ban, which looked like "bans never
complete" — wrong).

### Completed bans live in the actions, NOT in `bans`

The `bans` summary object (`myTeamBans`/`theirTeamBans`/`numBans`) stays EMPTY through
FINALIZATION and GAME_STARTING even with 10 completed bans — confirmed in BOTH queue 400
(20260803-125720) and ranked 420 (20260803-212722). The only source of truth for
completed bans is `actions[]` where `type == 'ban'` and `completed == true`. Note the
sentinel: a completed ban with `championId == -1` is an intentional "no ban" vote (0
means the player has not acted yet). Treat the `bans` object as dead.

### `bannable-champion-ids` can be a sentinel

Returns `[-1]` when bans are not available (PLANNING phase, no-ban queues) — not `[]`.

### `benchChampions` is `{championId, isPriority}[]`

Objects, not bare ids. Our parser currently models `benchChampionIds[]` — must change.
ARAM rerolls no longer exist: since patch 25.13 they were replaced by **Champion Cards**
(2 cards at draft start, sometimes 3;
unchosen go to the bench). Evidence in the 2026-08-03
ARAM capture: `rerollsRemaining: 0` all draft while the bench grows 0 → 4 → 9 (~2 unchosen
cards per player). `isPriority: true` still uncaptured — likely marks your own offered
cards on the bench (your offers arrive via `subset-champion-list`, see above).

### Timer has 4 phases

`PLANNING` → `BAN_PICK` → `FINALIZATION` → `GAME_STARTING`. `trades[]` empties on
GAME_STARTING. Exception: **ARAM has no PLANNING** — the first phase is BAN_PICK
(totalTimeInPhase 15000), and the Champion Cards choice happens inside it (first ~10s).

### Cell ids are not fixed per side

Draft 1: myTeam = cells 5-9. Draft 2 (ARAM): myTeam = cells 0-4. Derive the local side
from `localPlayerCellId` + team arrays, never from cell ranges.

### Enemy team is fully obfuscated until game start

`gameName: ""`, `summonerId: 0`, `puuid: ""`, `assignedPosition: ""`,
`nameVisibilityType: "HIDDEN"`. Confirmed by both session and `summoners/{cellId}`.

### `trades[]` lifecycle

`INVALID` (during picks, before both players hold champs) → `AVAILABLE` (FINALIZATION).
`SENT` / `RECEIVED` still uncaptured. `pick-order-swaps` endpoint did capture a real
`RECEIVED` (20260803-095037). Trade ids increment across the draft as swaps happen.

### Session extras vs our current model

`disallowBanningTeammateHoveredChampions`, `counter`, `lockedEventIndex`, `gameId`,
`pickOrderSwaps` / `positionSwaps` as `{cellId, id, state}[]`, `queueId` on the session.

## Still missing (capture targets)

- **Trade session states**: `trades[]` in `SENT`/`RECEIVED` (the swap itself is already
  covered by `ongoing-champion-swap` above).

## Capture tool

`pnpm run capture:lcu` — fully automatic by default: auto-discovers the lockfile
(WSL-aware, RiotClientInstalls.json → process lookup → drive scan), subscribes to the
LCU websocket (`OnJsonApiEvent`) dumping champ-select/team-builder/gameflow events to a
`*-ws-events.jsonl`, and polls gameflow-phase capturing HTTP endpoints with dedup on
every draft. `pnpm run capture:lcu menu` opens the interactive menu for manual captures.
See `scripts/capture-lcu.ts`.
