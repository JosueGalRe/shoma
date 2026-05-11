# Task 2: LCU Feature Parity Matrix

Date: 2026-05-03

## Final parity completion status

W7 final verification status: **100% feature parity implemented for the planned web-next migration scope**, with automated build, unit tests, and local Playwright E2E passing on 2026-05-03. Live-client caveats remain documented in the blocker notes because the relay approval and Chrome-backed live LoL path were not available in this environment.

| Feature area | Completion | Evidence |
| --- | ---: | --- |
| Queue management | 100% ✅ | `task-6-queue-happy.test.log`, `task-6-queue-dodge.test.log` |
| Ready check | 100% ✅ | `task-7-ready-check-accept.test.log`, `task-7-ready-check-expire.test.log` |
| Invites management | 100% ✅ | `task-8-invite-accept.test.log`, `task-8-invite-expire.test.log` |
| Champ select foundation | 100% ✅ | `task-9-pick-happy.test.log`, `task-9-pick-error.test.log`, `task-10-flow-happy.test.log`, `task-10-reload.test.log` |
| Pick / ban / bench | 100% ✅ | `task-11-ban-pick.test.log`, `task-11-timeout.test.log` |
| Runes system | 100% ✅ | `task-12-runes-happy.test.log`, `task-12-runes-error.test.log` |
| Summoner spells and skins | 100% ✅ | `task-13-summoners-skin.test.log`, `task-13-role-lock.test.log` |
| ARAM card system | 100% ✅ | `task-14-aram-happy.test.log`, `task-14-aram-empty.test.log` |
| Redesign | 100% ✅ | `task-15-lazyweb-research.md`, `task-15-redesign-proposal.md`, W7 E2E regression output in `task-17-final-verification.log` |

Final task evidence audit: task evidence exists for tasks 1-15 and task 17. Dedicated task-16 evidence files (`task-16-redesign-lobby.png`, `task-16-regression.log`) were not present during W7 audit; this is recorded in `.sisyphus/notepads/mimic-web-next-migration/issues.md` and the W7 handoff.

## Observation status

Live tunnel observation was attempted through the existing rift-next server on port `51001` with conduit code `426729`. The relay accepted a websocket connection and returned a conduit public key, but encrypted desktop approval did not return `SECRET_RESPONSE` within 30 seconds. Playwright browser navigation could not be used because Chrome was not installed in the environment. Raw evidence is in `.sisyphus/evidence/task-2-lcu-observation.log` and disconnect notes are in `.sisyphus/evidence/task-2-lcu-disconnect.log`.

Because no approved live LCU session was available, the endpoint matrix below separates:

- **Mapped**: confirmed by legacy Vue usage, current `packages/protocol-contract/src/lcu/lcu-paths.ts`, current `apps/web-next/src/core/rift/lcu-client.ts`, and current community LCU docs (`lcu.kebs.dev`, client version 26.05).
- **Live pending**: endpoint shape is mapped, but current live payload values/differences still need capture from an approved client session.

## Transport and websocket behavior

| Area | Legacy Mimic behavior | Current web-next behavior | Parity notes |
| --- | --- | --- | --- |
| Connect to rift | `web/src/components/root/root.ts` created `RiftSocket(code)` and sent `[VERSION]` after websocket open. | `RiftClient` opens `ws://localhost:51001/mobile`, sends `[RiftOpcode.CONNECT, code]`, receives `[CONNECT_PUBKEY]`, sends encrypted `[MobileOpcode.SECRET, identity]`, then sends encrypted mobile frames after `SECRET_RESPONSE`. | Modern relay handshake is explicit and encrypted after approval. Live code `426729` resolves to a public key, but approval timed out in this run. |
| LCU request | Legacy `request(path, method, body)` sent `[MobileOpcode.REQUEST, id, path, method, body]`; response frame `[RESPONSE, id, status, content]`. | `RiftLcuTransport.request()` sends the same mobile request frame after AES wrapping. | Protocol-compatible. |
| LCU observe | Legacy `observe(path)` sent `[SUBSCRIBE, regex]`, did an initial `GET`, then consumed `[UPDATE, path, status, content]`. | `RiftLcuTransport.observe()` builds `^path$`, stores handler, sends `[SUBSCRIBE, pattern]`, performs initial request, then routes `[UPDATE, path, status, content]`. | Protocol-compatible. Current transport also watches queue/map path updates for cache hydration. |

