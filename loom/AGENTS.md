# loom KNOWLEDGE BASE

**Generated:** 2026-05-24

## OVERVIEW

Next-gen mobile web UI for Sho'ma. Built with React 19, TanStack Router, and StyleX on `@shoma/ui` (Base UI). Legacy version lives in `legacy/web/`.

## STRUCTURE

```
loom/
├── src/
│   ├── main.tsx              # Entry: router + query client + runtime setup
│   ├── routes/               # TanStack Router file-based routes
│   │   ├── __root/           # Root layout
│   │   ├── index/            # Landing/connect page
│   │   └── connected/        # Authenticated game-flow pages
│   │       └── lobby/
│   │           └── -components/   # Route-scoped private components
│   ├── core/                 # Cross-cutting runtime modules
│   │   ├── relay/            # WebSocket + encryption handshake
│   │   ├── lcu/              # LCU parsers, queries, mutations
│   │   ├── state/            # Zustand stores (gameflow, session, settings)
│   │   └── http/             # API client (Data Dragon + CommunityDragon)
│   ├── features/             # Domain-driven feature folders
│   │   ├── connect/          # Connection flow
│   │   ├── lobby/            # Lobby + queue + ready-check
│   │   ├── champ-select/     # Pick/ban/runes/skins
│   │   ├── social/           # Friends list + chat
│   │   └── queue/            # Queue overlay
│   ├── components/           # App shell (layout), logo, PWA update prompt
│   ├── lib/                  # Shared utilities (asset-resolver, fuzzy-search, normalizers)
│   ├── i18n/                 # Translation keys + setup
│   ├── sim/                  # Dev-only simulated League client (?sim)
│   └── testing/              # Shared test mocks and helpers
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/                  # Playwright tests (*.pw.ts)
```

## MANDATORY RULES

Every agent and contributor must follow these rules without exception unless explicitly listed in the Exceptions section.

### Component Architecture

- **One component per file:** Each `.tsx` file must contain exactly one React component.
- **No auxiliary components:** Do not declare helper or auxiliary components in the same file as the main component. Extract them to their own files.
- **File suffixes:** Use explicit suffixes for supporting files:
  - `-types.ts` (or `types.ts` in a subfolder) for TypeScript interfaces and types.
  - `-utils.ts` (or `utils.ts` in a subfolder) for pure utility functions.
- **Props naming:** Use `props: ComponentNameProps` for component parameters. Declare the type outside the component and avoid complex inline types.

### Styling

- **StyleX:** Style with `create`/`props` from `@stylexjs/stylex` over the `@shoma/ui` components and tokens (root `AGENTS.md`, NOTES). `create` lives in the component's file, not a `-styles.ts`, so `stylex/no-unused` checks it.
- **Base reset:** `src/styles.css` keeps the parts of Tailwind's preflight the screens were built on (box-sizing, no margins, borders at `0 solid`, button and input resets) in a `reset` layer, which StyleX's layers always beat (`useCSSLayers.before` in `vite.config.ts`). Its other rules are unlayered and beat StyleX.

### TypeScript & Type Safety

- **No `any`:** The use of `any` is strictly prohibited. Use `unknown` or specific types.
- **No type assertions:** Do not use `as SomeType` or `<SomeType>value`. Use narrowing, type guards, or Valibot schemas instead.
- **Import Type:** Use `import type` for all type-only imports. Mixed value/type statements with inline `type` modifiers (e.g. `import { type GameMode, gameModes }`) are standard; pure `import type` statements group after value imports (perfectionist enforces grouping and order).
- **No inline imports:** Do not use `import("...").Type` syntax.
- **Strictness:** Do not weaken types to bypass errors. If a type is `unknown`, ensure safe narrowing is performed.

### Logic & Control Flow

- **No nested ternaries:** Replace nested ternary operators with clearer structures like `if/else` or helper functions.
- **Curly braces required:** All control flow blocks (`if`, `else`, `for`, `while`) and arrow functions must use curly braces.
- **Function declarations:** Prefer `function` declarations over `const` arrow functions for top-level utilities, selectors, and components.
- **Magic strings:** Domain constants colocate with their owning module (e.g. `MAX_RECENT_SESSIONS` in the store file). There is no shared `src/constants/` directory.
- **Async safety:** Use `void` for intentionally unawaited promises.

