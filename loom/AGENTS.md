# loom KNOWLEDGE BASE

**Generated:** 2026-05-24

## OVERVIEW

Next-gen mobile web UI for Sho'ma. Built with React 19, TanStack Router, and Tailwind v4. Legacy version lives in `legacy/web/`.

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
│   ├── components/ui/        # shadcn/ui primitives (from design-system)
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
  - `-styles.ts` (or `styles.ts` in a subfolder) for Tailwind variant definitions.
- **Props naming:** Use `props: ComponentNameProps` for component parameters. Declare the type outside the component and avoid complex inline types.

### Styling

- **Tailwind Variants:** Use `tailwind-variants` with `slots` for all component styling.
- **No long inline strings:** Do not use Tailwind strings longer than 80 characters or complex combinations directly in JSX. Extract them to a `-styles.ts` file.
- **Typed styles:** Ensure styles and variants are correctly typed when using `tailwind-variants`.

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
- **React Query:** Use TanStack Query for all server state, fetching, caching, and mutations. Manual `useEffect` fetching is prohibited. Keep query keys typed and consistent.
- **Valibot:** Use Valibot for validating all external data (API responses, route params, search params). Prefer explicit validation over type assertions.
- **LCU schema contracts:** Every LCU wire schema gets a `*SchemaContract` against its generated `LCUTypes` type (`core/lcu/parsers/schema-contract.ts`). Fields the generated schema lacks go in the allowed list with a one-line reason; prefer fixing the schema to allowlisting.
- **ScrollArea:** Every scrollable container must use the `ScrollArea` component from `@/components/ui` (Radix overlay scrollbar). Never use `overflow-y-auto`/`overflow-y-scroll` for app UI scrolling; the only accepted exception is cases where the Radix viewport wrapper breaks the layout (e.g. `flex-col-reverse`), which must be noted in a comment.

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
- **World:** `SimWorld` (`sim-world.ts`, pure, tested in `sim-world-test.ts`) keeps what loom changes (lobby, Swift Play slots and ready, positions, queue, ready check, sent and received invitations, rune pages, join codes) and pushes each changed path as an LCU event. Social (`sim-social.ts`): chats opened and written from loom, each 1:1 answered by the friend 1.5 s later; friend requests by Riot ID or Recently Played puuid; and up to two offline friends per group brought online (in game, champ select, queue, lobby, online, away), since the capture has nearly everyone offline. Champ select (`sim-champ-select.ts`, tested in `sim-champ-select-test.ts`) follows a recorded Normal Draft: PLANNING 12 s, simultaneous bans 25 s with the other team's hidden until the 6.4 s reveal (whose 31.4 s timer runs on into the first pick unrefreshed, as the LCU sends it), 25 s pick turns, FINALIZATION 30 s, GAME_STARTING 2 s, then gameflow `GameStart` → `InProgress` with the lobby gone. Bots hover and lock in their turns; the local player's action PATCH, `/complete` and `my-selection` change the session; at the deadline a hover locks, and a pick with nothing hovered dodges back to the lobby. Swift Play (queue `pickMode` `''`) skips it like the client: `skipChampionSelect` in GAME_STARTING for 2 s. Blind and ARAM run the draft until recorded. `/liveclientdata/gamestats` counts the game time. Other GETs come from captures; an id with no capture takes the capture of the same path shape (champion 7's recommendations answer with champion 1's). PUT/PATCH on paths it doesn't model are stored and answered back. Its state survives a reload in sessionStorage.
- **Data:** `loom/.sim/captures.json`, git-ignored (it has the account's name, friends and chats). `pnpm run sim:capture -- [ssh options] user@host` reads it with GETs from a Windows PC running the client. Behavior comes from recordings: `scripts/record-lcu-events.ts` runs with bun on the PC and writes the client's lobby-to-game events as JSONL to `%USERPROFILE%\shoma-recordings` (names included, so outside the repo; copies go in `loom/.sim/recordings/`).
- **Panel:** the `SIM · <phase>` pill opens it: members, their party ready, invitations, pop the match, a stranger declining, someone dodging champ select (back into the queue), jumping to a Reclutamiento champ select at planning, the local ban, the local pick or finalization (`world.jumpToChampSelect(target)`, played on a fast clock), ending the game and Play Again, latency, approval by hand (forgets devices, so the next pairing waits), and reset. `globalThis.__shomaSim` is the same relay for the console and agent-browser (`__shomaSim.world.request(...)`, `.popMatch()`). Code `000000` gets the relay's `invalid_code`.
- **Fidelity:** copy the LCU's behavior, not loom's reading of it. Check how the client does it in its plugin JS (root `AGENTS.md`). The ready check's `timer` is seconds since the pop, which is how `use-ready-check.ts` was found counting it as seconds left.

## DOCUMENTATION MAINTENANCE

- **Sync Rule:** When a convention or architectural decision changes, you must update both the root `CONTEXT.md` and this `AGENTS.md` file.
- **Manual Source of Truth:** The `pnpm run agents:update` script is currently a placeholder. Manual edits to this file are the primary source of truth.
