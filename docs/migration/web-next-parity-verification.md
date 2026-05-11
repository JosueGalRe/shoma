---
title: Web-Next Parity Verification
updated_at: 2026-05-01
---

# Scope

This checklist tracks parity status between `web` (v1) and `web` (v2) for the currently prioritized migration areas.

## Verification summary

- Platform parity (PWA + mobile UX): **complete**
- Lobby management parity: **complete + visual redesign**
- Champ-select interaction parity: **complete + visual redesign + dedicated route**
- Integration coverage: **complete**
- Visual asset integration: **complete (Data Dragon assets integrated)**
- Animation/transition parity: **complete**
- Route structure: **complete (dedicated routes)**

## Detailed checklist

### 1) Platform parity (PWA + mobile UX)

- [x] Manifest + icons available in web
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
- [x] Visual redesign: Dark LoL theme with gold accents

### 3) Champ-select interaction parity

- [x] Pick/ban action controls (hover/select + lock/ban)
- [x] Reroll action support
- [x] Bench champion swap support
- [x] Summoner spell selection + apply
- [x] Rune page selection (set current page)
- [x] Rune page create / rename / delete actions
- [x] Skin selection + apply
- [x] Dedicated route: `/connected/champ-select`
- [x] Visual redesign: Immersive champion splash backgrounds and asset-rich UI

### 4) Visual Migration Complete

The visual migration for `web` is complete, featuring a design system inspired by the League of Legends client.

#### Integrated Assets (Data Dragon)
- **Profile Icons**: Displayed in lobby and navigation.
- **Champion Splash Art**: Used as dynamic backgrounds in champ-select.
- **Spell Icons**: High-quality icons for summoner spell selection.
- **Rune Icons**: Clear representation of rune paths and individual perks.
- **Skin Splash Art**: Previewed during skin selection.

#### Animations & Transitions
- **Page Transitions**: Smooth CSS-only transitions between routes.
- **Hover Effects**: Interactive card and button hover states.
- **Ready-Check Pulse**: Attention-grabbing pulse animation for the accept button.
- **Queue Gradient**: Dynamic animated gradient during active queueing.
- **Button Press**: Tactile feedback for all interactive elements.

### 5) Tests and verification

- [x] Integration test coverage for connected LCU observer flow
- [x] Parser coverage for lobby/invite/champ-select snapshots
- [x] Translation key-shape parity checks (EN/ES)
- [x] Full integration suite passes (23/23 passing)
- [x] `bun run build` passes with 0 TypeScript errors

## Residual deltas (intentional / non-blocking)

1. **UX Enhancements**
   - web intentionally uses a more modern, route-based navigation compared to v1's single-page composition.
   - Some animations are optimized for mobile performance (CSS-only).

2. **Rune Editing**
   - Full perk-row editing is supported, matching v1 functionality with a cleaner interface.

## Recommended next phase

1. Implement consistent loading skeleton screens for all routes.
2. Explore optional immersive features like dynamic map backgrounds.
3. Maintain asset caching strategies for optimal mobile experience.
