# Architectural Deepening Opportunities

**Generated:** 2026-05-22
**Scope:** Next-gen packages (`loom/`, `leyline/`, `conduit/`, `packages/`)
**Method:** Deletion test + interface-as-test-surface analysis

---

## 1. `loom/src/features/lobby/hooks/use-lobby.ts` — The 545-line god hook

**Files:** `use-lobby.ts`, `lobby-store.ts`, `use-sticky-lobby-store.ts`, `lcu-queries.ts`, `lcu-mutations.ts`

**Problem:** One hook owns LCU Query orchestration, observer sync, Zustand sticky state, DDragon asset enrichment, permission derivation, local pending-action refs, mutation wiring, and error mapping. The interface it presents to `Lobby` route components is a single giant bag of derived values and callbacks. Tests were removed because the seam is too wide — mocking React Query, Zustand, transport, and observers simultaneously is not testing the hook; it's bypassing its dependencies.

**Deletion test:** Deleting `use-lobby.ts` would not concentrate complexity — it would explode across every route component that currently imports it. That means the hook *is* earning its keep, but its interface is nearly as complex as its body. It's **shallow** despite being large.

**Solution:** Split the seam into a **Lobby view-model** (derived state + action intents) and a **Lobby transport coordinator** (Query/observer/mutation wiring). The route component should consume a small view-model interface; the coordinator should live behind it.

**Benefits:**
- **Locality:** Lobby business rules (who can kick, what mode allows what) concentrate in one place.
- **Leverage:** One view-model interface serves the route, tests, and any future lobby variant (swiftplay, custom).
- **Tests:** The view-model becomes testable with plain data; the coordinator becomes testable with a fake `LcuTransport`.

---

## 2. `loom/src/routes/connected/*/route.tsx` — Route components as accidental feature modules

**Files:** `swiftplay/route.tsx`, `lobby/route.tsx`, `champ-select/route.tsx`, `create-lobby/route.tsx`

**Problem:** Page routes contain domain transforms (building LCU player-slots bodies), CDN asset resolution, form construction, local UI helpers, and direct mutation/navigation wiring. TanStack Router owns file-based routing well, but the route files have absorbed feature logic that doesn't belong at the routing seam.

**Deletion test:** Deleting `swiftplay/route.tsx` would lose both routing declaration *and* feature logic. The latter should survive elsewhere.

**Solution:** Route components should own **layout + navigation intent only**. Domain transforms and submit logic move behind feature hooks. Routes pass intent callbacks down, not LCU path strings.

**Benefits:**
- **Locality:** Navigation policy lives at the route seam; game logic lives at the feature seam.
- **Leverage:** Feature hooks become reusable across routes (e.g., lobby logic shared by `lobby/route.tsx` and `swiftplay/route.tsx`).
- **Tests:** Route tests become layout/navigation smoke; feature tests run against plain hooks.

---

## 3. `loom/src/components/ui/*.tsx` — Shallow re-export shims

**Files:** `button.tsx`, `card.tsx`, `badge.tsx`, `alert.tsx`, `dropdown-menu.tsx`, `bottom-sheet.tsx`, `skeleton.tsx`, `spinner.tsx`, `input.tsx`

**Problem:** Nearly every file is a 2-line re-export of `@shoma/design-system`. They add an import indirection without adding Loom-specific behavior. If the goal is a façade, it should be one barrel file; if the goal is per-component adaptation, these aren't adapting anything.

**Deletion test:** Deleting any individual file moves complexity to a single import-line change in callers. No behavior is lost.

**Solution:** Either collapse to one `ui.ts` barrel that re-exports everything, or make the layer a **real adapter** — e.g., `loom-bottom-sheet.tsx` that adds mobile-safe swipe thresholds or PWA scroll-lock behavior that the shared `BottomSheet` doesn't know about.

**Benefits:**
- **Locality:** One place to update UI conventions, or none if there's no Loom-specific adaptation.
- **Leverage:** A real adapter justifies its existence; a pass-through doesn't.

---

## 4. `loom/src/features/champ-select/champ-select-store.ts` + `use-champ-select.ts` — Duplicated derived state

**Files:** `champ-select-store.ts`, `use-champ-select.ts`, `aram-store.ts`

**Problem:** Derived helpers (current action, phase detection, banned champions, owned skins filtering) exist in both the Zustand store and the consuming hook. The store also has a module-level `selectChampionForTurnHandler` — a global function that state actions depend on, but hook-installed runtime behavior provides. That's a seam leak: the store's interface assumes something about its caller.

**Deletion test:** Deleting the store would move derived state into the hook; deleting the hook would move UI orchestration into the store. Neither concentrates complexity well because the two are tightly coupled across a hidden dependency.

**Solution:** Make the **ChampSelect view-model** the single source of derived truth. The store holds raw LCU state; the view-model holds derived state + action intents. The hook wires them together but owns no derivation logic.

**Benefits:**
- **Locality:** Champ select rules (can I pick this? is this banned?) live in one module.
- **Tests:** View-model tests run with plain objects; store tests verify state transitions only.

---

