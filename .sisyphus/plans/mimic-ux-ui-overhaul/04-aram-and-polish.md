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

- [ ] T1: ARAM Crowd Favorite Card Styling

  **What to do**: Enhance ARAM card rendering in `champion-picker.tsx`. Crowd Favorite: gold sparkling border + star icon + "Crowd Favorite" label. Gated on card metadata `type: 'crowd-favorite'`. Reuse existing `isBlessed` styling as reference.
  **Must NOT do**: Do not invent card type data.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `frontend-ui-ux`

  **Parallelization**: YES | Blocks: — | Blocked By: Plan 01-T1 (ChampionPicker refactor)

  **References**:
  - Source: `web/src/features/champ-select/components/champion-picker.tsx` (ARAM section)
  - Store: `web/src/features/champ-select/aram-store.ts`

  **Acceptance Criteria**:
  - [ ] Crowd Favorite: gold border, star icon, label.
  - [ ] Normal cards unchanged.
  - [ ] Gated on `type` metadata.

  **QA Scenarios**:
  ```
  Scenario: Crowd Favorite card
    Tool: Playwright
    Steps: Render ARAM card with type=crowd-favorite
    Expected: Gold border + star + label
    Evidence: .sisyphus/evidence/plan-04-t1-crowd-favorite.png
  ```

  **Commit**: YES | `feat(champ-select): add Crowd Favorite card styling` | Files: `web/src/features/champ-select/components/champion-picker.tsx`

- [ ] T2: ARAM Bravery Card Styling

  **What to do**: Enhance ARAM card rendering in `champion-picker.tsx`. Bravery: chaotic purple/magenta gradient border + dice icon + "Bravery" label. Gated on `type: 'bravery'`. **Before implementing**, add semantic Bravery color tokens to `web/src/styles/design-tokens.css` (e.g., `--lol-bravery-primary`, `--lol-bravery-gradient-start`, `--lol-bravery-gradient-end`). Do not hardcode hex values in components.
  **Must NOT do**: Do not invent card type data. Do not hardcode colors directly in JSX.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `frontend-ui-ux`

  **Parallelization**: YES | Blocks: — | Blocked By: Plan 01-T1 (ChampionPicker refactor)

  **References**:
  - Source: `web/src/features/champ-select/components/champion-picker.tsx` (ARAM section)
  - Store: `web/src/features/champ-select/aram-store.ts`

  **Acceptance Criteria**:
  - [ ] Bravery: purple/magenta border, dice icon, label.
  - [ ] Normal cards unchanged.
  - [ ] Gated on `type` metadata.

  **QA Scenarios**:
  ```
  Scenario: Bravery card
    Tool: Playwright
    Steps: Render ARAM card with type=bravery
    Expected: Purple border + dice + label
    Evidence: .sisyphus/evidence/plan-04-t2-bravery.png
  ```

  **Commit**: YES | `feat(champ-select): add Bravery card styling` | Files: `web/src/features/champ-select/components/champion-picker.tsx`

- [ ] T3: Climb Indicator UI Shell (Gated)

  **What to do**: Add Climb Indicator visual to lobby member cards (`web/src/features/lobby/components/lobby-member.tsx`). When a player's MMR exceeds their visible rank, show a subtle upward chevron icon or pulsing gold aura around their avatar. Gated on `mmr > visibleRank` data. If data unavailable, hide the indicator entirely.
  **Must NOT do**: Do not implement MMR calculation logic. UI-only shell.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `frontend-ui-ux`

  **Parallelization**: YES | Blocks: — | Blocked By: —

  **References**:
  - Source: `web/src/features/lobby/components/lobby-member.tsx`
  - Source: `web/src/routes/connected/lobby/route.tsx`
  - Icons: Lucide `TrendingUp` or custom chevron

  **Acceptance Criteria**:
  - [ ] Subtle chevron or gold aura visible when climb indicator active.
  - [ ] Hidden when data unavailable.
  - [ ] Does not clutter normal lobby view.
  - [ ] Tap target not affected (indicator is decorative).

  **QA Scenarios**:
  ```
  Scenario: Climb indicator visible
    Tool: Playwright
    Steps: Render lobby member with climb indicator data
    Expected: Gold chevron/aura visible near avatar
    Evidence: .sisyphus/evidence/plan-04-t3-climb-indicator.png
  ```

  **Commit**: YES | `feat(lobby): add Climb Indicator UI shell` | Files: `web/src/features/lobby/components/lobby-member.tsx`

