# Plan 01: Champion Picker + Summoner Spells Overhaul

## TL;DR
> **Summary**: Transform the champion selection and summoner spell selection from dense form-like interfaces into mobile-optimized, tactile experiences. Eliminate all native `<select>` controls, add role/class filter chips, and implement Champion Ability Previews on long-press.
> **Deliverables**: Refactored ChampionPicker, refactored SummonerPicker, Champion Ability Preview feature (gated).
> **Effort**: Medium
> **Parallel**: YES — ChampionPicker and SummonerPicker can be done in parallel. Ability Preview depends on ChampionPicker refactor.
> **Critical Path**: ChampionPicker refactor → Ability Preview.

## Context

### Original Request
Align Mimic's champion selection with LoL 2026 changes: faster draft, Champion Ability Previews, improved filtering.

### Why Separate Plan
Champion selection is the most critical and highest-traffic screen in Mimic. It deserves dedicated focus without distraction from other features.

### Depends On
- **Plan 00**: BottomSheet, IconGridSelector, ChampionIdentity, Tailwind keyframes.
- **Plan 00 (T3)**: Data Dragon ability data availability (for gated Ability Preview).

### Metis Guardrails
- MUST eliminate all native `<select>` from these components.
- MUST maintain ARAM card functionality.
- Ability Preview MUST be gated on data availability.

## Work Objectives

### Core Objective
Make champion and spell selection feel native, fast, and visually informative on mobile.

### Deliverables
1. ChampionPicker with custom sort/filter chips (no native `<select>`).
2. SummonerPicker with icon grid modal (no native `<select>`).
3. Champion Ability Preview on long-press (gated).

### Definition of Done
```bash
# 1. No selects in these components
grep "<select" web/src/features/champ-select/components/champion-picker.tsx web/src/features/champ-select/components/summoner-picker.tsx
# Expected: no output

# 2. Build passes
bun run build
```

### Must Have
- Role/class filter chips (Assassin, Fighter, Mage, Marksman, Support, Tank).
- Sort chips (Name A-Z, Name Z-A).
- Touch targets >= 44px on all chips and grid items.
- Summoner spell grid with large icons (size-16) in BottomSheet.
- ARAM mode preserved with existing card functionality.

### Must NOT Have
- MUST NOT break existing pick/ban/lock-in logic.
- MUST NOT preload ability data for all champions (fetch on-demand).

## Verification Strategy
- Playwright interaction tests for sort, filter, spell selection.
- Mobile screenshots at 360x800 and 390x844.

## Execution Strategy

### Dependency Matrix
| Task | Blocks | Blocked By |
|------|--------|------------|
| T1 ChampionPicker refactor | T3 | Plan 00-T4 (BottomSheet), Plan 00-T6 (ChampionIdentity) |
| T2 SummonerPicker refactor | — | Plan 00-T4 (BottomSheet), Plan 00-T5 (IconGridSelector) |
| T3 Ability Preview | — | Plan 00-T3 (data check), T1 (ChampionPicker refactor) |

## TODOs

- [ ] T1: Refactor ChampionPicker — Eliminate Native Select + Add Filters

  **What to do**: Refactor `web/src/features/champ-select/components/champion-picker.tsx`. Replace native `<select>` for sorting with horizontal scrollable chip list (Name A-Z, Name Z-A). Add role/class filter chips (Assassin, Fighter, Mage, Marksman, Support, Tank) using `champion.tags` from Data Dragon. Touch targets >= 44px. Use `ChampionIdentity` for names. Preserve ARAM mode. Add distinct visual states for banned/picked champions: **Banned** = grayscale 100% + dark red overlay (`bg-red-900/40`) + "BANNED" label; **Picked** = opacity 50% + "PICKED" label; **Selected** = gold border + glow (existing).
  **Must NOT do**: Do not add Ability Preview logic yet (T3). Do not break pick/ban/lock-in.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `frontend-ui-ux`, `vercel-react-best-practices`

  **Parallelization**: YES | Blocks: Plan 01-T3, Plan 04-T1/T2 | Blocked By: Plan 00-T4 (BottomSheet), Plan 00-T6 (ChampionIdentity)

  **References**:
  - Source: `web/src/features/champ-select/components/champion-picker.tsx`
  - Data: `useChampions()` returns `tags` array
  - Primitive: `web/src/components/ui/bottom-sheet.tsx`
  - Helper: `web/src/features/champ-select/components/champion-identity.tsx`

  **Acceptance Criteria**:
  - [ ] Zero `<select>` in `champion-picker.tsx`.
  - [ ] Sort chips: Name (A-Z), Name (Z-A).
  - [ ] Filter chips: 6 role/class options.
  - [ ] Active chips have gold border.
  - [ ] Banned champions: grayscale + dark red overlay + "BANNED" label.
  - [ ] Picked champions: opacity 50% + "PICKED" label.
  - [ ] Tap targets >= 44px.
  - [ ] ARAM card mode preserved.

  **QA Scenarios**:
  ```
  Scenario: Sort on mobile
    Tool: Playwright
    Steps: Open picker → tap "Name Z-A" → verify first champion
    Expected: Grid reorders correctly
    Evidence: .sisyphus/evidence/plan-01-t1-sort.png

  Scenario: Filter by role
    Tool: Playwright
    Steps: Tap "Mage" → verify only mages visible
    Expected: Grid filtered
    Evidence: .sisyphus/evidence/plan-01-t1-filter.png

  Scenario: Banned champion visual state
    Tool: Playwright
    Steps: Render with banned champion → verify grayscale + red overlay + label
    Expected: Champion card shows "BANNED" with grayscale and red tint
    Evidence: .sisyphus/evidence/plan-01-t1-banned.png
  ```

  **Commit**: YES | `feat(champ-select): refactor ChampionPicker with custom filters` | Files: `web/src/features/champ-select/components/champion-picker.tsx`

