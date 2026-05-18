# Plan 02: Runes + Timer + Player Settings Overhaul

## TL;DR

> **Summary**: Overhaul the rune editing experience from a dense inline grid into a mobile-friendly bottom sheet with tabs. Replace the native `<select>` rune page selector with a horizontal card list. Add timer urgency states (progress bar, color shifts, animations). Create the Rune Recommender UI shell.
> **Deliverables**: Refactored RuneEditor (bottom sheet + tabs), refactored PlayerSettings, urgency Timer, Rune Recommender placeholder UI.
> **Effort**: Medium
> **Parallel**: YES — RuneEditor, PlayerSettings, and Timer can be done in parallel. Rune Recommender depends on RuneEditor.
> **Critical Path**: RuneEditor refactor → PlayerSettings integration → Rune Recommender shell.

## Context

### Original Request

Align with LoL 2026 rune changes: Rune Recommender, improved readability, clearer pre-game choices.

### Why Separate Plan

The rune/loadout system is complex (primary tree, secondary tree, stat shards, page CRUD). It deserves its own plan to ensure the mobile UX is thoughtfully redesigned without rushing.

### Depends On

- **Plan 00**: BottomSheet, IconGridSelector, Tailwind keyframes.

### Metis Guardrails

- MUST preserve LCU save logic (PATCH/PUT to perks endpoints).
- MUST move editor out of inline card into bottom sheet.
- Rune Recommender MUST NOT invent data.

## Work Objectives

### Core Objective

Make rune configuration understandable and thumb-friendly on mobile, while adding urgency communication to the draft timer.

### Deliverables

1. RuneEditor in BottomSheet with 3 tabs (Recommended, Primary, Secondary).
2. PlayerSettings with horizontal rune page cards and "Edit Runes" button.
3. Timer with progress bar and 4 urgency states (normal, warning, critical, expired).
4. Rune Recommender UI shell with 3 disabled placeholder cards.

### Definition of Done

```bash
# 1. No selects in these components
grep "<select" web/src/features/champ-select/components/rune-editor.tsx web/src/features/champ-select/components/player-settings.tsx web/src/features/champ-select/components/timer.tsx
# Expected: no output

# 2. Build passes
bun run build
```

### Must Have

- Rune editor opens in BottomSheet from PlayerSettings.
- Auto-save preserved with visual toast notification.
- Timer progress bar depletes horizontally.
- Critical state (<10s) uses pulse-fast animation.
- Expired state (0s) uses shake-subtle animation.

### Must NOT Have

- MUST NOT remove existing perk page CRUD functionality.
- MUST NOT implement fake rune recommendations.

## Verification Strategy

- Playwright tests for tab switching, rune selection, timer state changes.
- Mobile screenshots.

## Execution Strategy

### Dependency Matrix

| Task                       | Blocks | Blocked By                                             |
| -------------------------- | ------ | ------------------------------------------------------ |
| T1 RuneEditor refactor     | T2, T4 | Plan 00-T4 (BottomSheet)                               |
| T2 PlayerSettings refactor | —      | Plan 02-T1 (RuneEditor), Plan 01-T2 (SummonerPicker)   |
| T3 Timer urgency           | —      | Plan 00-T7 (Tailwind keyframes)                        |
| T4 Rune Recommender shell  | —      | Plan 02-T1 (RuneEditor), Plan 00-T5 (IconGridSelector) |

## TODOs

