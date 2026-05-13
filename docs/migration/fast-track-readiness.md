# Fast-track Migration Readiness

_Last updated: 2026-04-30_

## Goal

Reach the fastest usable migration baseline with:

- `leyline` as the Leyline runtime.
- `loom` as the Loom client.
- `conduit/` original C# app as the desktop bridge until `conduit` exists.

## Automated validation status

Current automated gates are green for the migrated apps:

| Area | Command | Result |
|---|---|---|
| Leyline-next tests | `bun run --filter @shoma/leyline test` | 29 pass, 0 fail |
| Loom-next tests | `bun run --filter @shoma/loom test` | 21 pass, 0 fail |
| Leyline-next build | `bun run --filter @shoma/leyline build` | Pass |
| Loom-next build | `bun run --filter @shoma/loom build` | Pass |
| Workspace lint | `bun run lint` | 0 errors, 1 non-blocking warning for `loom/public/sw.js` |

## Non-blocking automated finding

`loom/public/sw.js` is a legacy placeholder while `vite-plugin-pwa` generates `pwa-sw.js`.

- It is not referenced by the current `loom` source.
- Keeping it avoids making a potentially disruptive PWA compatibility change during the fast-track validation pass.
- Revisit after smoke validation if a warning-free lint gate is required.

## Smoke test stack

Use this stack for the first functional migration baseline:

```txt
leyline + loom + conduit
```

## Smoke test prerequisites

- League client available for LCU-backed validation.
- Original `conduit/` can be launched and pointed at the local or selected `leyline` endpoint.
- `LEYLINE_JWT_SECRET` is configured consistently for `leyline`.
- `loom` knows the target Leyline URL for connect flow.

## Smoke test checklist

### 1. Leyline-next runtime

- [ ] Start `leyline` successfully.
- [ ] Confirm `/` responds.
- [ ] Confirm `/register` returns a token for a valid public key.
- [ ] Confirm `/check` returns `true` for the generated token.
- [ ] Confirm `/conduit` accepts the original Conduit connection.
- [ ] Confirm `/mobile` accepts the Loom-next connection.

### 2. Conduit original against Leyline-next

- [ ] Launch original `conduit/`.
- [ ] Confirm it registers and receives/reuses a code.
- [ ] Confirm reconnect does not create an unusable stale state.
- [ ] Confirm closing Conduit detaches connected Loom clients cleanly.

### 3. Loom-next connection flow

- [ ] Start `loom` successfully.
- [ ] Enter a valid code manually.
- [ ] Validate query-param auto-connect if supported by the configured URL.
- [ ] Validate desktop-not-found/offline state with an invalid or offline code.
- [ ] Validate denied/cancel/retry behavior if Conduit prompt flow is available.
- [ ] Validate reconnect after Loom reload.

### 4. LCU request and observer flow

- [ ] Confirm initial connected state loads peer metadata.
- [ ] Confirm lobby observer updates live.
- [ ] Confirm queue observer updates live.
- [ ] Confirm ready-check observer updates live.
- [ ] Confirm invites observer updates live.
- [ ] Confirm champ-select observer updates live.

### 5. Gameplay feature parity smoke

- [ ] Create lobby.
- [ ] Join queue.
- [ ] Leave queue.
- [ ] Leave lobby.
- [ ] Invite by name.
- [ ] Accept/decline received invite.
- [ ] Accept/decline ready-check.
- [ ] Champ-select pick/ban/lock action.
- [ ] Reroll if available.
- [ ] Bench swap if available.
- [ ] Change summoner spells.
- [ ] Select/apply skin.
- [ ] Select/create/rename/delete rune page.

## Go/no-go criteria for first functional baseline

### Go

- Leyline-next, Loom-next, and original Conduit connect end-to-end.
- Loom-next can issue LCU requests through the tunnel and receive responses.
- Core gameplay flows work: connection, lobby, queue, ready-check, invites, champ-select basics.
- Remaining gaps are visual polish, richer overlays, route structure cleanup, or warning-level lint issues.

### No-go

- Loom-next cannot connect to Conduit through Leyline-next.
- LCU request/response relay fails consistently.
- Lobby or queue flows are unusable.
- Ready-check or champ-select core actions are broken in real sessions.
- Reconnect leaves the stack in a stale unusable state.

## Immediate next actions

1. Run the smoke stack locally with real Conduit and League.
2. Fill this checklist with pass/fail notes.
3. Fix only no-go blockers first.
4. Update `docs/migration/web-v1-v2-parity-checklist.md` once smoke findings are known.
5. Defer `conduit` until this hybrid baseline is confirmed.