## 5. `loom/src/core/lcu/lcu-mutations.ts` + `lcu-mutations.test.ts` — Poor seam forces module mocking

**Files:** `lcu-mutations.ts`, `lcu-mutations.test.ts`

**Problem:** The test mocks `react`, `@tanstack/react-query`, `@shoma/protocol-contract`, `./lcu-queries`, and even hardcodes an absolute filesystem path to a TanStack Query build artifact under `/home/josuegalre/projects/mimic/...`. This is not testing the public interface — it's reconstructing the module's environment because the real seam is too wide to test through.

**Deletion test:** Deleting `lcu-mutations.test.ts` doesn't matter; deleting `lcu-mutations.ts` would force every feature hook to inline mutation wiring. That *does* concentrate complexity badly, meaning the module earns its keep but its interface is wrong for testing.

**Solution:** Extract a **Mutation builder** seam that takes an `LcuTransport` and returns plain mutation configs (not React Query hooks). Feature hooks compose those configs into `useMutation`. Tests drive the builder with a fake transport, not by mocking React Query internals.

**Benefits:**
- **Locality:** Mutation policy (what path, what method, what invalidation) concentrates in the builder.
- **Tests:** No `mock.module` needed — the test surface is the builder's interface, not React's internals.

---

## 6. `leyline/src/index.ts` — The 495-line composition root

**Files:** `leyline/src/index.ts`

**Problem:** One file owns Elysia route registration, JWT signing/verification, HTTP program logic, Effect error mapping, websocket auth extraction, close-code mapping, database service wiring, realtime service construction, keepalive lifecycle, and server startup/shutdown. Changing any route behavior requires touching the composition root.

**Deletion test:** Deleting `index.ts` would destroy the entire application — not because it's deep, but because every seam was shoved into one file. Complexity doesn't concentrate; it was never distributed.

**Solution:** Split into three seams:
- **HTTP route handlers** — Elysia wiring + request/response shapes
- **HTTP programs** — business logic for `/register`, `/check`, etc.
- **Composition root** — wiring only, no business logic

**Benefits:**
- **Locality:** Route changes touch route files; business rule changes touch program files.
- **Tests:** Programs test through their interface (fake DB, fake JWT); route tests verify HTTP shape only.
- **Leverage:** One program interface reused across HTTP routes and future gRPC/CLI adapters.

---

## 7. `leyline/src/core/realtime/realtime-service.ts` — State machine + socket adapter + protocol codec + error policy

**Files:** `realtime-service.ts`, `realtime-schemas.ts`, `realtime-utils.ts`, `realtime-types.ts`

**Problem:** `makeRealtimeService` owns mutable connection maps, frame encoding, websocket side effects, relay business rules (CONNECT, SEND, OPEN, MSG, CLOSE), peer lifecycle, logging, keepalive fiber scheduling, and DB/auth dependency calls. Tests cover it well through fake sockets, but the domain transition logic (what happens when a mobile sends CONNECT) cannot be tested separately from socket send/close semantics.

**Deletion test:** Deleting the service would distribute relay logic across route handlers. That's worse, so the module earns its keep — but its interface is too wide.

**Solution:** Separate into:
- **Relay state machine** — pure transitions: given state + event → next state + effects
- **Socket adapter** — translates state machine effects into actual websocket sends/closes
- **Protocol codec** — frame parsing/encoding (already partially extracted into `realtime-schemas.ts`, but still coupled)

**Benefits:**
- **Locality:** Relay rules (can this mobile connect to this conduit?) live in the state machine.
- **Tests:** State machine tests run with plain data; socket adapter tests verify wire behavior.
- **Leverage:** The state machine could be reused in a future non-Elysia transport.

---

## 8. `leyline/src/core/config/env-config.ts` vs. `ConfigLayer` — Split config seam

**Files:** `env-config.ts`, `core/config/`, `index.ts`, `database-service.ts`, `logger-utils.ts`

**Problem:** `ConfigLayer` is tested and models invalid values as typed errors (e.g., `InvalidPortError`). But production code mostly reads a global `env` facade directly — `env.PORT` can throw synchronously, while `ConfigLayer` would model it as `Effect.fail`. This splits config into "Effect-configured" and "global getter" paths, weakening typed startup failure handling.

**Deletion test:** Deleting `env-config.ts` would force every consumer to inline `process.env` access. That would spread config knowledge across N modules. The module *should* earn its keep, but right now half the codebase bypasses it.

**Solution:** Make `env-config.ts` the **only** config seam. All modules read config through `ConfigLayer` or an Effect service. The global `env` object becomes an implementation detail of that layer.

**Benefits:**
- **Locality:** One place to change how config is validated and loaded.
- **Tests:** Config tests verify behavior; other tests provide config via `ConfigLayer` instead of mutating `process.env`.

---

## 9. `leyline/src/core/database/database.ts` — Pass-through compatibility module

**Files:** `database.ts`, `database-service.ts`

**Problem:** `database.ts` wraps `DatabaseService` methods (`generateCode`, `lookup`, `potentiallyUpdate`) without owning behavior. Its one transformation — `ConduitInstance` → DB row shape — is an adapter concern that preserves an older API shape. The file's own JSDoc says "Prefer using DatabaseService directly."

