# Visual Refactoring: Lobby Creation Screen

## Overview

Refactored the lobby creation screen (`/connected/lobby`) to implement a full-viewport glassmorphism design with animated game mode icons, accordion-style mode selection, and proper layout constraints that eliminate unwanted scrollbars.

## Problem Statement

The previous lobby creation screen had several visual issues:

- **"Terrible borders"**: The glassmorphism background didn't fill the entire viewport due to parent layout padding
- **Global scroll**: The entire page scrolled instead of just the content area
- **Double negative margin**: Both the route wrapper and component applied `-m-4`, causing over-pull
- **Static icons**: Game mode icons were static PNGs instead of animated videos from CommunityDragon

## Solution

### 1. Full-Viewport Background

- **Root cause**: `SafeArea.tsx` added hardcoded fallback padding (`+ 0.75rem`, `+ 1rem`) that created visible dark margins on desktop
- **Fix**: Removed fallback values, using only `env(safe-area-inset-*)` so padding only applies when there's an actual notch
- **Result**: Background now fills viewport edge-to-edge on desktop

### 2. Header Fixed, Content Scrollable

- **Root cause**: The entire `<body>` was scrolling because content grew beyond viewport height
- **Fix**:
  - `AppShell.tsx`: Changed `min-h-screen` → `h-[100dvh]` to fix viewport height
  - `connected/route.tsx`: Made `<section>` `overflow-hidden` and content wrapper `overflow-y-auto`
  - Added `shrink-0` to header so it doesn't compress
- **Result**: Only the content area scrolls; header stays fixed at top

### 3. Lobby Creation Content Redesign

Replaced the old grid layout with a prototype-tested accordion list:

#### Visual Design

- **Background**: Dark navy (`bg-surface`) with three pulsing glow orbs (gold, teal, border-gold)
- **Cards**: Glassmorphism with `backdrop-blur-md`, gold-tinted borders (`border-border-gold/20`)
- **Typography**: Display font for "SELECT MODE" title with gold drop shadow
- **Accent**: Primary gold (`text-primary`) for active states, glowing left border indicator

#### Interactions

- **Accordion**: Click to expand/collapse mode details with smooth `grid-rows` transition
- **Staggered reveal**: Queue buttons animate in with incremental delay (`index * 40ms`)
- **Selection state**: Gold background highlight with inner glow shadow
- **Hover**: Border brightens, icon scales up slightly

#### Animated Icons

- Created `AnimatedModeIcon` shared component with video fallback strategy:
  - **Video**: `.webm` intro + active loop from CommunityDragon CDN
  - **Fallback**: Static PNG behind video to prevent flash/loading jank
  - **TFT**: Completely static (old icon doesn't match video style)

#### Game Mode Mapping

- **Summoner's Rift** (`classic_sru/`): Animated video
- **ARAM** (`aram/`): Animated video
- **TFT** (`tft/`): Static only
- **Arena** (`cherry/`): Animated video (CommunityDragon calls it "cherry")
- **RGM** (`shared/`): Uses generic experimental game mode icon
- **Custom** (`gamemodecommon/`): Uses empty icon placeholder

### 4. Layout Architecture Fixes

- **Removed double negative margin**: `lobby/route.tsx` no longer wraps component in `-m-4` div
- **Component self-contained**: `LobbyCreationContent` handles its own sizing with `h-full` and `overflow-hidden`
- **Parent padding moved to children**: Other routes (`arena`, `clash`, `custom`, `invites`, `swiftplay`) now add their own `p-4` since parent no longer provides it

## Files Changed

### Core Layout

- `loom/src/components/layout/AppShell.tsx` — Fixed viewport height, removed body scroll
- `loom/src/components/layout/SafeArea.tsx` — Removed hardcoded padding fallback
- `loom/src/routes/connected/route.tsx` — Fixed header + scrollable content layout

### Lobby Feature

- `loom/src/features/lobby/components/lobby-creation-content.tsx` — Complete redesign with accordion, glassmorphism, animated icons
- `loom/src/components/animated-mode-icon.tsx` — New shared component for video + fallback icons
- `loom/src/routes/connected/lobby/route.tsx` — Simplified wrapper, removed redundant padding compensation

### Child Routes (padding added)

- `loom/src/routes/connected/arena/route.tsx`
- `loom/src/routes/connected/clash/route.tsx`
- `loom/src/routes/connected/custom/route.tsx`
- `loom/src/routes/connected/invites/route.tsx`
- `loom/src/routes/connected/swiftplay/route.tsx`

### Prototype

- `loom/src/routes/prototype/game-mode/` — Prototype routes for A/B/C variants (B2 chosen as winner)

### Translations

- `loom/src/i18n/translations/en.ts` — Added lobby creation keys
- `loom/src/i18n/translations/es.ts` — Added lobby creation keys

## Testing

Verified with agent-browser on:

- Desktop (1280×800): No horizontal/vertical scroll, background fills viewport
- Mobile (393×852): Header fixed, content scrollable, no double scroll

## Notes

- Prototype B2 was chosen as the winning design after user feedback
- CommunityDragon CDN paths discovered for game mode video assets
- TFT intentionally excluded from animation (old icon style mismatch)