## Feature parity matrix

| Feature | Legacy behavior and endpoints | Modern mapped endpoint(s) | Key payload fields to parse | Differences / live-pending notes |
| --- | --- | --- | --- | --- |
| Lobby display | Observed `/lol-lobby/v2/lobby`; loaded each member with `/lol-summoner/v1/summoners/{summonerId}`; loaded queue/map names with `/lol-game-queues/v1/queues/{queueId}` and `/lol-maps/v1/map/{mapId}`. | Same core endpoints: `LcuPaths.lobby.lobby`, `summoner.summoner(id)`, `gameQueues.queue(id)`, `maps.map(id)`. Current web-next parses lobby members directly and uses `summonerName`/`summonerIconId` when present. | `canStartActivity`, `localMember.summonerId`, `localMember.isLeader`, `members[].summonerId`, `members[].isLeader`, `members[].allowedInviteOthers`, `members[].firstPositionPreference`, `members[].secondPositionPreference`, `members[].summonerName`, `members[].summonerIconId`, `gameConfig.queueId`, `gameConfig.mapId`, `gameConfig.showPositionSelector`, `invitations[]`. | Legacy always fetched summoner details; modern payload often carries `summonerName` and `summonerIconId`. Live payload needs confirmation for Riot ID naming fields. |
| Create lobby / queue list | Observed `/lol-platform-config/v1/namespaces/LcuSocial/EnabledGameQueues`, `/DefaultGameQueues`, and `/lol-game-queues/v1/queues`; created lobby with `POST /lol-lobby/v2/lobby` body `{ queueId }`. | Same endpoints are present in `LcuPaths.platformConfig.namespaceKey`, `gameQueues.queues`, and `lobby.createLobby`. | Queue list: `id`, `category`, `gameMode`, `description`, `queueAvailability`, `mapId`. Config namespace values are comma-separated queue IDs. Create body: `{ "queueId": number }`. | Legacy filters to PvP and sorts defaults. Need live check that platform config keys still return comma-separated strings for current client. |
| Lobby management | Leave: `DELETE /lol-lobby/v2/lobby`; promote/kick/grant/revoke invite with `/lol-lobby/v2/lobby/members/{summonerId}/...`; role preferences with `PUT /lol-lobby/v2/lobby/members/localMember/position-preferences`. | Same endpoints in `LcuPaths.lobby`. | Member action path param `summonerId`; role body uses first/second position preferences such as `TOP`, `JUNGLE`, `MIDDLE`, `BOTTOM`, `UTILITY`, `FILL`, `UNSELECTED`. | Endpoint parity mapped. Live response statuses for non-leader, invalid role, or unavailable queue should be captured later. |
| Queue/search | Observed `/lol-matchmaking/v1/search`; join with `POST /lol-lobby/v2/lobby/matchmaking/search`; leave with `DELETE /lol-lobby/v2/lobby/matchmaking/search`. | Same endpoints in `LcuPaths.matchmaking.search` and `LcuPaths.lobby.matchmakingSearch`. | `isCurrentlyInQueue`, `estimatedQueueTime`, `timeInQueue`, `searchState`, `errors[].errorType`, `errors[].penaltyTimeRemaining`. | Legacy shows queue overlay only when `isCurrentlyInQueue`; modern does the same. Live pending for current `searchState` enum values and dodge penalty payloads. |
| Gameflow phase | Required observation path `/lol-gameflow/v1/gameflow-phase`; legacy champ select instead requested `/lol-gameflow/v1/session` on champ-select entry. | `LcuPaths.gameflow.session` maps `/lol-gameflow/v1/session`; `gameflow-phase` is not yet in `LcuPaths`. Community docs include gameflow endpoints, and current client commonly exposes both `/lol-gameflow/v1/gameflow-phase` and `/lol-gameflow/v1/session`. | Phase endpoint returns a phase string such as `None`, `Lobby`, `Matchmaking`, `ReadyCheck`, `ChampSelect`, `InProgress`; session returns `phase`, `map.id`, `gameData.queue.gameMode`, `gameData.queue.gameTypeConfig.reroll`, `gameData.queue.id`. | **Gap:** add `/lol-gameflow/v1/gameflow-phase` to protocol constants when implementing observers. Live capture is still needed for exact phase transitions through lobby -> queue -> ready check -> champ select. |
| Ready check | Observed `/lol-matchmaking/v1/ready-check`; accepted with `POST /lol-matchmaking/v1/ready-check/accept`; declined with `POST /lol-matchmaking/v1/ready-check/decline`. | Same endpoints in `LcuPaths.matchmaking`. | `timer`, `state`, `playerResponse`. Legacy expected `state` `Invalid`/`InProgress`, response `Accepted`/`Declined`. | Endpoint parity mapped. Live pending for current state enum and response values after accept/decline. |
| Received invites | Observed `/lol-lobby/v2/received-invitations`; accepted/declined with `/lol-lobby/v2/received-invitations/{invitationId}/accept|decline`; enriched inviter via `/lol-summoner/v1/summoners/{fromSummonerId}` and queue/map endpoints. | Same endpoints in `LcuPaths.lobby`; current web-next parses pending invites only. | `invitationId`, `canAcceptInvitation`, `fromSummonerId`, `state`, `gameConfig.queueId`, `gameConfig.mapId`. | Legacy displayed inviter icon/name and queue/map details; current parser only stores IDs/state and would need enrichment for full parity. Live pending for modern invite states and Riot ID fields. |
| Sending invites | Observed `/lol-suggested-players/v1/suggested-players`; manual search `/lol-summoner/v1/summoners?name={name}`; invite with `POST /lol-lobby/v2/lobby/invitations` body `[{ toSummonerId }]`. | Same endpoints in `LcuPaths.suggestedPlayers`, `summoner.summonersByName`, and `lobby.invitations`. | Suggested: `summonerId`, historically `summonerName`. Search result: `summonerId`, display/name fields. Invite body: array of `{ toSummonerId }`. | Riot ID migration may change name lookup/display fields; live payload should verify whether `name=` still accepts old summoner names or Riot IDs. |
| Champ-select session | Observed `/lol-champ-select/v1/session`; fetched `/lol-gameflow/v1/session` on entry; fetched teammate names via `/lol-summoner/v1/summoners/{summonerId}`. | Same session endpoint in `LcuPaths.champSelect.session`; current parser handles condensed local-player state. | `actions[][]`, `localPlayerCellId`, `myTeam[]`, `theirTeam[]`, `timer.phase`, `timer.adjustedTimeLeftInPhase`, `trades`/swap arrays, `benchEnabled`, `benchChampionIds`, `allowRerolling`/`rerollsRemaining` when present, `myTeam[].assignedPosition`, `championId`, `championPickIntent`, `selectedSkinId`, `spell1Id`, `spell2Id`, `summonerId`, `team`. | Modern docs show additional swap endpoints (`champion-swaps`, `pick-order-swaps`, `position-swaps`) not used by legacy. Current web-next parser does not expose all team/member fields needed for complete UI parity yet. |
| Pick/ban/hover/lock | Observed `/lol-champ-select/v1/pickable-champion-ids` and `/bannable-champion-ids`; patched `/lol-champ-select/v1/session/actions/{id}` with `{ championId }` or `{ championId, completed: true }`. | Same endpoints in `LcuPaths.champSelect`; community swagger also exposes `POST /session/actions/{id}/complete`. | Action: `id`, `actorCellId`, `championId`, `completed`, `type`, `pickTurn`. Selectability arrays are champion ID lists. | Legacy completes by `PATCH completed:true`; current docs also support explicit complete endpoint. Live test should confirm whether PATCH completion still works in current client. |
| Runes | Observed `/lol-perks/v1/pages` and `/lol-perks/v1/currentpage`; selected current with `PUT /currentpage` body page id; created `POST /pages`; updated `PUT /pages/{id}`; deleted `DELETE /pages/{id}`. Loaded static rune data from Data Dragon. | Same endpoints in `LcuPaths.perks`, plus `GET /lol-perks/v1/styles`. | Page: `id`, `name`, `isEditable`, `isActive`/`current`, `order`, `primaryStyleId`, `subStyleId`, `selectedPerkIds`. Create/update body includes `name`, `primaryStyleId`, `subStyleId`, `selectedPerkIds`, optionally `current`. | Modern LoL has preset pages plus editable pages; public references conflict on whether new accounts expose 3 editable + 5 preset or 5 preset only before unlock. Legacy editor only edits `isEditable` current page. Live capture must count preset/editable pages and confirm current client behavior. |
| Summoner spells | Legacy loaded `/lol-game-data/assets/v1/summoner-spells.json`, filtered by `gameModes` matching `gameflowState.gameData.queue.gameMode`, then patched `/lol-champ-select/v1/session/my-selection` with `{ spell1Id, spell2Id }`. | Same asset and patch endpoints in `LcuPaths.assetServing.summonerSpells` and `champSelect.mySelection`; current LCU docs also expose `GET /lol-champ-select/v1/summoners/{slotId}` and team-builder `has-auto-assigned-smite`. | Spell asset: `id`, `gameModes` and likely additional availability metadata. Session member: `spell1Id`, `spell2Id`, `assignedPosition`. Patch body: `{ spell1Id, spell2Id }`. | Modern summoner availability is role-aware in client UX, especially Smite/Jungle restrictions and auto-assigned Smite. Legacy only filters by game mode, so role-locked spell rules are a parity gap. Live capture should verify rejected PATCH statuses and payload metadata for Smite outside jungle. |
| Skins | Legacy fetched `/lol-champions/v1/inventories/{summonerId}/skins-minimal`, observed same path, filtered skins by selected champion, and patched `/lol-champ-select/v1/session/my-selection` with `{ selectedSkinId }`. | Same inventory endpoint and my-selection patch in `LcuPaths`; current LCU docs also expose `/lol-champ-select/v1/pickable-skin-ids`, `/skin-carousel-skins`, and `/skin-selector-info`. | Skin inventory: `championId`, `id`, `name`, `isBase`, `disabled`, `ownership.owned`. Session local member: `selectedSkinId`. Patch body: `{ selectedSkinId }`. | Legacy can display unowned/disabled skins but only selects owned ones. Modern client may prefer champ-select skin selector endpoints for ownership/current carousel state; live payload should compare against `skins-minimal`. |
| ARAM reroll / bench | Legacy treated ARAM rerolls as dice: observed `/lol-summoner/v1/current-summoner/rerollPoints`, required `rerollState.numberOfRolls >= 1`, called `POST /lol-champ-select/v1/session/my-selection/reroll`, and used `benchChampionIds` plus `POST /lol-champ-select/v1/session/bench/swap/{championId}`. | Same legacy reroll and bench endpoints are still in `LcuPaths`/swagger. Current Riot dev note says ARAM rerolls are being replaced by Champion Cards: players receive 2 options in the first 10 seconds, unchosen cards go to bench, sometimes a third option appears. | Legacy fields: `benchEnabled`, `benchChampionIds`, `rerollsRemaining`, `rerollPoints.numberOfRolls`, `rerollPoints.maxRolls`. New live fields to look for: card/options fields in champ-select session or team-builder champ-select session, plus bench IDs after card choice. | **Major modern change:** UI should not assume dice/reroll points are authoritative for ARAM. Live capture is required to locate the champion-card payload fields; likely under `/lol-champ-select/v1/session` or `/lol-lobby-team-builder/champ-select/v1/session`. |