**Deletion test:** Deleting `database.ts` means updating a handful of imports to `database-service.ts`. No behavior is lost.

**Solution:** Delete it. If callers need the row-shaped API, that's an adapter concern at the caller's seam, not a separate module.

**Benefits:**
- **Locality:** Database behavior lives in one place.
- **Leverage:** Smaller interface surface for tests and callers.

---

## 10. `conduit/src-tauri/src/manager.rs` — God seam mixing business lifecycle with Tauri UI

**Files:** `manager.rs`, `main.rs`, `protocol.rs`, `mobile/*.rs`

**Problem:** `manager.rs` owns lockfile watching, LCU HTTP/WebSocket connection, Leyline registration, hub connection, reconnection policy, mobile peer factory, device approval UI, Tauri event emission, and notifications. It imports `tauri::{AppHandle, Emitter, Manager}` and `tauri_plugin_notification` directly. The business logic of *what to do when LCU connects* is inseparable from *how to show a tray notification*.

**Deletion test:** Deleting `manager.rs` would require rewriting almost all of Conduit's behavior, but much of that behavior is Tauri-specific. A non-Tauri build (headless, CLI, test) couldn't reuse it.

**Solution:** Extract a **Connection lifecycle** module that owns pure state transitions (LCU detected → registered → hub connected → peer attached). Tauri-specific concerns (tray, notifications, approval dialog) become **adapters** at that seam.

**Benefits:**
- **Locality:** Connection rules live in one module; UI adapters live at their own seam.
- **Tests:** The lifecycle module tests with fake timers and fake network adapters; Tauri tests verify UI emission only.
- **Leverage:** The lifecycle module could run in a headless test harness or a future non-Tauri build.

---

## 11. `packages/protocol-contract` — Protocol authority split between TS and Rust

**Files:** `packages/protocol-contract/src/index.ts`, `conduit/src-tauri/src/protocol.rs`

**Problem:** Opcode values (`RelayOpcode.OPEN = 1`, `MobileOpcode.SECRET = 1`, etc.) are defined in TS and manually mirrored in Rust. The TS contract has runtime tests for stability (`tests/opcodes.test.ts`), but Rust can silently drift. There is no single source of truth.

**Deletion test:** Deleting `protocol-contract` breaks `loom` and `leyline` immediately. `conduit` keeps compiling until runtime opcode mismatches cause silent failures. The module is high-leverage for TS, but its authority doesn't cross the Rust seam.

**Solution:** Make `protocol-contract` the **authoritative seam**. Either generate Rust constants from TS (or vice versa), or add Rust-side contract tests that assert parity. The shared package should be the only place opcode numbers change.

**Benefits:**
- **Locality:** One place to change protocol constants.
- **Leverage:** Every consumer (TS + Rust) stays in sync automatically.

---

## 12. `loom` feature stores with dead/no-op APIs

**Files:** `ready-check-store.ts`, `swiftplay-store.ts`, `champ-select-store.ts`, `lobby-store.ts`

**Problem:** Several Zustand stores expose APIs that are empty or unused: `validate()` is empty, `decrementTimer()` is compatibility-only, `ReadyCheckStore.timer/setTimer` appear unused because the timer is derived from Query + `useCountdown`. These APIs make stores look deeper than they are and increase test surface without runtime value.

**Deletion test:** Deleting the empty methods would not affect runtime behavior. That's the definition of shallow interface noise.

**Solution:** Audit each store: if an API has no callers, delete it. If a store is only used by tests/exports while runtime uses a different pattern (e.g., `useLobby()` vs `useLobbyStore`), resolve the split — either migrate runtime to the store or delete the unused store.

**Benefits:**
- **Locality:** Store interfaces match actual runtime needs.
- **Tests:** Test surface shrinks to real behavior.

---

## Test Coverage Summary

| Package | Tested modules | Coverage |
|---------|---------------|----------|
| `loom` | ~58 / 168 | **35%** |
| `leyline` | ~9 / 13 | **69%** |
| `conduit` | ~12 / 23 | **52%** (2/7 TS, 10/16 Rust) |
| `packages/protocol-contract` | ~2 / 5 | **40%** |
| `packages/design-system` | ~5 / 17 | **29%** |

**Strongest testability:** `leyline` (explicit seams: `RealtimeDependencies`, `RealtimeSocket`, `LoggerServiceShape`)
**Weakest testability:** `loom` feature hooks (god hooks), `conduit` TS frontend (Tauri coupling), `lcu-mutations.test.ts` (module mocking)

---

## Recommended Priority

1. **#1** (`use-lobby.ts` god hook) or **#6** (`leyline/src/index.ts` composition root) — widest interfaces, unlock most downstream testability
2. **#5** (`lcu-mutations` seam) — fixes brittle test pattern immediately
3. **#10** (`manager.rs` lifecycle extraction) — enables headless testing of Conduit
4. **#11** (`protocol-contract` authority) — prevents silent cross-runtime bugs
5. **#3** + **#9** (shallow re-exports / pass-through DB module) — quick wins, low risk