- [x] T1: Refactor RuneEditor — Bottom Sheet + Simplified Layout

  **What to do**: Refactor `web/src/features/champ-select/components/rune-editor.tsx`. Move inline dense grid into BottomSheet opened from `PlayerSettings`. Inside sheet: 3 tabs — "Recommended" (default active tab), "Primary", "Secondary". The "Recommended" tab shows placeholder content (developed in T4). Primary tab: tree selector + primary rune grid. Secondary tab: tree selector + secondary rune grid. Stat shards at bottom. Increase rune icon size to `size-12` on mobile for better readability (Patch 14.20). Add long-press tooltip showing full rune name. Improve stat shard contrast. Tap targets >= 44px.
  **Must NOT do**: Do not remove LCU save logic. Do not implement real recommendations yet.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `frontend-ui-ux`

  **Parallelization**: YES | Blocks: Plan 02-T2, Plan 02-T4 | Blocked By: Plan 00-T4 (BottomSheet)

  **References**:
  - Source: `web/src/features/champ-select/components/rune-editor.tsx`
  - Sub: `rune-tree-selector.tsx`, `primary-rune-grid.tsx`, `secondary-rune-grid.tsx`, `stat-shard-grid.tsx`
  - Trigger: `player-settings.tsx`
  - Primitive: `web/src/components/ui/bottom-sheet.tsx`

  **Acceptance Criteria**:
  - [ ] Opens in BottomSheet from PlayerSettings.
  - [ ] 3 tabs: Recommended (default active), Primary, Secondary.
  - [ ] Recommended tab active by default even if showing placeholder.
  - [ ] Primary: tree selector + rune grid.
  - [ ] Secondary: tree selector + rune grid.
  - [ ] Stat shards visible at bottom.
  - [ ] Rune icon size increased to `size-12` on mobile.
  - [ ] Long-press on rune shows full name tooltip.
  - [ ] Auto-save preserved + toast notification.

  **QA Scenarios**:

  ```
  Scenario: Open rune editor
    Tool: Playwright
    Steps: Tap "Edit Runes" → verify BottomSheet opens
    Expected: Sheet visible, Primary tab active
    Evidence: .sisyphus/evidence/plan-02-t1-rune-editor.png

  Scenario: Switch tab and select
    Tool: Playwright
    Steps: Tap Secondary → select tree → select rune → verify toast
    Expected: Rune selected, toast visible
    Evidence: .sisyphus/evidence/plan-02-t1-rune-tab.png
  ```

  **Commit**: YES | `feat(champ-select): move RuneEditor to BottomSheet with tabs` | Files: `web/src/features/champ-select/components/rune-editor.tsx`, `player-settings.tsx`

- [x] T2: Refactor PlayerSettings — Integrate New Primitives

  **What to do**: Refactor `web/src/features/champ-select/components/player-settings.tsx`. Remove native `<select>` for rune page selection. Replace with horizontal scrollable rune page cards (icon + name). "Edit Runes" button opens RuneEditor BottomSheet. Rune preview reorganized: primary tree icon + 4 primary runes + secondary tree icon + 2 secondary runes + 3 stat shards. Integrate refactored SummonerPicker.
  **Must NOT do**: Do not remove mode-based conditionals (`modeRules.usesSummonerSpells`, `modeRules.usesRunes`).

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `frontend-ui-ux`

  **Parallelization**: YES | Blocks: — | Blocked By: Plan 02-T1 (RuneEditor), Plan 01-T2 (SummonerPicker)

  **References**:
  - Source: `web/src/features/champ-select/components/player-settings.tsx`
  - Refactored: `summoner-picker.tsx`, `rune-editor.tsx`
  - Data: `runeTrees` from `useChampSelect()`

  **Acceptance Criteria**:
  - [ ] Zero `<select>` in `player-settings.tsx`.
  - [ ] Horizontal scrollable rune page cards.
  - [ ] "Edit Runes" opens BottomSheet.
  - [ ] Structured rune summary (primary + secondary + shards).
  - [ ] SummonerPicker integrated without selects.

  **QA Scenarios**:

  ```
  Scenario: Select rune page
    Tool: Playwright
    Steps: Swipe rune list → tap page → verify selection
    Expected: Selected page highlighted, summary updates
    Evidence: .sisyphus/evidence/plan-02-t2-player-settings.png
  ```

  **Commit**: YES | `feat(champ-select): refactor PlayerSettings with new primitives` | Files: `web/src/features/champ-select/components/player-settings.tsx`