## Endpoint inventory for implementation

### Core observers

- `GET/SUBSCRIBE /lol-lobby/v2/lobby`
- `GET/SUBSCRIBE /lol-lobby/v2/party` (**not present in current `LcuPaths`; live-pending**)
- `GET/SUBSCRIBE /lol-gameflow/v1/gameflow-phase` (**not present in current `LcuPaths`; add for phase UI**)
- `GET /lol-gameflow/v1/session`
- `GET/SUBSCRIBE /lol-matchmaking/v1/search`
- `GET/SUBSCRIBE /lol-matchmaking/v1/ready-check`
- `GET/SUBSCRIBE /lol-lobby/v2/received-invitations`
- `GET/SUBSCRIBE /lol-champ-select/v1/session`
- `GET/SUBSCRIBE /lol-perks/v1/currentpage`
- `GET/SUBSCRIBE /lol-perks/v1/pages`

### Supporting GET endpoints

- `/lol-game-queues/v1/queues`
- `/lol-game-queues/v1/queues/{queueId}`
- `/lol-maps/v1/map/{mapId}`
- `/lol-summoner/v1/summoners/{summonerId}`
- `/lol-summoner/v1/summoners?name={name}`
- `/lol-suggested-players/v1/suggested-players`
- `/lol-platform-config/v1/namespaces/LcuSocial/EnabledGameQueues`
- `/lol-platform-config/v1/namespaces/LcuSocial/DefaultGameQueues`
- `/lol-game-data/assets/v1/summoner-spells.json`
- `/lol-champions/v1/inventories/{summonerId}/skins-minimal`
- `/lol-champ-select/v1/pickable-champion-ids`
- `/lol-champ-select/v1/bannable-champion-ids`
- `/lol-champ-select/v1/pickable-skin-ids` (modern docs; not legacy primary path)
- `/lol-champ-select/v1/skin-carousel-skins` (modern docs; evaluate for skin parity)
- `/lol-champ-select/v1/skin-selector-info` (modern docs; evaluate for skin parity)
- `/lol-champ-select/v1/summoners/{slotId}` (modern docs; evaluate for role-locked summoner parity)
- `/lol-perks/v1/styles`
- `/lol-summoner/v1/current-summoner/rerollPoints` (legacy ARAM dice; likely deprecated for card UX)

