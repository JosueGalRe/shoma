# Plan 03: Team Display + Bench + Swaps Overhaul

## TL;DR
> **Summary**: Replace raw champion IDs with readable champion identities across the team roster and ARAM bench. Add Anti-Tilt ban UI (shield on hovered allies). Create distinct visual treatments for Role Swap vs Pick Swap. Make the bench a horizontal scrollable strip of champion cards.
> **Deliverables**: Refactored Members, refactored Bench, Anti-Tilt Ban UI, Role/Pick Swap visual distinction.
> **Effort**: Medium
> **Parallel**: YES — Members, Bench, and Swap visuals can be done in parallel. Anti-Tilt depends on Members.
> **Critical Path**: Members refactor → Anti-Tilt Ban + Swap visuals.

## Context

### Original Request
Align with LoL 2026 social features: no banning hovered allies, clear distinction between Role Swap and Pick Swap.

### Why Separate Plan
Team display and swap interactions are socially critical — they prevent tilt and confusion. Deserves focused attention.

### Depends On
- **Plan 00**: ChampionIdentity helper.

### Metis Guardrails
- MUST use existing `championPickIntent` data for Anti-Tilt.
- Swap visuals MUST be distinct (different icons, colors, positions).
- MUST NOT implement swap request protocol logic.

## Work Objectives

### Core Objective
Make the team roster informative and socially aware, while preparing the UI for future swap interactions.

### Deliverables
1. Members with champion avatars/names, pickIntent visuals, role icons, and anti-tilt shields.
2. Bench as horizontal scrollable strip with champion avatars.
3. Anti-Tilt Ban UI: shield overlay on hovered allies during ban phase.
4. Role Swap vs Pick Swap visual distinction (iconography + color).

### Definition of Done
```bash
# 1. No raw IDs visible in members/bench
grep -n "championId.*||.*'—'" web/src/features/champ-select/components/members.tsx
# Expected: line changed to use ChampionIdentity

# 2. Build passes
bun run build
```

### Must Have
- Each member shows champion avatar + name (not raw ID).
- `pickIntent` shown at 70% opacity with pulsing border.
- Ban phase: hovered allies show shield overlay.
- Role Swap icon: ↻ (blue accent).
- Pick Swap icon: ⇄ (purple accent).

### Must NOT Have
- MUST NOT add swap request logic (protocol not ready).
- MUST NOT remove existing team/enemy team separation.

## Verification Strategy
- Playwright tests for member rendering, pickIntent state, ban phase shield.
- Mobile screenshots.

## Execution Strategy

### Dependency Matrix
| Task | Blocks | Blocked By |
|------|--------|------------|
| T1 Members refactor | T3, T4 | Plan 00-T6 (ChampionIdentity) |
| T2 Bench refactor | — | Plan 00-T6 (ChampionIdentity) |
| T3 Anti-Tilt Ban | — | Plan 03-T1 (Members refactor) |
| T4 Swap visuals | — | Plan 03-T1 (Members refactor) |

## TODOs

- [ ] T1: Refactor Members — Champion Identities + PickIntent Visuals

  **What to do**: Refactor `web/src/features/champ-select/components/members.tsx`. Replace raw `championId` with `ChampionIdentity` for all members. Add `pickIntent` visual: 70% opacity + pulsing border. In ban phase, shield icon overlay on allies with `pickIntent`. Show assigned position with role icon from `features/lobby/constants/role-icons.ts`.
  **Must NOT do**: Do not add swap buttons yet (T4).

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `frontend-ui-ux`

  **Parallelization**: YES | Blocks: Plan 03-T3, Plan 03-T4 | Blocked By: Plan 00-T6 (ChampionIdentity)

  **References**:
  - Source: `web/src/features/champ-select/components/members.tsx`
  - Helper: `web/src/features/champ-select/components/champion-identity.tsx`
  - Icons: `web/src/features/lobby/constants/role-icons.ts`
  - Data: `ChampSelectMember.championPickIntent`

  **Acceptance Criteria**:
  - [ ] No raw `championId` numbers in member cards.
  - [ ] Avatar + name shown for each member.
  - [ ] `pickIntent`: 70% opacity + pulsing border (custom keyframe: `animate-pick-intent`, ease-in-out, 2s infinite).
  - [ ] Assigned position with role icon.
  - [ ] Ban phase: shield overlay on hovered allies.
  - [ ] Champion avatar `onError` fallback to text initials.

  **QA Scenarios**:
  ```
  Scenario: Ally with pick intent
    Tool: Playwright
    Steps: Render with ally pickIntent=266
    Expected: Aatrox at 70% opacity + pulsing gold border
    Evidence: .sisyphus/evidence/plan-03-t1-pickintent.png

  Scenario: Anti-tilt shield
    Tool: Playwright
    Steps: Render in ban phase with ally pickIntent=266
    Expected: Shield icon on ally card
    Evidence: .sisyphus/evidence/plan-03-t1-shield.png
  ```

  **Commit**: YES | `feat(champ-select): refactor Members with champion identities and pick intent` | Files: `web/src/features/champ-select/components/members.tsx`

