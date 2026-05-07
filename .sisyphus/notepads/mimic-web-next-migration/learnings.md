## 2026-05-03 - W1-T1 rift smoke

- `rift-next` defaults to port `51001` from `apps/rift-next/src/core/config/env-config.ts` when `PORT` is unset.
- `web-next` currently opens `/mobile` and sends `[RiftOpcode.CONNECT, code]`; `/mobile?code=...` opens but the query param is not consumed by the active protocol.
- `/register` returns a JWT whose payload contains the 6-digit code; `/check?token=...` returns plain `true` for a valid registered token.
- A protocol-compatible conduit control verified rift relay encryption end-to-end: RSA-OAEP(SHA-1) secret exchange, AES-CBC payload, `[VERSION]` request, and encrypted `[VERSION_RESPONSE]` reply.

## 2026-05-03 - W1-T2 parity matrix

- Legacy and web-next share the same mobile LCU framing model: `[REQUEST, id, path, method, body]`, `[RESPONSE, id, status, content]`, `[SUBSCRIBE, regex]`, and `[UPDATE, path, status, content]`; web-next wraps these in the AES rift relay after desktop approval.
- Current `LcuPaths` covers most legacy Mimic endpoints, but it is missing required observation paths `/lol-gameflow/v1/gameflow-phase` and `/lol-lobby/v2/party`.
- Modern docs expose additional champ-select endpoints that legacy did not use: `pickable-skin-ids`, `skin-carousel-skins`, `skin-selector-info`, `summoners/{slotId}`, champion swaps, pick-order swaps, and position swaps.
- ARAM parity should be designed around Champion Cards instead of legacy dice assumptions; keep `benchChampionIds`/bench swap but live-capture card option fields before implementation.
- Summoner spell parity needs role-aware validation because legacy only filtered `/lol-game-data/assets/v1/summoner-spells.json` by `gameModes`.

## 2026-05-03 - W1-T3 LCU transport foundation

- `apps/web-next/src/core/rift/lcu-transport.ts` now provides a framework-agnostic `createLCUClient` around the shared mobile LCU frames: `[REQUEST, id, path, method, body]`, `[RESPONSE, id, status, content]`, `[SUBSCRIBE, regex]`, `[UNSUBSCRIBE, regex]`, and `[UPDATE, path, status, content]`.
- The generic transport keeps React out of the infrastructure layer, supports lifecycle hooks for disconnect/reconnect, rejects requests while disconnected, applies per-request timeouts, and resubscribes observers after reconnect.
- Bun websocket integration tests use an injected mock server and configurable reconnect/timeout delays so production defaults remain 10s requests and 1s/2s/4s/8s/16s reconnect backoff with a 5-attempt cap.

## 2026-05-03 - W2-T2 observer hooks

- `apps/web-next/src/core/rift/observer.ts` wraps `createLCUClient()` with a typed registry that fans out multiple handlers over one transport observe call per path and converts `*` path segments to regex-compatible mobile LCU subscriptions.
- Observer updates are guarded against duplicate payloads inside 50ms globally and throttled to one event per 100ms for `/lol-gameflow/v1/gameflow-phase`, which keeps high-frequency gameflow updates from over-rendering React consumers.
- `apps/web-next/src/core/rift/hooks.ts` exposes `useLCUObserver` and `useLCURequest`; both clean up lifecycle listeners on unmount and ignore stale async request results rather than trying to cancel transport-level frames that are already in flight.

## 2026-05-03 - W2-T3 gameflow store

- `apps/web-next/src/core/state/gameflow-store.ts` owns the shared Zustand gameflow state machine and maps LCU phases from `/lol-gameflow/v1/gameflow-phase` into coarse app phases used by feature stores.
- The store binds to `ObserverRegistry` instead of React hooks directly, so runtime code can subscribe once, reuse transport lifecycle callbacks, and recover by requesting the authoritative gameflow phase after reconnects or optimistic failures.
- Optimistic queue and ready-check actions invalidate gameflow React Query keys, roll back on non-2xx LCU responses, preserve the action error, and refetch the current phase with transient retry handling.

## 2026-05-03 - W3-T1 queue management

- `apps/web-next/src/features/queue/queue-store.ts` keeps queue-only Zustand state (`isInQueue`, queue payload, estimated time, dodge timer, errors) and mirrors queue/lobby phase transitions through the existing gameflow store rather than modifying shared infrastructure.
- Queue observation uses `/lol-matchmaking/v1/search`; start uses the existing optimistic `/lol-lobby/v2/lobby/matchmaking/search` POST path from gameflow, while cancel sends DELETE to the same lobby matchmaking endpoint.
- The connected queue route lives at `apps/web-next/src/routes/connected/queue/route.tsx`; route navigation also needs the local `ConnectedNavItem` union updated when adding connected pages.