- [ ] T4: Premade Ready Check UI (Gated)

  **What to do**: Add Ready Check modal for Swiftplay premade parties. In `web/src/routes/connected/lobby/route.tsx` or `web/src/features/lobby/`, show a full-screen overlay when host initiates ready check. Display all party members with circular progress rings that fill as they accept. Host sees "Start Queue" button only when all members are ready. Gated on premade party data.
  **Must NOT do**: Do not implement ready-check protocol logic. UI-only shell.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `frontend-ui-ux`

  **Parallelization**: YES | Blocks: — | Blocked By: —

  **References**:
  - Source: `web/src/routes/connected/lobby/route.tsx`
  - Source: `web/src/features/lobby/components/lobby-member.tsx`
  - Pattern: `web/src/features/ready-check/components/ready-check-overlay.tsx`

  **Acceptance Criteria**:
  - [ ] Full-screen overlay with member list, accounts for mobile safe areas (`env(safe-area-inset-*)`).
  - [ ] Each member has circular progress ring (`role="progressbar"`, `aria-valuenow`) that fills on accept.
  - [ ] Declined state: red ring + cross icon.
  - [ ] Timeout state: grey ring + clock icon.
  - [ ] Host "Start Queue" button disabled until all ready.
  - [ ] Hidden when not in premade or data unavailable.

  **QA Scenarios**:
  ```
  Scenario: Ready check overlay
    Tool: Playwright
    Steps: Trigger ready check in premade lobby
    Expected: Overlay visible with progress rings
    Evidence: .sisyphus/evidence/plan-04-t4-ready-check.png
  ```

  **Commit**: YES | `feat(lobby): add Premade Ready Check UI shell` | Files: `web/src/routes/connected/lobby/route.tsx`, `web/src/features/lobby/components/lobby-member.tsx`

- [ ] T5: Staggered Reveal Animations

  **What to do**: Apply staggered entrance animations to champ-select screen. Use `motion-safe:animate-fade-in-up` utilities from Plan 00-T7 with increasing delays: Timer (0ms) → Teams (100ms) → Champion Grid (200ms) → Actions Panel (300ms). Users with `prefers-reduced-motion` see instant opacity fade (no translateY). Ensures smooth visual entry without overwhelming the user.
  **Must NOT do**: Do not animate on every re-render. Only on initial mount/transition into champ-select.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `frontend-ui-ux`

  **Parallelization**: YES | Blocks: — | Blocked By: Plan 00-T7 (Tailwind keyframes)

  **References**:
  - Source: `web/src/routes/connected/champ-select/route.tsx`
  - Theme: `web/src/styles/design-tokens.css` — stagger keyframes

  **Acceptance Criteria**:
  - [ ] Timer fades in first (delay 0ms) with `motion-safe:animate-fade-in-up`.
  - [ ] Teams fade in second (delay 100ms).
  - [ ] Champion grid fades in third (delay 200ms).
  - [ ] Actions panel fades in fourth (delay 300ms).
  - [ ] Animation duration 300ms per element.
  - [ ] `prefers-reduced-motion`: instant opacity fade (no translateY).

  **QA Scenarios**:
  ```
  Scenario: Staggered entry
    Tool: Playwright
    Steps: Navigate to champ-select → record video
    Expected: Elements appear sequentially with 100ms stagger
    Evidence: .sisyphus/evidence/plan-04-t5-staggered.mp4
  ```

  **Commit**: YES | `feat(champ-select): add staggered reveal animations` | Files: `web/src/routes/connected/champ-select/route.tsx`

- [ ] T6: Skeleton Shimmer Loaders

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