### Formatting & Readability

- **JSX Separation:** Separate blocks of JSX with blank lines to improve scanability.
- **Statement Grouping:** Group variables, hooks, and effects by intent, separating unrelated blocks with blank lines.
- **JSX Complexity:** Extract complex JSX blocks or logic to separate components or helper functions. Avoid heavy calculations inside the render body.

### State & Data

- **Zustand:** Use for global or shared client state. Keep stores small, focused, and single-purpose. Avoid using Zustand for simple local state.
- **React Query:** Use TanStack Query for all server state, fetching, caching, and mutations. Manual `useEffect` fetching is prohibited. Keep query keys typed and consistent. One LCU path is one descriptor to read it: `lcuQueryKey` keys by path, so two descriptors with different parsers on the same path overwrite each other's cache, and the last fetch or observer event wins (a members-only lobby descriptor next to `lobbySessionDescriptor` once wiped the lobby's queue whenever a chat opened).
- **Social:** a full-screen layer over any connected screen (`features/social/components/social-screen.tsx`, a Base UI Dialog), not a route, so it never fights the phase-driven navigation; the TopBar's chat button opens it (`ui-store` `isSocialOpen`) and a chat opens as a second layer on top. In a window of 740px or more (`useSocialDocked`), Social is docked instead: the connected layout puts a panel at the screens' right (`AppShell` `wide`: the 480px column plus 412px), `SocialLayer` portals into it non-modal and pinned (no back arrow, no focus taken, no TopBar chat button), and the chat and Social's sheets open inside it (`SocialLayer` provides the panel as `OverlayContainer`), over the list, while the screen beside stays usable. Docking or undocking remounts the Dialog, since a popup sliding out of the removed panel never finishes. What opens over the screens stays over their column when docked: the layout's `data-overlays` layer covers it (`pointer-events: none`, its children take taps again in `styles.css`) and is the `OverlayContainer` of the kit's modals, sheets and toasts, contained so their fixed boxes fill it; the gameflow transition renders in it, and the screens' backgrounds still reach the window's edges. The open chat lives in `ui-store` (`openChat`) so the layout can lower the snackbar to the Figma's 24px over Social's list and sheets and keep it over a chat's composer. A chat closed by tap or click gives the focus back to Social's layer, ringless (`finalFocus`). Folders: the client's "Add folder" (`AddFolderSheet`, disabled while "Group Games & Servers" is on), checked as the client checks names, then `POST /lol-chat/v1/friend-groups` with the highest priority plus one; `friendGroupsDescriptor` lists folders by priority, the client's order, so a new one comes first. The friend list's order and grouping are the client's own `/lol-chat/v1/settings` (`useChatSettings`, written whole like the client does), so loom and the desktop list match. Unread messages follow the client's badges (`useUnreadChats`: 1:1, private and Clash conversations, never muted ones): a count on the friend's row, on a folded group's name, and the TopBar's chat button in Figma's Filled state; an open chat is the client's active conversation (`PUT /lol-chat/v1/conversations/active`, `DELETE` on close), which the LCU doesn't count unread. Group chats are Clash teams' (`useClashTeams`): each `/lol-clash/v1/player/chat-rosters` roster with the `clash` conversation whose id starts with its `multiUserChatId` (the client joins it on its own), listed above the friends, with each sender's picture from `/lol-chat/v1/conversations/{id}/participants`. Every chat, 1:1 included, draws its messages as the Figma "Grupo" chat (113:5170): the sender's picture by each bubble, the time inside it, a divider per day. A friend's chat shows their status line and the client's "Invite to game" while the local player's lobby can take them.
- **Champ select turns:** a tap on the grid always hovers, as the client does: in the player's ban or pick it's the turn's choice, before it the pick intent the team sees (PATCH on the pending pick action). CONFIRM and LOCK IN only work in the player's own turn, and never on a champion banned or taken meanwhile. The header names whose turn it is with the client's `timer_phase_ban_pick_*` copy (`picks-allies` / `picks-enemies` stages), and the team strip rings the cells the turn waits on (`readActingActions`). While a cell bans, its circle carries the client's ban mark (`shouldShowBanIntentIcon` in `rcp-fe-lol-champ-select`) over the champion it hovers to ban; the other team's circles stay empty under it, since the LCU sends their bans as `championId: 0`, `completed: false` until the reveal (the client too only knows `theirTeamIsBanning`, and the session's `bans` arrays stay empty in the recordings), so all five carry it until then. Between the player's turns (planning, after their ban, while the others ban or pick) the grid stays and a tap declares the intent. Both teams' bans sit in one row over the grid (`BanRow`: the team's at the left in the strip's blue, the enemy's at the right, filled at the reveal; an empty frame while a ban is to come, the ban mark when it was none) from planning to the lock in, so the grid never moves (its slots take a width, not a flex basis, or each ban that fills in resizes them all; the header's title keeps two lines' height, since some turns' titles wrap). For the few seconds the client reveals the bans (`bans-revealed`) they cover the grid big, a row of five per team (`BansReveal`, fits a 375x667 phone without a scroll), and the grid fades back under them with its search kept (`ChampionPanel` stacks both and keeps the grid mounted). A declared champion that gets banned is no intent anymore: `deriveChampSelectState` drops it from the team (no recording shows whether the LCU clears it) and the hook's selection skips banned champions. A ban starts empty (never the player's declared pick); banning a champion someone on the team declared asks first with the client's ban-intent dialog (`readBanIntent`, `BanIntentModal`), and where the session sets `disallowBanningTeammateHoveredChampions` (the recorded Normal Draft does) an ally's declared champion can't be banned: CONFIRM stays disabled and a tap toasts the client's tooltip.
- **Top bar:** only the dashboard shows the logo (`TopBar` `title`, beside the back arrow when there is one); other screens keep that room. The lobby's mode title sits in the bar beside the back arrow (Heading 2, a second line rather than an ellipsis for a long queue name). Champ select has no top bar: its `ChatButton` (the bar's, on its own) sits at the end of the timer row, whose bar narrows to leave it the same room at its start.
- **Champion grid position filter:** `ChampionGrid` (champ select and Swift Play) filters by lane like the client, with an iconOnly `Select` between the search and the sort, not in the Figma. The client matches its own play-rate table (embedded in the `rcp-fe-lol-champion-statistics` plugin) plus the champions favorited at that position; loom uses the closest LCU data, `/lol-perks/v1/recommended-champion-positions`. The sim answers it from a capture when it has one (`sim:capture` now asks for it), else from the bots' lanes and the drafts' pick pools.
- **Champ select trades and ARAM:** champion trades are one model for every mode: the session's `trades` (an entry per ally while picks and finalization run) drive the teams list's trade button (`AVAILABLE` asks, `SENT` is filled and takes the request back) and `ChampionTradeModal` (Figma 413:9473), which confirms the player's ask and answers an ally's `RECEIVED` one, through `POST /lol-champ-select/v1/session/champion-swaps/{id}/request|accept|decline|cancel` (`swapChampion`). The desktop client clears an ended swap on its own. ARAM's champion tab is `AramPanel` (Figma 336:17012): the subset list's cards as 101x181 `Tile`s with the loading-screen art, picked by a tap at once, since ARAM has no CONFIRM (the action PATCH with `completed: true`), grey once one is picked and a tap swaps back to one; the team bench under them (56px tiles, the player's own cards left out) opens in finalization through `bench/swap`.
- **Arena:** detected by the queue's `gameMode` `CHERRY` (`gameQueuesDescriptor`, since the champ select session has none and each variant comes with a new queue id), never by `pickMode`. The lobby is the client's multiteam lobby (`LobbySubteams`): its team size and count come from `features/modes/multiteam-lobby.ts`, a copy of the client's `QUEUE_ID_TO_MULTITEAM_LOBBY_CONFIG` (refresh it when a new Arena variant ships), and moving to another team is `PUT /lol-lobby/v2/lobby/subteamData`. In champ select every player is in `myTeam`, in consecutive cells per team: `deriveChampSelectState(session, subteamSize)` keeps the local player's team as `team` and the rest as `enemyTeam`, which the team strip groups under the client's team icons (`features/champ-select/arena.ts`, `GAME_MODES_WITH_SUBTEAMS` in `rcp-fe-lol-champ-select`). The grid lists only `pickable-champion-ids` (Arena de Valentía deals five), with Valentía (`BRAVERY_CHAMPION_ID` -3, which the client adds itself and the LCU never lists) first; locked, it shows its splash instead of the skins. No runes or wards; spells filter by the queue's game mode.
- **Custom games:** a lobby with `gameConfig.isCustom` (custom games and the Practice Tool) draws `CustomLobby` (Figma "Personalizada" 451:22600) instead of the party, from `lobbySessionDescriptor`'s `custom` (`core/lcu/parsers/custom-lobby.ts`: `customTeam100/200`, bots included). It follows the client's `rcp-fe-lol-parties`: the title's line is the map (by `mapId` and `gameMode`), team size and `customMutatorName`; JOIN is `POST /lol-lobby/v2/lobby/team/TEAM1|TEAM2`; ADD BOT picks like the client (`pickCustomBot`: a champion from `available-bots` for a lane no bot of the team plays, per `/lol-perks/v1/recommended-champion-positions`, at `RSINTERMEDIATE`) and posts it with a fresh `botUuid`; the local player's lane (Summoner's Rift only, the kit's `Select iconOnly`) is `PUT /lol-lobby/v1/lobby/members/localMember/position-preferences` with FILL second; START GAME is `POST /lol-lobby/v1/lobby/custom/start-champ-select`. Only checked in the sim so far.
- **Party owner tools:** the Figma draws none, so they copy the client's context menu on a party member (`rcp-fe-lol-parties`): the owner's second tap on another member in the carousel opens `LobbyMemberSheet` with Promote to party owner, Kick player from party (which asks with the client's dialog, `LobbyKickModal`) and Grant / Revoke Invites (`allowedInviteOthers`), none of them while searching (`showPartyOwnerTools`). A kicked player gets the client's alert (`KickedModal`, in the connected layout) from the newest `/lol-lobby/v2/notifications` entry with `notificationReason` `KICKED`, deleted once shown as the client does; the desktop client deletes it too, so it's watched as events, not a query.
- **Connection lost:** once paired, a session that drops stays: `RelayClient` reconnects on its own after its first handshake (backoff up to 5s) unless the relay refuses it for good (`isFatalRelayClientState`: invalid code or token, denied device, expired session), and `useGlobalSessionReconnect` turns the relay store's status to `lost` instead of ending the session; a fatal refusal still ends it on the connect screen. `ConnectionLostModal` (Figma Errors 451:38940, in the connected layout) says why: `lostReason` `client-closed` when Conduit sent `MobileOpcode.CLIENT_CLOSED` (10) just before leaving the relay (its lockfile disappeared), `pc` otherwise, and "No Internet Connection" with the error icon while TanStack's `onlineManager` is offline. CLOSE drops the LCU cache and goes to the dashboard, DISCONNECTED with CREATE NEW LOBBY disabled; when the client is back `useLcuCacheClear` refetches the LCU queries and the gameflow navigation, reset by the empty phase, takes the screens where the client is. The sim panel's Conduit row drops the PC, closes the client or brings it back.
- **Valibot:** Use Valibot for validating all external data (API responses, route params, search params). Prefer explicit validation over type assertions.
- **LCU schema contracts:** Every LCU wire schema gets a `*SchemaContract` against its generated `LCUTypes` type (`core/lcu/parsers/schema-contract.ts`). Fields the generated schema lacks go in the allowed list with a one-line reason; prefer fixing the schema to allowlisting.
- **Scrolling:** Lists and panels scroll with `ScrollArea` from `@shoma/ui/scroll-area` (Base UI). A few boxes (the sheets, Select Position, the connected outlet) scroll natively; `styles.css` gives them a thin scrollbar close to ScrollArea's.

### Testing

- **Naming:** Use the `-test.ts` or `-test.tsx` suffix for test files.
- **Colocation:** Colocate tests with the source code when possible, except for routes where it might interfere with routing.
- **Behavioral Testing:** Prefer tests that validate real behavior over implementation details. Mock only when necessary (network, storage, timers, browser APIs).

## EXCEPTIONS

- **`routeTree.gen.ts`:** This file is auto-generated by TanStack Router and is exempt from `no-explicit-any` and other lint rules.
- **Zustand `create`:** Arrow functions are allowed within the `create((set) => ({...}))` call as it is the idiomatic API.
- **`as const`:** Allowed for constant literal objects to enable literal typing (replaces `enum`).
- **Test Mocks:** Browser API mocks in test files may use broader types where strictness is impractical.

## QUALITY CHECKS

Before finishing any task, you must run and pass the following checks:

```bash
pnpm --filter @shoma/loom typecheck
pnpm --filter @shoma/loom lint
pnpm --filter @shoma/loom test
pnpm --filter @shoma/loom build
pnpm --filter @shoma/loom fmt
```

## DEBUGGING

- **Debug logs:** Append `?debug=true` to the URL to activate `[Mimic]` debug logs (LCU requests/responses, relay frames).
- **Browser logs in terminal:** The Vite dev server console surfaces browser console output, so these logs are readable without opening devtools.
- **Navigation and loaders:** TanStack Router changes the URL first, then keeps rendering the previous route until the next route's `loader` resolves (the lobby's waits on ~10 LCU queries over the relay). A screen that navigates away has to keep its pending UI while it's still mounted (see `isConnectionPending`), and a check by `location.pathname` won't catch it.
- **Connected screens without a client:** use the simulator below. `__shomaMockLcu(alias, data)` (`core/relay/lcu-mock-dev.ts`) still seeds a single query's cache from the console.

## SIMULATOR

`http://localhost:5176/?sim` runs loom against a simulated client instead of the relay; it pairs on its own and stays on across reloads until `?sim=0`.

- **Seam:** `src/sim/install-sim.tsx` runs before the first render (from `main.tsx`, dev only) and swaps the `WebSocket` of URLs ending in `/mobile` for `SimRelay` (`sim-relay.ts`), which does leyline's and Conduit's part: the RSA/AES handshake, the approval, mobile frames, and one-way latency. Everything above the socket (`RelayClient`, `LcuTransport`, observers, route loaders) is the real code.
- **World:** `SimWorld` (`sim-world.ts`, pure, tested in `sim-world-test.ts`) keeps what loom changes (lobby, Swift Play slots and ready, positions, queue, ready check, sent and received invitations, rune pages, join codes) and pushes each changed path as an LCU event. Social (`sim-social.ts`): chats opened and written from loom, each 1:1 answered by the friend 1.5 s later, counted unread unless it's the active conversation; a friend writing first (panel "Me escriben"); a Clash team to join (panel "Equipo de Clash", since the account has none to capture) whose four teammates answer in its group chat; friend requests by Riot ID or Recently Played puuid; the friend list's settings (offline and Riot Mobile grouped until a capture has the client's own); and up to two offline friends per group brought online (in game, champ select, queue, lobby, online, away), since the capture has nearly everyone offline. Champ select (`sim-champ-select.ts`, tested in `sim-champ-select-test.ts`) follows a recorded Normal Draft: PLANNING 12 s, simultaneous bans 25 s with the other team's hidden until the 6.4 s reveal (whose 31.4 s timer runs on into the first pick unrefreshed, as the LCU sends it), 25 s pick turns, FINALIZATION 30 s, GAME_STARTING 2 s, then gameflow `GameStart` → `InProgress` with the lobby gone. Bots hover and lock in their turns; the local player's action PATCH, `/complete` and `my-selection` change the session; at the deadline a hover locks, and a pick with nothing hovered dodges back to the lobby. Swift Play (queue `pickMode` `''`) skips it like the client: `skipChampionSelect` in GAME_STARTING for 2 s. ARAM (`AllRandomPickStrategy`, from recorded ARAM: Mayhem games) has no planning and no rerolls: each player gets 2 cards, 3 with the blessing (`/lol-lobby-team-builder/champ-select/v1/subset-champion-list`), and picks one in a simultaneous BAN_PICK that always runs its 15 s; a card tap is the action PATCH with `completed: true`, as the client sends it. The cards not picked go to the team's `benchChampions`, `POST /lol-champ-select/v1/session/bench/swap/{id}` puts the player's champion in the slot it takes (only their own other cards during BAN_PICK), bots swap in the 30 s FINALIZATION, and the other team's champions stay at 0. Champion trades work in draft and ARAM alike: `trades` lists each ally in BAN_PICK and FINALIZATION, `AVAILABLE` once both have a champion and `INVALID` for the rest while one waits; `POST /lol-champ-select/v1/session/champion-swaps/{id}/request|accept|decline|cancel` drives `/lol-champ-select/v1/ongoing-champion-swap`. A bot answers a request in a few seconds or never, and then the sim does what the desktop client does on its own (`SWAP_SERVICE_CALL_TIMEOUTS` in `rcp-fe-lol-champ-select`): cancel at 15 s, as in the recorded one, and `POST .../ongoing-champion-swap/{id}/clear` 1.7 s after it ends (200 ms once accepted). Pick-order and position swaps aren't modeled. Arena (`gameMode` `CHERRY`, from a recorded Arena de Valentía, 1740) is one 40 s BAN_PICK for all 18 cells with no bans, other teams' cells sent as 0 and hidden, trades always `INVALID`, spells 2201/2202 and, in Valentía, the 5 dealt champions as `pickable-champion-ids`; what follows the pick wasn't recorded, so it goes to GAME_STARTING like the draft. Blind runs the draft until recorded. `/liveclientdata/gamestats` counts the game time. Other GETs come from captures; an id with no capture takes the capture of the same path shape (champion 7's recommendations answer with champion 1's). PUT/PATCH on paths it doesn't model are stored and answered back. Its state survives a reload in sessionStorage.
- **Data:** `loom/.sim/captures.json`, git-ignored (it has the account's name, friends and chats). `pnpm run sim:capture -- [ssh options] user@host` reads it with GETs from a Windows PC running the client. Behavior comes from recordings: `scripts/record-lcu-events.ts` runs with bun on the PC and writes the client's lobby-to-game events as JSONL to `%USERPROFILE%\shoma-recordings` (names included, so outside the repo; copies go in `loom/.sim/recordings/`).
- **Panel:** the `SIM · <phase>` pill opens it: members, their party ready, invitations, pop the match, a stranger declining, someone dodging champ select (back into the queue), jumping to a Reclutamiento champ select at planning, the local ban, the local pick or finalization (`world.jumpToChampSelect(target)`, played on a fast clock) or to an ARAM one at its cards or its bench (`world.jumpToChampSelect(target, ARAM_QUEUE_ID)`), or to an Arena one per captured Arena queue (`world.arenaQueues`), the owner kicking the local player ("Me expulsan", with the `KICKED` notification shaped as the generated schema, since no recording has one), an ally asking the local player for a champion trade, ending the game and Play Again, latency, approval by hand (forgets devices, so the next pairing waits), and reset. `globalThis.__shomaSim` is the same relay for the console and agent-browser (`__shomaSim.world.request(...)`, `.popMatch()`). Code `000000` gets the relay's `invalid_code`.
- **Fidelity:** copy the LCU's behavior, not loom's reading of it. Check how the client does it in its plugin JS (root `AGENTS.md`). The ready check's `timer` is seconds since the pop, which is how `use-ready-check.ts` was found counting it as seconds left.

## DOCUMENTATION MAINTENANCE

- **Sync Rule:** When a convention or architectural decision changes, you must update both the root `CONTEXT.md` and this `AGENTS.md` file.
- **Manual Source of Truth:** The `pnpm run agents:update` script is currently a placeholder. Manual edits to this file are the primary source of truth.