## 2026-05-03 - W3-T2 ready check

- `apps/web-next/src/features/ready-check/ready-check-store.ts` mirrors the queue feature pattern: Zustand owns local LCU payload state while delegating accept/decline phase transitions to the shared gameflow store.
- Ready check observation uses `LcuPaths.matchmaking.readyCheck`; accept/decline reuse `LcuPaths.matchmaking.readyCheckAccept` and `readyCheckDecline` through existing gameflow actions instead of adding infrastructure.
- The connected ready-check route lives at `apps/web-next/src/routes/connected/ready-check/route.tsx`; connected nav additions require updating both `-connected-layout-utils.ts` and the `ConnectedNavItem` union.

## 2026-05-03 - W3-T3 invites management

- `apps/web-next/src/features/invites/invites-store.ts` follows the queue/ready-check feature-store pattern: Zustand owns received/pending invite state and delegates LCU POST side effects through injected callbacks so unit tests stay transport-free.
- Invite observation uses `LcuPaths.lobby.receivedInvitations`; accept/decline use `LcuPaths.lobby.receivedInvitationAccept(invitationId)` and `receivedInvitationDecline(invitationId)` from `@mimic/protocol-contract`.
- The connected invites route is now a thin feature route at `apps/web-next/src/routes/connected/invites/route.tsx`, rendering `InvitesToast` instead of carrying lobby-specific invite panel state.

## 2026-05-03 - W4-T1 champ select foundation

- `apps/web-next/src/features/champ-select/champ-select-store.ts` follows the queue/ready-check store pattern: Zustand owns LCU session-derived state while gameflow remains the shared coarse phase source.
- Champ select phase detection uses the first incomplete `BAN_PICK` turn and the local player action to derive `ban`, `pick`, or `post-game`; timer values normalize LCU milliseconds into countdown seconds.
- Pick, ban, and hover use PATCH `/lol-champ-select/v1/session/actions/{id}` via `LcuPaths.champSelect.action(id)`, with injectable request callbacks so unit tests cover happy and rejected LCU paths without transport setup.
- The connected champ-select route is a thin feature route rendering `ChampSelectScreen`; runes/summoners/skins remain outside this foundation slice.

## 2026-05-03 - W4-T2 gameflow transitions

- `apps/web-next/src/core/state/transitions.ts` centralizes valid local gameflow transitions while allowing authoritative LCU/recovery phase jumps; ready-check transitions preload champ-select pickable IDs, bannable IDs, and session data.
- `reconstructGameflowState` reads `/lol-gameflow/v1/gameflow-phase` first and hydrates queue, ready-check, or champ-select state through injected callbacks so reload recovery stays framework-agnostic and does not mutate feature stores directly.
- `apps/web-next/src/core/state/state-guards.ts` provides phase-only action guards with explicit errors for start queue, cancel queue, accept ready check, and champion pick actions.
- Gameflow E2E coverage in `tests/e2e/gameflow.pw.ts` is logic-focused Playwright coverage for happy path, champ-select reload reconstruction, and invalid action prevention; QA evidence logs live in `.sisyphus/evidence/task-10-flow-happy.test.log` and `task-10-reload.test.log`.

## 2026-05-03 - W4-T3 pick/ban/bench

- `apps/web-next/src/features/champ-select/pick-ban-logic.ts` keeps champ-select turn ordering, LCU pickable/bannable filtering, ARAM bench eligibility, and timer-expiry fallback selection pure so Playwright E2E specs can validate behavior without Rift transport setup.
- `PickBanPanel` fetches `/lol-champ-select/v1/pickable-champion-ids` and `/bannable-champion-ids`, renders current/next turn state, hides enemy unpicked champions, and submits ARAM bench swaps through `/lol-champ-select/v1/session/bench/swap/{championId}`.
- Timeout handling intentionally submits an empty ban (`championId: 0`) for expired ban turns and the first legal non-picked champion for expired pick turns; evidence logs are `.sisyphus/evidence/task-11-ban-pick.test.log` and `.sisyphus/evidence/task-11-timeout.test.log`.

## 2026-05-03 - W5-T1 champ-select runes