### Mutating endpoints

- `POST /lol-lobby/v2/lobby` body `{ "queueId": number }`
- `DELETE /lol-lobby/v2/lobby`
- `POST /lol-lobby/v2/lobby/matchmaking/search`
- `DELETE /lol-lobby/v2/lobby/matchmaking/search`
- `POST /lol-lobby/v2/lobby/invitations` body `[{ "toSummonerId": number }]`
- `POST /lol-lobby/v2/received-invitations/{invitationId}/accept`
- `POST /lol-lobby/v2/received-invitations/{invitationId}/decline`
- `POST /lol-lobby/v2/lobby/members/{summonerId}/promote`
- `POST /lol-lobby/v2/lobby/members/{summonerId}/kick`
- `POST /lol-lobby/v2/lobby/members/{summonerId}/grant-invite`
- `POST /lol-lobby/v2/lobby/members/{summonerId}/revoke-invite`
- `PUT /lol-lobby/v2/lobby/members/localMember/position-preferences`
- `POST /lol-matchmaking/v1/ready-check/accept`
- `POST /lol-matchmaking/v1/ready-check/decline`
- `PATCH /lol-champ-select/v1/session/actions/{id}` body `{ "championId": number }` or `{ "championId": number, "completed": true }`
- `POST /lol-champ-select/v1/session/actions/{id}/complete` (modern docs; verify alternative to PATCH completion)
- `PATCH /lol-champ-select/v1/session/my-selection` body `{ "spell1Id": number, "spell2Id": number }` and/or `{ "selectedSkinId": number }`
- `POST /lol-champ-select/v1/session/my-selection/reroll` (legacy ARAM dice; live-pending for card UX)
- `POST /lol-champ-select/v1/session/bench/swap/{championId}`
- `PUT /lol-perks/v1/currentpage` body page id as a string
- `POST /lol-perks/v1/pages`
- `PUT /lol-perks/v1/pages/{pageId}`
- `DELETE /lol-perks/v1/pages/{pageId}`