- [ ] T2: Refactor Bench — Champion Avatars + Clean Layout

  **What to do**: Refactor `web/src/features/champ-select/components/bench.tsx`. Replace raw `championId` buttons with `ChampionIdentity` cards in horizontal scrollable strip. Each card: **circular avatar** (variant of ChampionIdentity) + name + "Swap" button (`aria-label="Swap to [champion name]"`). Reroll button prominent at top. Touch targets >= 44px. Hide scrollbar visually (`scrollbar-width: none; -webkit-scrollbar: display: none;`). Ensure Swap button does not conflict with card tap target.
  **Must NOT do**: Do not remove reroll logic. Do not add Crowd Favorite/Bravery yet (Plan 04).

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `frontend-ui-ux`

  **Parallelization**: YES | Blocks: Plan 04-T1/T2 | Blocked By: Plan 00-T6 (ChampionIdentity)

  **References**:
  - Source: `web/src/features/champ-select/components/bench.tsx`
  - Helper: `web/src/features/champ-select/components/champion-identity.tsx`
  - Data: `benchChampionIds` from `useChampSelect()`

  **Acceptance Criteria**:
  - [ ] No raw `championId` numbers.
  - [ ] Horizontal scrollable strip with hidden scrollbar (`scrollbar-width: none; -webkit-scrollbar: display: none;`).
  - [ ] Each card: **circular avatar** + name + "Swap" button (`aria-label="Swap to [champion name]"`).
  - [ ] Reroll button prominent.
  - [ ] Tap targets >= 44px, Swap button does not overlap card tap area.

  **QA Scenarios**:
  ```
  Scenario: Bench shows champions with circular avatars
    Tool: Playwright
    Steps: Render bench with 3 champions
    Expected: 3 cards with circular avatars, names, and Swap buttons
    Evidence: .sisyphus/evidence/plan-03-t2-bench.png
  ```

  **Commit**: YES | `feat(champ-select): refactor Bench with champion avatars` | Files: `web/src/features/champ-select/components/bench.tsx`

- [ ] T3: Anti-Tilt Ban UI

  **What to do**: In `champion-picker.tsx`, during ban phase, check ally `championPickIntent`. If set, visually disable/warn that champion: shield overlay, disabled click, `aria-disabled="true"` + `aria-label="Ally wants to play this champion"`. On mobile tap, trigger Toast notification: "Ally wants to play this champion" instead of hover tooltip. In `members.tsx`, enhance shield from T1.
  **Must NOT do**: Do not prevent ban at protocol level. UI-only affordance.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `frontend-ui-ux`

  **Parallelization**: YES | Blocks: — | Blocked By: Plan 03-T1 (Members refactor)

  **References**:
  - Source: `web/src/features/champ-select/components/champion-picker.tsx`
  - Source: `web/src/features/champ-select/components/members.tsx`
  - Data: `team[].championPickIntent`

  **Acceptance Criteria**:
  - [ ] Ban phase: champions with ally `pickIntent` show shield in grid.
  - [ ] Those champions not selectable for ban (`aria-disabled="true"`).
  - [ ] Mobile: tapping shielded champion triggers Toast: "Ally wants to play this champion".
  - [ ] Desktop: hover shows tooltip with same message.
  - [ ] `aria-label="Ally wants to play this champion"` on disabled champion cards.

  **QA Scenarios**:
  ```
  Scenario: Cannot ban ally hovered champion
    Tool: Playwright
    Steps: Enter ban phase → verify Aatrox (ally pickIntent) disabled with shield
    Expected: Aatrox card disabled + shield
    Evidence: .sisyphus/evidence/plan-03-t3-anti-tilt.png
  ```

  **Commit**: YES | `feat(champ-select): add Anti-Tilt ban UI` | Files: `web/src/features/champ-select/components/champion-picker.tsx`, `members.tsx`

- [ ] T4: Role Swap vs Pick Swap Visual Distinction (Gated)

  **What to do**: Add UI shell for swap requests in `members.tsx`. Two distinct buttons grouped to the right edge:
  - **Role Swap**: ↻ icon (blue accent), label "Swap Role", `aria-label="Swap Role with [player name]"`. Near position.
  - **Pick Swap**: ⇄ icon (purple accent), label "Swap Pick", `aria-label="Swap Pick with [player name]"`. Near champion.
  Hidden unless swap data exists. If unavailable, disabled/placeholder or hidden.
  **Must NOT do**: Do not implement swap request logic.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `frontend-ui-ux`

  **Parallelization**: YES | Blocks: — | Blocked By: Plan 03-T1 (Members refactor)

  **References**:
  - Source: `web/src/features/champ-select/components/members.tsx`
  - Icons: Lucide `ArrowLeftRight`, `RotateCw`

  **Acceptance Criteria**:
  - [ ] Role Swap: ↻ + blue accent, `aria-label` includes player name.
  - [ ] Pick Swap: ⇄ + purple accent, `aria-label` includes player name.
  - [ ] Both buttons: touch targets >= 44px.
  - [ ] Buttons grouped to right edge to avoid clutter on 360px viewports.
  - [ ] Hidden unless swap data available (or disabled).
  - [ ] Touch targets >= 44×44px (even if visual icon is smaller).
  - [ ] Buttons grouped to right edge to avoid clutter on narrow viewports.

  **QA Scenarios**:
  ```
  Scenario: Swap buttons distinct
    Tool: Playwright
    Steps: Render with swap data
    Expected: Role Swap = blue ↻, Pick Swap = purple ⇄
    Evidence: .sisyphus/evidence/plan-03-t4-swap.png
  ```

  **Commit**: YES | `feat(champ-select): add Role Swap vs Pick Swap visuals` | Files: `web/src/features/champ-select/components/members.tsx`

## Final Verification Wave (MANDATORY)
- [ ] F1. Plan Compliance — oracle
- [ ] F2. Code Quality — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright)
- [ ] F4. Scope Fidelity — deep
