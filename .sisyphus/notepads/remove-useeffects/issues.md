## 2026-05-05

- `apps/web-next` full `bun test` currently fails outside the countdown work: three Rift handshake integration tests time out waiting for socket messages, and i18n parity is missing 13 Spanish keys (`createLobby.*`, lobby invite/sent invite keys).
- `bun run lint` currently exits non-zero under `--max-warnings=0` because of 11 existing warnings in core LCU/Rift hooks, lobby derived memo dependencies, champion picker spread, redundant `unknown | null` types, and unbound LCU path methods.

## Code quality review - 2026-05-05

- REJECTED: render-phase side effects introduced in queue/ready-check/champ-select hooks via direct notify/ref mutation during render.
- REJECTED: mutation race guards are incomplete for useQueue cancelQueue, useReadyCheck accept/decline, and lobby join/leave/global action path.
- Lint failed with target-file warnings in use-lobby (unstable parsedMembers dependency) and use-invites (unbound LcuPaths methods).
- Store setters appear orphaned after effect removal: lobby setters, queue setDodgePenalty/setTimer, ready-check expire/setTimer, champ-select setChampions/setSession, aram setAramState.

## Code Quality Review - 2026-05-05
- REJECT: modified files still contain console.log/console.warn in lcu-mutations.ts, use-lobby.ts, and routes/connected/lobby/route.tsx.
- REJECT: use-invites.ts adds useMutation onSuccess lifecycle callbacks; review requested no query lifecycle callbacks in useQuery calls, but lifecycle callbacks remain in TanStack query/mutation usage.
- Verified notify() calls are inside useEffect callbacks in modified files and LSP diagnostics reported no errors across modified app files.

## F4 Timer Fidelity Verification - 2026-05-05

- Full `bun test` still fails outside the timer change: three Rift handshake integration tests time out waiting for socket messages, and i18n parity is missing Spanish keys for create-lobby/lobby invite strings.
- `bun run lint` still fails outside the timer change on `src/features/champ-select/components/champion-picker.tsx:55` due to `eslint-plugin-unicorn(no-useless-spread)` under `--max-warnings=0`.
## 2026-05-05
- The cleanup went beyond lint/log removal in a few places: `use-lobby.ts`, `use-invites.ts`, and `routes/connected/lobby/route.tsx` picked up behavior changes that affect countdowns and invite notifications.
- Review flagged a stale dodge-penalty countdown risk and a lost invite notification path; those are the main regressions to watch if the cleanup is retried.