- [ ] T2: Refactor SummonerPicker — Icon Grid Modal

  **What to do**: Refactor `web/src/features/champ-select/components/summoner-picker.tsx`. Replace both native `<select>` elements. Show two selected spell slots (icon + name). Tapping opens BottomSheet with `IconGridSelector` (3-column grid of all spells). Selecting closes sheet and updates slot.
  **Must NOT do**: No `<select>` or `<option>` elements. No hardcoded spell list.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `frontend-ui-ux`

  **Parallelization**: YES | Blocks: Plan 02-T2 | Blocked By: Plan 00-T4 (BottomSheet), Plan 00-T5 (IconGridSelector)

  **References**:
  - Source: `web/src/features/champ-select/components/summoner-picker.tsx`
  - Data: `useChampSelect().summonerSpells`
  - Primitive: `web/src/components/ui/bottom-sheet.tsx`
  - Primitive: `web/src/components/ui/icon-grid-selector.tsx`

  **Acceptance Criteria**:
  - [ ] Zero `<select>` in `summoner-picker.tsx`.
  - [ ] Two spell slots: icon (size-12) + name.
  - [ ] Tap opens BottomSheet with spell grid.
  - [ ] Select closes sheet + updates slot.
  - [ ] Tap targets >= 44px.

  **QA Scenarios**:
  ```
  Scenario: Change spell
    Tool: Playwright
    Steps: Tap spell1 → select "Flash" → verify update
    Expected: Spell1 shows Flash
    Evidence: .sisyphus/evidence/plan-01-t2-summoner-picker.png

  Scenario: Cancel selection
    Tool: Playwright
    Steps: Tap spell1 → tap backdrop → verify no change
    Expected: Spell1 unchanged
    Evidence: .sisyphus/evidence/plan-01-t2-cancel.png
  ```

  **Commit**: YES | `feat(champ-select): replace native selects in SummonerPicker with icon grid` | Files: `web/src/features/champ-select/components/summoner-picker.tsx`

- [ ] T3: Champion Ability Previews UI (Gated)

  **What to do**: Add long-press (mobile) / hover (desktop) preview to `champion-picker.tsx`. After 800ms, open small BottomSheet with champion's 4 abilities (Q, W, E, R): icon + name + short description. Data from `useChampionDetail()` (Plan 00-T3). If unavailable, show "Ability data loading..." or disable.
  **Must NOT do**: Do not preload for all champions. Fetch on-demand.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `frontend-ui-ux`

  **Parallelization**: YES | Blocks: — | Blocked By: Plan 00-T3 (data check), Plan 01-T1 (ChampionPicker refactor), Plan 00-T4 (BottomSheet)

  **References**:
  - Source: `web/src/features/champ-select/components/champion-picker.tsx`
  - Data: `useChampionDetail()` from `ddragon-client.ts`
  - Primitive: `web/src/components/ui/bottom-sheet.tsx`

  **Acceptance Criteria**:
  - [ ] Long-press opens preview after 800ms.
  - [ ] Sheet shows 4 ability icons + names + descriptions.
  - [ ] Data unavailable: placeholder or disabled.
  - [ ] Closes on tap outside or swipe down.

  **QA Scenarios**:
  ```
  Scenario: Ability preview on mobile
    Tool: Playwright
    Steps: Long-press Aatrox → verify preview sheet
    Expected: Sheet with Q, W, E, R visible
    Evidence: .sisyphus/evidence/plan-01-t3-ability-preview.png
  ```

  **Commit**: YES | `feat(champ-select): add Champion Ability Preview on long-press` | Files: `web/src/features/champ-select/components/champion-picker.tsx`

## Final Verification Wave (MANDATORY)
- [ ] F1. Plan Compliance — oracle
- [ ] F2. Code Quality — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright)
- [ ] F4. Scope Fidelity — deep
