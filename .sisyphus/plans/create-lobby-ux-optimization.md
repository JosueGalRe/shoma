# UX Optimization: Create Lobby Page

## Context
The create-lobby page allows users to select a game mode and queue type to create a new lobby. The page currently shows a list of game mode sections (ARAM, Summoner's Rift, TFT, etc.) with queue cards that can be lengthy on mobile.

## Goal
Apply the same UX consolidation principles used for the lobby page: reduce padding, compact spacing, optimize for single-viewport mobile experience.

## Analysis

### Current Layout Issues
1. **Excessive spacing**: `space-y-6` between sections, `p-4` on cards
2. **Large elements**: `h-12 w-12` icons, `text-xl` titles
3. **Inefficient cards**: Each queue card has generous padding and large icon
4. **Vertical stacking**: Multiple game mode sections stack vertically with large gaps

## Changes Required

### 1. Reduce Global Spacing
- `space-y-6` → `space-y-4` (main container)
- `space-y-4` → `space-y-3` (outer main)
- `space-y-3` → `space-y-2` (section headers)

### 2. Compact Section Headers
- Title: `text-xl` → `text-lg`
- Game mode headers: `text-lg` → `text-base`

### 3. Compact Queue Cards
- Card padding: `p-4` → `p-3`
- Icon size: `h-12 w-12` → `h-10 w-10`
- Icon text: `text-xs` → `text-[10px]`
- Queue title: default → `text-sm`
- Queue ID: `text-xs` → `text-[10px]`
- Gap between elements: `gap-4` → `gap-3`

### 4. Grid Optimization
- Grid gap: `gap-3` → `gap-2`
- Keep `sm:grid-cols-2` for desktop

### 5. Button Styling
- Add `shrink-0` to create button to prevent compression
- Ensure minimum touch target of 44px

## Files to Modify
- `apps/web-next/src/routes/connected/create-lobby/route.tsx`

## Verification
- TypeScript check passes
- Visual check: page fits better on mobile viewport
- Touch targets >= 44px
