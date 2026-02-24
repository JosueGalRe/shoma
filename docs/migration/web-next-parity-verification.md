---
title: Web-Next Parity Verification
updated_at: 2026-02-23
---

# Scope

This checklist tracks parity status between `web` (v1) and `apps/web-next` (v2) for the currently prioritized migration areas.

## Verification summary

- Platform parity (PWA + mobile UX): **complete**
- Lobby management parity: **complete**
- Champ-select interaction parity: **complete (functional)**
- Integration coverage for restored interaction flows: **complete for parser/observer and transport-level behavior**

## Detailed checklist

### 1) Platform parity (PWA + mobile UX)

- [x] Manifest + icons available in web-next
- [x] Service worker registration bootstrap added
- [x] `beforeinstallprompt` capture + install prompt UX
- [x] Standalone-mode and mobile runtime detection hooks

### 2) Lobby management parity

- [x] Create lobby with queue selection
- [x] Join queue / leave queue / leave lobby controls
- [x] Queue dodge penalty surfacing
- [x] Invite panel with suggested players + manual invite by name
- [x] Member moderation: promote / kick / invite permissions
- [x] Role preferences: first/second role selection + submit

### 3) Champ-select interaction parity

- [x] Pick/ban action controls (hover/select + lock/ban)
- [x] Reroll action support
- [x] Bench champion swap support
- [x] Summoner spell selection + apply
- [x] Rune page selection (set current page)
- [x] Rune page create / rename / delete actions
- [x] Skin selection + apply

### 4) Tests and verification

- [x] Integration test coverage for connected LCU observer flow
- [x] Parser coverage for lobby/invite/champ-select snapshots
- [x] Translation key-shape parity checks (EN/ES)
- [x] Full integration suite passes
- [x] `bun run build` passes

## Residual deltas (intentional / non-blocking)

1. **Champ-select UX depth vs v1 overlays**
   - v1 uses richer modal-style pickers (champion/spell/rune/skin overlays with artwork-heavy interactions).
   - web-next now supports the same action endpoints functionally, but currently via compact dashboard controls.

2. **Visual asset richness**
   - Some controls still display IDs/compact labels where v1 uses richer icon/name presentation.
   - Functional parity is preserved, but polish parity can be improved.

## Recommended next phase

1. Add interaction-level tests around connected route action handlers (UI-triggered spell/rune/skin/champ actions with mocked transport responses).
2. Implement richer champ-select visuals (icons/names/art cards) while preserving current transport behavior.
3. Expand rune editing beyond page lifecycle (full perk-row editing) if strict UX parity is required.