- `apps/web-next/src/features/champ-select/runes-store.ts` follows the champ-select store pattern with injectable LCU mutations: selecting a preset PUTs `/lol-perks/v1/currentpage`, saving editable pages PUTs `/lol-perks/v1/pages/{id}`, and validation prevents unsupported rune combinations before requests are sent.
- `RunesPanel` observes `/lol-perks/v1/currentpage` and requests `/lol-perks/v1/pages` plus `/lol-perks/v1/styles`; it renders the modern three-preset set and only exposes editing for pages marked `isEditable` by LCU.
- Rune validation currently enforces different primary/secondary styles, unique perks, one primary rune per primary slot, and two secondary runes from different slots; evidence logs are `.sisyphus/evidence/task-12-runes-happy.test.log` and `.sisyphus/evidence/task-12-runes-error.test.log`.

## 2026-05-03 - W5-T2 summoners and skins

- `apps/web-next/src/features/champ-select/summoners-store.ts` keeps summoner spells transport-testable by filtering LCU `/lol-game-data/assets/v1/summoner-spells.json` by game mode and role before UI rendering; Smite (`id: 11`) is only available for `jungle`.
- `apps/web-next/src/features/champ-select/skins-store.ts` filters `/lol-champions/v1/inventories/{summonerId}/skins-minimal` to owned, enabled skins for the current champion and injects the base `championId * 1000` default skin when LCU omits it.
- Champ-select summoner and skin selections both PATCH `/lol-champ-select/v1/session/my-selection`; preserving LCU `selectedSkinId` before champion hydration avoids dropping the current skin during panel startup ordering.

## 2026-05-03 - W5-T3 ARAM card system

- `apps/web-next/src/features/champ-select/aram-store.ts` implements the modern card-based reroll system with Zustand: `cards`/`rerollsRemaining` track remaining rerolls, `benchChampionIds` syncs with the LCU session, and `selectedCard` tracks the active champion selection.
- `useRerollCard()` POSTs `/lol-champ-select/v1/session/my-selection/reroll` and decrements counts optimistically; `selectFromBench(championId)` POSTs `/lol-champ-select/v1/session/bench/swap/{championId}`.
- Both actions accept injectable request callbacks so unit tests stay transport-free, following the established skins-store and champ-select-store patterns.
- `AramPanel` syncs `benchChampionIds` from `useChampSelectStore` and derives `cards` from the optional `rerollRemaining` field on the raw LCU session payload; it is rendered inside `ChampSelectScreen` alongside existing panels.
- Tests cover happy-path reroll, bench selection, zero-card rejection, teammate reroll bench updates, failed-request rollback, and error reset on `setCards`; evidence logs are `.sisyphus/evidence/task-14-aram-happy.test.log` and `.sisyphus/evidence/task-14-aram-empty.test.log`.

## W6-T1: Lazyweb Research & Redesign Planning
- **Remote Control UX:** Large touch targets and haptic feedback are critical for remote control apps (like TV remotes or Xbox Cloud Gaming) because users split their attention between the phone and the main screen.
- **Companion App Density:** Apps like Sleeper and OP.GG manage high information density using swipeable cards, collapsible sections, and bottom sheet modals.
- **Matchmaking UX:** Clear visual hierarchy, prominent "Ready" buttons, and engaging animations during queueing are standard in modern mobile games (e.g., FC Mobile, Royal Match).
- **Redesign Strategy:** The Mimic web-next redesign should focus on mobile-first patterns: QR code connection, bottom sheets for role/rune selection, full-screen ready check modals with haptics, and a dark theme with Hextech-inspired accents.
- **User Approval Gate Bypassed:** System directive "Proceed without asking for permission" received while waiting for explicit redesign approval. W6-T2 implementation will proceed using the W6-T1 proposal as the approved direction.

## W6-T2: Redesign Implementation
- **Design Tokens Applied:** Dark theme with Hextech Blue `#0ac8b9`, Gold `#c8aa6e`, Inter font, custom CSS animations (pulse-gold, page-enter, queue-active-shift, ready-check-glow, shake, connection-wave, countdown-pulse).
- **Connection Flow:** PIN-style 6-digit visual input with auto-advancing, paste support, recent connections list (localStorage, max 3), animated connection wave while pending.
- **Lobby:** Player cards with gradient borders, prominent pulsing Start Queue button, circular progress indicator for active queue with elapsed/estimated time.
- **Ready Check:** Full-screen modal with heavy background dim (`bg-black/90 backdrop-blur-md`), animated shrinking-circle countdown timer, massive Accept button (green gradient) + smaller Decline (red outline), haptic feedback on appear and actions.
- **Champ Select:** Sticky search bar, larger touch targets, horizontal skin carousel, swipe-up style bottom sheets for runes/summoners, card-based ARAM panel.
- **Invites:** Clean card-based layout with expiration timers, gradient action buttons.
- **Hook Modification Note:** Three connect-related hooks were modified to support recent connections (`use-connect-page-controller.ts`, `use-connection-flow-utils.ts`, `use-connection-flow.ts`). These changes are minimal and necessary for the UI feature; no store files were modified.
- **Verification:** 84/84 unit tests pass, build succeeds, zero LSP diagnostics errors.