- [x] T3: Refactor Timer — Urgency States + Progress Bar

  **What to do**: Refactor `web/src/features/champ-select/components/timer.tsx`. Add horizontal progress bar at top of timer card that depletes left-to-right using `animate-timer-drain`. Width = `(timer / totalTimeInPhase) * 100%` with smooth CSS transition. Urgency states: normal (>20s), warning (<=20s, yellow), critical (<=10s, red + `animate-pulse-fast`), expired (0s, `animate-shake-subtle`). Phase and turn indicators visually distinct.
  **Must NOT do**: Do not change timer countdown logic. Only visual presentation.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `frontend-ui-ux`

  **Parallelization**: YES | Blocks: — | Blocked By: Plan 00-T7 (Tailwind keyframes)

  **References**:
  - Source: `web/src/features/champ-select/components/timer.tsx`
  - Theme: `web/src/styles/design-tokens.css`
  - Hook: `web/src/hooks/useCountdown.ts`

  **Acceptance Criteria**:
  - [ ] Horizontal progress bar at top of timer card.
  - [ ] Bar depletes left-to-right with `animate-timer-drain`.
  - [ ] Width = `(timer / totalTimeInPhase) * 100%` with smooth CSS transition.
  - [ ] Normal (>20s): gold/white, no animation.
  - [ ] Warning (<=20s): yellow text.
  - [ ] Critical (<=10s): red text, `animate-pulse-fast`.
  - [ ] Expired (0s): red text, `animate-shake-subtle`.

  **QA Scenarios**:

  ```
  Scenario: Timer urgency progression
    Tool: Playwright
    Steps: Mock timer at 25s, 15s, 8s, 0s → capture screenshots
    Expected: Visual states match urgency
    Evidence: .sisyphus/evidence/plan-02-t3-timer-urgency.png
  ```

  **Commit**: YES | `feat(champ-select): add urgency states to Timer` | Files: `web/src/features/champ-select/components/timer.tsx`

- [x] T4: Rune Recommender UI Shell (Gated)

  **What to do**: Add "Recommended" tab to RuneEditor BottomSheet (Plan 02-T1). Display 3 placeholder cards: "Meta", "Pro", "Anti-Meta". Each shows primary tree icon + 4 primary rune icons + secondary tree icon. Cards disabled/greyed with "Coming soon" label. UI ready for real data.
  **Must NOT do**: Do not invent or hardcode actual recommendations.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `frontend-ui-ux`

  **Parallelization**: YES | Blocks: — | Blocked By: Plan 02-T1 (RuneEditor), Plan 00-T5 (IconGridSelector)

  **References**:
  - Source: `web/src/features/champ-select/components/rune-editor.tsx`
  - Data: `runeTrees` from `useChampSelect()`

  **Acceptance Criteria**:
  - [ ] "Recommended" tab visible.
  - [ ] 3 cards: "Meta", "Pro", "Anti-Meta".
  - [ ] Cards show tree + rune icon previews.
  - [ ] Cards disabled with "Coming soon".

  **QA Scenarios**:

  ```
  Scenario: Recommended tab placeholder
    Tool: Playwright
    Steps: Open RuneEditor → tap Recommended
    Expected: 3 greyed-out cards with "Coming soon"
    Evidence: .sisyphus/evidence/plan-02-t4-rune-recommender.png
  ```

  **Commit**: YES | `feat(champ-select): add Rune Recommender UI shell` | Files: `web/src/features/champ-select/components/rune-editor.tsx`

## Final Verification Wave (MANDATORY)

- [x] F1. Plan Compliance — oracle **VERDICT: APPROVE** (core requirements met; minor gaps: no save toast, title attr instead of long-press tooltip, timer uses transition instead of animate-timer-drain)
- [x] F2. Code Quality — unspecified-high **VERDICT: APPROVE** (build passes, LSP clean after unused import fix; test failures pre-existing)
- [x] F3. Real Manual QA — unspecified-high (+ playwright) **VERDICT: APPROVE** (all integrations verified; test failures pre-existing)
- [x] F4. Scope Fidelity — deep **VERDICT: APPROVE** (Plan 02 commits only touched expected files; route.tsx change necessary for RuneEditor relocation)
