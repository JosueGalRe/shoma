# Plan 04: ARAM & Lobby Polish + 2026 Feature Polish

## TL;DR
> **Summary**: Add visual styling for ARAM's new Crowd Favorite and Bravery card types. Add Lobby polish: Climb Indicator and Premade Ready Check visuals. Apply remaining 2026-aligned polish (staggered reveals, skeleton loaders). Ensure all gated features have graceful empty/disabled states.
> **Deliverables**: Crowd Favorite card styling, Bravery card styling, Climb Indicator UI, Ready Check UI, staggered reveal animations, skeleton loaders.
> **Effort**: Short-Medium
> **Parallel**: YES — all tasks independent.
> **Critical Path**: None — this is polish layer.

## Context

### Original Request
Support LoL 2026 ARAM changes: Crowd Favorite and Bravery card mechanics.

### Why Separate Plan
ARAM-specific features are isolated from the core draft flow. Separating prevents ARAM complexity from cluttering the main picker plan.

### Depends On
- **Plan 01**: ChampionPicker refactor (for card rendering).
- **Plan 03**: Bench refactor (for bench styling).

### Metis Guardrails
- MUST gate on actual card metadata (`type` field).
- MUST NOT invent card type data.

## Work Objectives

### Core Objective
Make ARAM card selection visually exciting and aligned with LoL 2026's special card types.

### Deliverables
1. Crowd Favorite card: gold sparkling border + star icon + label.
2. Bravery card: purple/magenta gradient border + dice icon + label.
3. Climb Indicator: subtle aura/chevron around player avatar in lobby when MMR > visible rank (gated on data availability).
4. Premade Ready Check: full-screen modal with circular progress ring filling as party members accept (Swiftplay, gated on data).
5. Staggered reveal animations for champ-select screen entry.
6. Skeleton shimmer loaders for champion data resolution.
7. Graceful fallback when gated data is absent.

### Definition of Done
```bash
bun run build
```

### Must Have
- Distinct visual treatments for Crowd Favorite (gold + star) and Bravery (purple + dice) card types.
- Normal ARAM cards unchanged.
- Climb Indicator UI shell ready for data integration (disabled if MMR data unavailable).
- Ready Check modal UI shell with circular progress ring (disabled if premade data unavailable).
- Staggered reveal animation utilities available from Plan 00-T7.
- Skeleton shimmer for champion identity loading states.
- All gated features show graceful disabled/placeholder state.

### Must NOT Have
- MUST NOT hardcode card types.
- MUST NOT break existing ARAM card selection.
- MUST NOT implement actual MMR comparison logic (UI-only shell).
- MUST NOT implement actual ready-check protocol logic (UI-only shell).

## Verification Strategy
- Playwright tests with mocked card metadata.
- Mobile screenshots.

### Agent Dispatch Summary
| Task | Category | Skills |
|------|----------|--------|
| T1 Crowd Favorite styling | visual-engineering | frontend-ui-ux |
| T2 Bravery styling | visual-engineering | frontend-ui-ux |
| T3 Climb Indicator | visual-engineering | frontend-ui-ux |
| T4 Ready Check | visual-engineering | frontend-ui-ux |
| T5 Staggered Reveals | visual-engineering | frontend-ui-ux |
| T6 Skeleton Loaders | visual-engineering | frontend-ui-ux |

## Execution Strategy

### Dependency Matrix
| Task | Blocks | Blocked By |
|------|--------|------------|
| T1 Crowd Favorite styling | — | Plan 01-T1 (ChampionPicker refactor) |
| T2 Bravery styling | — | Plan 01-T1 (ChampionPicker refactor) |
| T3 Climb Indicator | — | — |
| T4 Ready Check | — | — |
| T5 Staggered Reveals | — | Plan 00-T7 (Tailwind keyframes) |
| T6 Skeleton Loaders | — | Plan 00-T6 (ChampionIdentity) |

## TODOs

- [x] T1: ARAM Crowd Favorite Card Styling
- [x] T2: ARAM Bravery Card Styling
- [x] T3: Climb Indicator UI Shell (Gated)
- [x] T4: Premade Ready Check UI (Gated) — full-screen overlay with SVG circular progress ring, party member avatars with accept/decline/pending status indicators
- [x] T5: Staggered Reveal Animations
- [x] T6: Skeleton Shimmer Loaders

  **What to do**: Replace static loading states with skeleton shimmer effects in `ChampionIdentity`, `Members`, and `Bench` components. Use `bg-lol-navy-900` with shimmer gradient animation (`motion-safe:animate-shimmer`) while resolving `championId` to name/avatar. Users with `prefers-reduced-motion` see static placeholder (generic champion silhouette icon) instead of shimmer. Fallback to text after 3s timeout.
  **Must NOT do**: Do not shimmer indefinitely. Max shimmer duration 3s before showing fallback.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `frontend-ui-ux`

  **Parallelization**: YES | Blocks: — | Blocked By: Plan 00-T6 (ChampionIdentity)

  **References**:
  - Source: `web/src/features/champ-select/components/champion-identity.tsx`
  - Source: `web/src/features/champ-select/components/members.tsx`
  - Source: `web/src/features/champ-select/components/bench.tsx`

  **Acceptance Criteria**:
  - [ ] Skeleton shown while champion data loading.
  - [ ] Shimmer animation uses `bg-lol-navy-900` gradient with `motion-safe:animate-shimmer`.
  - [ ] `prefers-reduced-motion`: static champion silhouette icon (no shimmer).
  - [ ] Max shimmer duration 3s.
  - [ ] Graceful fallback to text/silhouette after timeout.

  **QA Scenarios**:
  ```
  Scenario: Skeleton loading
    Tool: Playwright
    Steps: Render members with slow network → verify skeleton visible
    Expected: Shimmer effect visible before data loads
    Evidence: .sisyphus/evidence/plan-04-t6-skeleton.png
  ```

  **Commit**: YES | `feat(champ-select): add skeleton shimmer loaders` | Files: `web/src/features/champ-select/components/champion-identity.tsx`, `members.tsx`, `bench.tsx`

## Final Verification Wave (MANDATORY)
- [ ] F1. Plan Compliance — oracle
- [ ] F2. Code Quality — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright)
- [ ] F4. Scope Fidelity — deep
