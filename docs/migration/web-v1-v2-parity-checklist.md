# Web v1 -> v2 Parity Checklist

_Last updated: 2026-02-24_

Use this checklist to verify parity between:

- v1: `web/` (Vue 2)
- v2: `web/` (React + TanStack Router)

Related migration status doc: `docs/migration/web-v1-v2-state.md`.

---

## How to use

- Mark each item as:
  - `[ ]` not tested
  - `[~]` tested with minor delta
  - `[x]` parity confirmed
  - `[!]` blocked/regression
- For every `[~]` or `[!]`, capture:
  - observed behavior
  - expected v1 behavior
  - severity (critical/high/medium/low)
  - reproducible steps

---

## 1) Environment + setup checks

- [ ] v2 app starts locally (`web`) and can connect to runtime.
- [ ] Rift target is known (legacy `rift` vs `rift`) and documented for this run.
- [ ] Test browser/device documented (latest Vite-supported target).
- [ ] Clean cache/session used for first-run validation.

Notes:

- Runtime target:
- Browser/device:
- Build/ref:

---

## 2) Connection flow parity

Reference v1 behavior source:

- `web/src/components/root/socket-state.vue`

Validation:

- [ ] Code entry accepts valid 6-digit code and rejects invalid format.
- [ ] Connecting state appears while tunnel/handshake is in progress.
- [ ] "Desktop not found/offline" state matches v1 semantics.
- [ ] "Desktop denied" state matches v1 semantics.
- [ ] Cancel/retry flows behave as in v1.
- [ ] Query-param auto-connect (`?code=`) behavior matches expected flow.
- [ ] Reconnect after disconnect behaves correctly.

---

## 3) Connected shell + route behavior

Validation:

- [ ] `/connected` navigation labels and destinations are correct.
- [ ] `/connected/lobby` provides full interactive connected controls.
- [ ] `/connected/invites` behavior is aligned with final UX decision (placeholder vs full interactive page).
- [ ] `/connected/champ-select` behavior is aligned with final UX decision (placeholder vs full interactive page).

Decision log (required):

- Final UX structure chosen:
- Decision date:
- Owner:

---

## 4) Lobby + queue parity

Reference v1 behavior sources:

- `web/src/components/lobby/*.vue`
- `web/src/components/queue/queue.vue`

Validation:

- [ ] Lobby snapshot displays members/invites/queue/map data correctly.
- [ ] Create lobby flow works (no-lobby state).
- [ ] Join queue works.
- [ ] Leave queue works.
- [ ] Leave lobby works with expected confirmation behavior.
- [ ] Queue dodge penalty behavior/message is correct.
- [ ] Lobby member moderation actions work (promote/kick/invite-permission) when leader.
- [ ] Role preference update flow works when position selector is enabled.

---

## 5) Ready-check parity

Reference v1 behavior source:

- `web/src/components/ready-check/ready-check.vue`

Validation:

- [ ] Ready-check appears when in progress.
- [ ] Accept works.
- [ ] Decline works.
- [ ] Already-responded state disables actions correctly.
- [ ] Audio cue behavior is acceptable vs v1 expectations.
- [ ] Vibration behavior is acceptable vs v1 expectations.

---

## 6) Invites parity

Reference v1 behavior source:

- `web/src/components/invites/invites.vue`

Validation:

- [ ] Pending invites list populates.
- [ ] Invite details enrichment (summoner/map/queue) resolves correctly.
- [ ] Accept invite works.
- [ ] Decline invite works.
- [ ] Invite-by-name works.
- [ ] Suggested-player invite action works.

---

## 7) Champ-select parity

Reference v1 behavior sources:

- `web/src/components/champ-select/*.vue`

Validation:

- [ ] Champ-select session visibility and phase/timer state are correct.
- [ ] Pick/ban action state and current-turn gating are correct.
- [ ] Hover/select and lock/ban actions work.
- [ ] Bench/reroll behavior works.
- [ ] Bench swap behavior works.
- [ ] Summoner spell updates work.
- [ ] Skin selection updates work.
- [ ] Rune page operations work (select/create/rename/delete/edit).
- [ ] Rune stat shard + primary/secondary rune updates work.

---

## 8) Runtime, observers, and resilience

Validation:

- [ ] Lobby observer data updates live without manual refresh.
- [ ] Queue observer data updates live.
- [ ] Ready-check observer data updates live.
- [ ] Invites observer data updates live.
- [ ] Champ-select observer data updates live.
- [ ] Disconnect/reconnect resets and repopulates state correctly.

---

## 9) PWA + platform behavior (v1 expectations preserved)

Validation:

- [ ] Install prompt availability behavior is correct.
- [ ] Standalone mode detection is correct.
- [ ] Safe-area/notch behavior in standalone mode is acceptable.
- [ ] Service worker registration/update behavior is acceptable for v1 goals.

---

## 10) Regression capture

For each non-pass item, record:

- Area:
- Severity:
- Expected (v1):
- Actual (v2):
- Repro steps:
- Suggested owner:
- Follow-up issue/link:

---

## 11) Sign-off summary

- Total tested:
- Passed:
- Minor deltas:
- Blockers:
- Recommendation:
  - [ ] ready for Web migration completion gate
  - [ ] needs another parity/fix cycle

Approver:
Date:
