## 2026-05-03 - W1-T1 rift smoke

- Live conduit code `426729` resolved to a public key, but the encrypted desktop approval path did not return `SECRET_RESPONSE` within 30 seconds for smoke identity `rift-smoke-device`.
- A rift dev server was already running before this task; starting another `rift-next` dev process created duplicate listeners on `51001`. The smoke-started process was stopped and the pre-existing listener was left running.

## 2026-05-03 - W1-T2 live observation blockers

- Playwright browser navigation could not run because Chrome was missing at `/opt/google/chrome/chrome` (`npx playwright install chrome` suggested by the tool).
- No local `conduit-next` process was visible via `ps`; rift-next was running on `51001` and web-next on `5173`.
- Code `426729` still resolves to a relay peer public key over `ws://localhost:51001/mobile`, but encrypted identity `task-2-parity-observer` timed out waiting for `SECRET_RESPONSE` after 30 seconds, so no live LCU `UPDATE` or `RESPONSE` payloads were captured.

## 2026-05-03 - W7-T1 final verification blockers

- `bun run lint:ox` is defined at the repository root, but exits 1 because `bunx oxlint --config oxlint.config.ts apps packages` invokes an IDE-extension-only wrapper and reports: `This oxlint wrapper is for IDE extension use only (--lsp mode). To lint your code, run: vp lint`.
- `bun run fmt:check` is defined at the repository root, but exits 1 because `bunx oxfmt --check .` invokes an IDE-extension-only wrapper and reports: `This oxfmt wrapper is for IDE extension use only (lsp or stdin mode). To format your code, run: vp fmt`.
- Local `bun run --filter @mimic/web-next test:e2e` passed 24/24 Playwright tests, but this is the local/mock suite; live LoL-client E2E remains blocked by the previously observed Chrome and encrypted desktop approval issues.
- `.sisyphus/evidence/` contained task evidence for tasks 1-15 and task 17 after W7 artifacts were created, but dedicated task-16 redesign evidence files (`task-16-redesign-lobby.png`, `task-16-regression.log`) were not present during the final audit.

## 2026-05-03 - F1 plan compliance audit

- Verdict: REJECT.
- Blocking items: lint:ox exits 1, fmt:check exits 1, live LoL E2E remains blocked, task-16 dedicated evidence files are absent, task-14 ARAM evidence files are absent despite W7 claiming they exist, and task-15 evidence does not show explicit user approval for redesign direction.
- Supporting references: .sisyphus/evidence/task-17-final-verification.log, task-17-handoff.md, task-2-parity-matrix.md, task-15-redesign-proposal.md, task-15-lazyweb-research.md.

## 2026-05-03 F4 scope fidelity check

- Verdict: REJECT. Required modern ARAM card behavior is not faithfully implemented: `apps/web-next/src/features/champ-select/components/aram-panel.tsx` still presents reroll/dice UI and `apps/web-next/src/features/champ-select/aram-store.ts` calls `LcuPaths.champSelect.mySelectionReroll`, which conflicts with the plan requirement to adapt ARAM from dice to cards.
- Scope boundary notes: `apps/conduit-next` was not modified; redesign changes are concentrated in `apps/web-next`; `apps/rift-next` has CORS/package/database changes that need justification as validation unblockers before inclusion.

## F2 code quality review - 2026-05-03

- REJECT: Multiple web-next modules create LCU WebSocket clients at module scope (`createLCUClient()`), including champ-select stores, queue/invites hooks, and pick/ban bench client. This makes imports side-effectful and hurts testability.
- REJECT: `connect-entry-form.tsx` contains empty catch blocks around localStorage parsing/writes.
- REJECT: Runes/Summoners sheet overlays use click-only backdrop divs and icon close buttons without dialog semantics/keyboard handling.
- Diagnostics/build/test evidence: web-next tests passed 84/84; build passed; madge found no circular dependencies; LSP found hint-level dead code in `aram-panel.tsx` and two no-effect awaits plus one unused test import.

## F3 Real Manual QA - 2026-05-04

- Playwright MCP could not launch because it expects Chrome at `/opt/google/chrome/chrome`; `npx playwright install chrome` failed due sudo password requirement. Used local Chromium executable `/usr/sbin/chromium` with Playwright library instead.
- Visual review noted champ-select 320px champion cards use very small/truncated low-contrast text (`CHAMPI...`, dim unavailable labels). Not blocking because layout remains fitted and functional, but readability could be improved.
- Active ready-check 320px screenshot shows the persistent top nav above the modal; modal content remains readable and not clipped, but nav presence may reduce modal focus.

## 2026-05-03 F2 re-review

- Code quality re-review REJECTED: `apps/web-next/src/core/rift/hooks.ts:20` still calls `createLCUClient()` without `{ connectOnCreate: false }`, despite the requirement that all `createLCUClient()` calls use `connectOnCreate: false`.
- Confirmed `connect-entry-form.tsx` localStorage catches now log with `console.error`, and `aram-panel.tsx` no longer destructures unused `useRerollCard`.
- `lsp_diagnostics` returned no diagnostics for reviewed changed files.