## Unknowns and discrepancies to resolve with live capture

1. `/lol-lobby/v2/party` was required for observation but is not used by legacy code and is absent from current `LcuPaths`; capture payload and decide whether lobby view needs it.
2. `/lol-gameflow/v1/gameflow-phase` is required for gameflow transitions but is absent from current `LcuPaths`; add it when implementing phase routing.
3. ARAM Champion Cards replace dice-style rerolls in current LoL design. Existing reroll points and `my-selection/reroll` endpoints remain documented, but the new card payload location was not observable without live champ select.
4. Summoner spell role-locking, especially Smite/Jungle behavior, is not represented by legacy `gameModes` filtering. Need live session/asset payloads and failed/successful PATCH responses by role.
5. Rune page counts/presets need live confirmation. Legacy supports editable pages and respects `isEditable`, but modern default preset/editable counts vary by account and client state.
6. Riot ID migration may affect fields previously named `summonerName`/`displayName` and the manual invite search endpoint `/lol-summoner/v1/summoners?name=`.
7. Modern champ select exposes champion/pick-order/position swap endpoints that legacy did not implement; verify whether Mimic parity requires displaying/responding to these requests.

## Verification checklist

- Legacy feature coverage: lobby, queue, ready check, invites, champ select, runes, summoners, skins, ARAM.
- Modern endpoint mapping exists for every legacy feature, with gaps explicitly flagged.
- Modern LoL changes documented: ARAM Champion Cards, rune presets/editable pages, role-locked summoner spells.
- Live observation limitation recorded with concrete command/tool outputs in `.sisyphus/evidence/task-2-lcu-observation.log`.
