# Learnings

- `Card` already carries the LoL surface tokens (`bg-lol-navy-900/80`, border, blur, glow), so route-level redesigns can stay lightweight.
- `Button` variants already support the gold/red League styling; route files only need spacing, sizing, and emphasis tweaks.
- The app resolves `es` from the browser language and falls back to `en`, so direct copy choices should be intentional when a screen needs exact wording.
## 2026-05-04 — Connect screen redesign

- The LoL-themed landing shell works well with the existing `Input`/`Button` primitives; the atmospheric wrapper can live in `ConnectScreen` without touching the connection hook.
- Keep an eye on status rendering: duplicating the same translated error in both the status label and the error body creates noisy UX and showed up in QA.
- Cancel behavior matters during `connecting`/`handshaking`; disabling it there makes the reconnect flow harder to recover from.

## 2026-05-04 — Connected route invite toast

- The invite overlay can live entirely in `connected/route.tsx` as a fixed-position stack without affecting `AppShell`, `section`, or `aside` layout.
- `useInvites()` still needs to run on connected pages even when the UI only reads the store; calling it in the route keeps store sync and action handlers ready.

## 2026-05-04
- Split `connected/lobby` into a pre-lobby Play view and an in-lobby Lobby view using the existing `modeCards` data.
- Keeping the lobby hooks untouched made the render split low-risk; the main verification point was `bun run typecheck` in `apps/web-next`.