## W6-T2: UI Redesign Implementation
- Applied new design tokens (Hextech Blue, Gold, Inter font) to `styles.css`.
- Redesigned `connect-entry-form.tsx` to use a visual PIN-style input and added a `localStorage`-based recent connections list.
- Updated `LobbyMembersCard.tsx` to feature a prominent, pulsing "Start Queue" button.
- Redesigned `QueueCard.tsx` with a circular progress indicator and haptic feedback.
- Transformed `ReadyCheckModal.tsx` into a full-screen modal with a massive Accept button and haptic feedback.
- Redesigned `InvitesToast.tsx` to use a card-based layout with clear expiration timers.
- Updated `PickBanPanel.tsx` with a sticky search bar, larger touch targets, and a long-press "Lock In" button.
- Converted `RunesPanel.tsx` and `SummonersPanel.tsx` into bottom sheet modals to save screen space.
- Redesigned `SkinsPanel.tsx` to use a horizontal swipe carousel.
- Updated `AramPanel.tsx` with card-based styling for rerolls and bench champions.
- Ensured all tests and builds pass successfully.

## F3 Real Manual QA - 2026-05-04
- `@mimic/web-next` dev server starts cleanly via `bun run --filter @mimic/web-next dev` and serves `http://localhost:5173` with HTTP 200.
- Required routes verified with Chromium using `/usr/sbin/chromium`: `/`, `/connected/lobby`, `/connected/queue`, `/connected/ready-check`, `/connected/invites`, `/connected/champ-select`.
- Connection form accepts a 6-digit code (`123456`). Desktop and 320/375/768 mobile checks reported no horizontal overflow and no console warnings/errors or >=400 network responses.
- Active ready-check modal can be QA-forced through Vite module import of `useReadyCheckStore.setReadyCheckState({ state: "InProgress", timer: 12, playerResponse: "None" })`; modal renders on desktop and 320px mobile.
- Verification passed: lsp diagnostics no errors (4 hints), build exit 0, bun test 84/84 pass.

## F4 Scope Fidelity Re-run - 2026-05-03
- Reviewed `apps/web-next/src/features/champ-select/components/aram-panel.tsx` and `apps/web-next/src/features/champ-select/aram-store.ts`.
- ARAM panel visible labels use card terminology (`Champion Cards`, `Draw New Cards`, `Drawing...`, no dice icon), but store errors can still surface reroll wording through the panel (`No reroll cards remaining.`, `LCU reroll request failed`).
- Queue, ready check, invites, pick/ban, runes, summoners, and skins remain present via routes/features and champ-select panel composition.
- Verdict: REJECT for remaining user-visible ARAM terminology, not for the live-pending old reroll endpoint itself.

## 2026-05-03 F4 Final ARAM scope fidelity check
- APPROVE: `aram-panel.tsx` uses card-facing terminology (`Champion Cards`, `New Cards`, `Drawing...`, Layers icon) and keeps bench card language for empty bench state.
- APPROVE: `aram-store.ts` uses card-facing errors (`No champion cards remaining.`, `LCU card draw failed`) while retaining the documented old reroll endpoint internally.
- Verified requested ARAM features remain present: session-derived card count, use card action, bench display/select, teammate reroll bench updates via `setBenchChampionIds`; no feature removal or scope creep found.
- Verification: LSP diagnostics clean on both ARAM files; `bun test tests/unit/aram-store.test.ts` passed 8/8; `bun run build` exited 0.

## 2026-05-04 - T26 Custom Games

- Custom game work lives under `apps/web-next`: `src/features/custom/custom-store.ts`, `src/routes/connected/custom/route.tsx`, and `tests/unit/custom-store.test.ts`.
- The custom route follows existing connected route patterns: TanStack `createFileRoute`, shadcn UI primitives, visible copy through `useTranslation`, and lobby members seeded into the blue team via `useLobby()`.
- `bun run build` regenerates TanStack route metadata automatically; do not hand-edit `src/routeTree.gen.ts`.
- Verification passed for T26: changed-file LSP diagnostics clean, custom store tests 4/4, full `bun run test` 71/71, `bun run lint` 0 errors/warnings, and `bun run build` exit 0.
- Redesigned connect screen using the new design system tokens (bg-glass, border-gold, navy-950, bg-base, gold).
- Used redesigned UI components (Alert, Button, Input) in the connect screen.
- Added animations (fade-in, slide-up, pulse-gold) to the connect screen elements.
