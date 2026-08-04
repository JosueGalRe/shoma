# Backlog

Debt discovered and deferred during the 2026-07-31 maintenance session. Ordered by priority.
Each item lists context and pointers so a future session can pick it up cold.

## 1. Champ-select post-rewrite validation

The 2026-08-04 rewrite (React Query + domain derivations + real mutations, props-driven
components, no stores) is committed. Pending: validate in a real client — the Champion
Cards choice flow (`subset-champion-list` read path is wired; the card CHOICE mutation is
assumed to be the standard pick action, unverified), skin/spell `my-selection` PATCH, and
ARAM bench swap. Capture with `pnpm capture:lcu` if anything misbehaves.

## 2. De-slop tier medium-risk (needs caller analysis per case)

- **Leyline service shapes** (single-implementation interfaces):
  `DatabaseServiceShape` (`core/database/database-service.ts`),
  `RealtimeServiceShape`/`RealtimeStateServiceShape` (`core/realtime/`),
  `LoggerServiceShape` (`core/logger/logger-utils.ts`),
  `ConfigServiceShape` (`core/config/config-types.ts`).
  These are `Context.Service` type params — verify Effect typing still works before removal.
- **session-store composition** (`loom/src/core/state/session-store.ts`): custom
  `ConnectionSessionStore`/`RuntimeSessionStore` wrapper (~30-70 LOC). Highest regression risk in
  the old slop inventory; persisted-store behavior is pinned by `persisted-store-behavior-test.ts`.
- **Loom hook memos**: `use-lobby.ts` (descriptor/viewModel memos), `use-social-lcu.ts`,
  `use-chat-lcu.ts`, `social-panel` derivations. Each needs reference-identity analysis before
  removal (react-query identity matters).

## 3. RelayClient class remains 380 LOC (accepted, documented)

`loom/src/core/relay/relay-client.ts` after satellite extraction. Splitting the handshake
(`#sendIdentity`, `#handleSecretResponse`, `#handleRelayPayload`) requires extracting
`#sharedKey`/`#isEncrypted` from instance state — a state-machine redesign on the app's most
critical channel. Only attempt with characterization tests first; otherwise accept as cohesive.

## 4. Oversized test files (optional)

`loom/src/features/lobby/view-model/lobby-view-model-test.ts` (321) and
`loom/src/features/lobby/components/lobby-creation-content-utils-test.ts` (298).
Split by describe-block if they keep growing.

## 5. Environment

- `cargo-tauri` CLI is not installed on this machine — required for local conduit builds
  (`cargo install tauri-cli`). Frontend-only verification works via `pnpm --filter @shoma/conduit exec vp build`.
- 2 stashes remain from before the session: `prototype sheets exploration (social design variants A/B/C)`
  and `WIP: disable no-duplicate-imports` — the latter is likely obsolete (mixed value/type imports
  are now standard and pass lint). Review and drop.
