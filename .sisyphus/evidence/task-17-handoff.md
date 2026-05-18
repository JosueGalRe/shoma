# Task 17 Handoff: web-next Migration Final Verification

Date: 2026-05-03

## Project overview

Mimic is a remote League of Legends client controller. The next-generation migration moves the mobile web experience to `apps/web-next`, using the encrypted rift/conduit relay path to issue LCU requests and observe game state from a phone-sized browser UI.

## Architecture summary

- `apps/rift-next`: Bun/Elysia relay service that brokers encrypted WebSocket sessions between conduit desktop clients and mobile web clients.
- `apps/conduit-next`: Tauri desktop bridge that connects to the local League Client Update (LCU) API and relays encrypted traffic through rift-next.
- `apps/web-next`: React 19 + TanStack Router + Tailwind v4 mobile web app. It owns the connect flow, lobby/queue/ready-check/invite/champ-select UI, and feature-level state derived from typed LCU transport helpers.
- `packages/protocol-contract`: Shared protocol constants/types, including LCU paths and mobile/rift opcodes used by the encrypted relay.

## Feature inventory

- Queue management: queue list, lobby creation, start/cancel matchmaking, dodge/error handling.
- Ready check: accept/decline/expiry handling with state transitions.
- Invites: received invite parsing and accept/decline flows.
- Champ select foundation: gameflow hydration, reload reconstruction, legal action handling.
- Pick/ban/bench: hover/select/lock, ban/pick turn handling, timeout fallback, ARAM bench selection.
- Runes: preset/editable page handling and invalid-rune error paths.
- Summoner spells and skins: role-aware spell selection, Smite lock behavior, champion skin selection.
- ARAM cards: modern card/bench flow instead of legacy dice-only assumptions.
- Redesign: lazyweb-informed mobile visual direction documented and covered by W7 local E2E regression output.

## Quality gate status

| Gate                                        | Status                                  | Evidence                                           |
| ------------------------------------------- | --------------------------------------- | -------------------------------------------------- |
| `bun run --filter @mimic/web-next build`    | PASS                                    | `task-17-final-verification.log`                   |
| `bun run --filter @mimic/web-next test`     | PASS, 84/84                             | `task-17-final-verification.log`                   |
| `bun run --filter @mimic/web-next test:e2e` | PASS, 24/24 local Playwright/mock tests | `task-17-final-verification.log`                   |
| `bun run lint:ox`                           | BLOCKED                                 | Script invokes IDE-only oxlint wrapper and exits 1 |
| `bun run fmt:check`                         | BLOCKED                                 | Script invokes IDE-only oxfmt wrapper and exits 1  |
| Live LoL-client E2E                         | BLOCKED                                 | Chrome/live approval constraints in issues.md      |

## Known issues / blockers

- `bun run lint:ox` and `bun run fmt:check` are present at the root, but both fail because the configured wrappers are IDE-extension wrappers (`--lsp`/stdin mode guidance) rather than runnable CLI quality gates.
- Live Playwright/LoL-client verification remains blocked by Chrome not being available at `/opt/google/chrome/chrome` in prior live-observation attempts.
- Live encrypted desktop approval for code `426729` timed out waiting for `SECRET_RESPONSE`, so approved live LCU payload capture is still unavailable.
- Build emits the known `/assets/map-bg.jpg` runtime-resolution warning; build exits 0 and leaves the asset reference for runtime resolution.
- Dedicated task-16 evidence files (`task-16-redesign-lobby.png`, `task-16-regression.log`) were not present in `.sisyphus/evidence/` during W7 audit.

## Maintenance notes

- Keep feature tests colocated under `apps/web-next/tests/`; Bun unit/integration tests are currently the fastest parity regression gate.
- Use `bun run --filter @mimic/web-next build` as the typecheck/build gate until lint/format scripts are repaired.
- Treat local Playwright E2E as mock/regression coverage only; live LoL-client acceptance requires a working Chrome install, a running conduit-next process, rift-next on the expected port, and a desktop approval path that returns `SECRET_RESPONSE`.
- Do not regress the encrypted handshake sequence: mobile connects to rift, receives conduit public key, sends encrypted identity secret, waits for `SECRET_RESPONSE`, then sends encrypted LCU frames.

## File structure reference

```text
apps/web-next/
  src/core/rift/                  encrypted rift transport and LCU request/observer helpers
  src/features/                   domain feature state and actions
  src/routes/connected/           authenticated lobby/champ-select/invite UI routes
  src/components/ui/              shared UI primitives
  tests/                          Bun and Playwright coverage for parity flows
apps/rift-next/                   Bun/Elysia relay service
apps/conduit-next/                Tauri desktop LCU bridge
packages/protocol-contract/       shared opcodes, paths, and protocol types
.sisyphus/evidence/               task evidence, logs, parity matrix, handoff
.sisyphus/notepads/mimic-web-next-migration/  ongoing learnings/issues/decisions
```

## Next recommended actions

1. Repair the root lint/format scripts so `bun run lint:ox` and `bun run fmt:check` execute real CLI checks instead of IDE wrappers.
2. Add or recover dedicated task-16 redesign evidence artifacts.
3. Install/provision Chrome for Playwright and rerun live LoL-client E2E with conduit-next approval available.
