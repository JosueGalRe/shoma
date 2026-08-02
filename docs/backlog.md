# Backlog

Debt discovered and deferred during the 2026-07-31 maintenance session. Ordered by priority.
Each item lists context and pointers so a future session can pick it up cold.

## 1. Rewrite champ-select (highest priority)

`use-champ-select.ts` (573 LOC) was deliberately NOT split: the feature misbehaves in production
("no funciona para nada bien") and will be rewritten from scratch.

- Recommendation: write characterization tests against current behavior FIRST, then rewrite.
- Adjacent modules already cleaned up: `champ-select-actions.ts` (slim domain model, intentional),
  `champion-picker.tsx` was split into branch components (classic/aram/filters/grid-card +
  `hooks/use-champion-preview.ts`) — the rewrite plugs into those.
- Note: `parsers/champ-select.ts` (full LCU shape) vs `champ-select-actions.ts` (slim UI shape) is an
  intentional anti-corruption layer, not duplication. Keep both.

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

## 3. Ready-check subtitle lies about the queue

`loom/src/features/ready-check/components/ready-check-overlay.tsx` renders
"Ranked · 5 vs 5" unconditionally — the component never receives the real game mode.
Wire the actual mode from gameflow/lobby state into the overlay, then translate via existing
`readyCheck.*` keys (or mode keys).

## 4. design-system: untranslatable drag-handle aria label

`packages/design-system/src/components/bottom-sheet.tsx` hardcodes
`aria-label="Drag bottom sheet"` (English). Add an optional `dragHandleAriaLabel` prop
(API change) and pass a translated string from loom/conduit.

## 5. RelayClient class remains 380 LOC (accepted, documented)

`loom/src/core/relay/relay-client.ts` after satellite extraction. Splitting the handshake
(`#sendIdentity`, `#handleSecretResponse`, `#handleRelayPayload`) requires extracting
`#sharedKey`/`#isEncrypted` from instance state — a state-machine redesign on the app's most
critical channel. Only attempt with characterization tests first; otherwise accept as cohesive.

## 6. parsers/ flat-type extraction (convention follow-up)

After the `queries/` split, the rule is: plain interfaces/aliases live in `-types.ts`,
`InferOutput` types stay next to their schema. Apply to `core/lcu/parsers/`:

- `GameMode` (`lobby.ts`) → `lobby-types.ts` candidate.
- `ClashTournament` (`clash.ts`) → `clash-types.ts` candidate.
- Everything else there is `InferOutput` and stays.

## 7. Oversized test files (optional)

`loom/src/features/lobby/view-model/lobby-view-model-test.ts` (321) and
`loom/src/features/lobby/components/lobby-creation-content-utils-test.ts` (298).
Split by describe-block if they keep growing.

## 8. Environment

- `cargo-tauri` CLI is not installed on this machine — required for local conduit builds
  (`cargo install tauri-cli`). Frontend-only verification works via `pnpm --filter @shoma/conduit exec vp build`.
- 2 stashes remain from before the session: `prototype sheets exploration (social design variants A/B/C)`
  and `WIP: disable no-duplicate-imports` — the latter is likely obsolete (mixed value/type imports
  are now standard and pass lint). Review and drop.
