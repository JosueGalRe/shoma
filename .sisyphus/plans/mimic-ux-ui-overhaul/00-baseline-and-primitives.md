# Plan 00: Baseline + UI Primitives + Data Contract

## TL;DR
> **Summary**: Capture Playwright mobile screenshot baselines, audit native `<select>` usage, verify Data Dragon champion ability data availability, and build the foundational UI primitives (BottomSheet, IconGridSelector, ChampionIdentity, urgency keyframes) that all subsequent plans depend on.
> **Deliverables**: 18 baseline screenshots, select audit report, Data Dragon ability data hook, 4 reusable UI primitives.
> **Effort**: Short-Medium
> **Parallel**: YES — all 7 tasks within this plan can run in parallel after initial setup.
> **Critical Path**: All tasks are foundational and block downstream plans.

## Context

### Original Request
Part of the Mimic UX/UI overhaul to align with LoL 2026 launcher changes. This plan covers the foundation: baselines, audit, data verification, and reusable primitives.

### Why Separate Plan
All downstream plans (01-04) depend on the primitives built here. Separating ensures maximum quality on the foundation before building atop it.

### Depends On
- **Step 0: Sona Integration**: AssetResolver, fuzzy search, and LCU normalizers must be in place before ChampionIdentity (T6) can resolve champion IDs properly.

### Metis Guardrails
- MUST capture baselines BEFORE any UI changes.
- MUST verify data availability before implementing gated features.
- MUST build primitives only when reused by 2+ screens.

## Work Objectives

### Core Objective
Establish the technical foundation and UI primitive library required for the entire Mimic UX overhaul, while documenting the current state through immutable baselines.

### Deliverables
1. 18 Playwright mobile screenshots (9 screens × 2 viewports) saved as baselines.
2. Markdown report documenting every native `<select>` in champ-select/lobby.
3. `useChampionDetail(championKey)` query hook (if Data Dragon supports it) or fallback documentation.
4. Reusable `<BottomSheet>` component with full accessibility.
5. Reusable `<IconGridSelector>` component.
6. Reusable `<ChampionIdentity>` helper component.
7. Tailwind urgency animation keyframes (`timer-drain`, `pulse-fast`, `shake-subtle`).

### Definition of Done
```bash
# 1. Baselines exist
ls web/tests/e2e/baselines/*-360x800.png | wc -l  # Expected: 9
ls web/tests/e2e/baselines/*-390x844.png | wc -l  # Expected: 9

# 2. Select audit report exists
ls .sisyphus/evidence/select-audit.md

# 3. Ability data documented
ls .sisyphus/evidence/ability-data-fallback.md  # OR useChampionDetail hook exists

# 4. Primitives exist
ls web/src/components/ui/bottom-sheet.tsx
ls web/src/components/ui/icon-grid-selector.tsx
ls web/src/features/champ-select/components/champion-identity.tsx

# 5. Keyframes exist
grep "animate-timer-drain\|animate-pulse-fast\|animate-shake-subtle" web/src/styles/design-tokens.css
```

### Must Have
- Baseline screenshots at both viewports before any code changes.
- Complete audit of native `<select>` elements.
- BottomSheet with open/close animation, drag-to-dismiss, backdrop tap, focus trap, ARIA dialog.
- IconGridSelector with configurable columns, selected/disabled states, tap targets >= 44px.
- ChampionIdentity resolving id → avatar + name + title, with loading/error states.

### Must NOT Have
- MUST NOT modify any production component code (Waves 2-3 features).
- MUST NOT remove native `<select>` elements yet (that is Plan 01/02).
- MUST NOT add speculative 2027 features.

## Verification Strategy
- **Test decision**: Tests-after. Playwright for screenshots. Bun for primitive unit tests.
- **QA policy**: Every task has agent-executed verification.
- **Evidence**: `.sisyphus/evidence/plan-00-{task}.{ext}`.

## Execution Strategy

### Execution Order
**Phase 1 (Sequential)**: T1 Baseline screenshots MUST complete before any UI code changes. T2 Select audit can run alongside T1.

**Phase 2 (Parallel)**: T3, T4, T5, T6, T7 can execute in parallel once T1 is complete. T2 can also finish in Phase 2 if it hasn't already.

### Agent Dispatch Summary
| Task | Category | Skills | Phase |
|------|----------|--------|-------|
| T1 Baseline screenshots | unspecified-high | playwright | 1 |
| T2 Select audit | unspecified-high | — | 1 or 2 |
| T3 Data Dragon check | deep | — | 2 |
| T4 BottomSheet | visual-engineering | frontend-ui-ux | 2 |
| T5 IconGridSelector | visual-engineering | frontend-ui-ux | 2 |
| T6 ChampionIdentity | visual-engineering | — | 2 |
| T7 Tailwind keyframes | visual-engineering | — | 2 |

## TODOs

- [x] T1: Capture Playwright Mobile Screenshot Baselines

  **What to do**: Before any UI changes, set up Playwright for mobile baseline capture and take screenshots. Steps: (1) Add `Mobile-360` and `Mobile-390` projects to `web/playwright.config.ts` with viewports `360x800` and `390x844`. (2) Extend `web/tests/e2e/screenshots.pw.ts` to cover 9 pre-game screens/states: lobby, role picker, champion picker grid, summoner spell selection, rune editor, ban phase, pick phase, ARAM bench, and ready-check overlay. (3) Run the test to generate 18 baseline files (9 screens × 2 viewports) into `web/tests/e2e/baselines/`.
  **Must NOT do**: Do not modify production component source code (only test/config files).

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: `playwright`

  **Parallelization**: YES | Blocks: Plan 05-T1 | Blocked By: —

  **References**:
  - `web/tests/e2e/screenshots.pw.ts` — existing screenshot tests
  - `web/playwright.config.ts` — Playwright configuration
  - `web/src/routes/connected/lobby/route.tsx`
  - `web/src/routes/connected/champ-select/route.tsx`

  **Acceptance Criteria**:
  - [ ] `web/playwright.config.ts` has `Mobile-360` (360×800) and `Mobile-390` (390×844) projects.
  - [ ] `web/tests/e2e/screenshots.pw.ts` covers 9 screens/states.
  - [ ] 18 files created (9 screens × 2 viewports).
  - [ ] Files at `web/tests/e2e/baselines/{screen}-{viewport}.png`.

  **QA Scenarios**:
  ```
  Scenario: Baseline capture at 360×800
    Tool: Bash
    Steps: cd web && npx playwright test tests/e2e/screenshots.pw.ts --project=Mobile-360
    Expected: 9 baseline files created
    Evidence: .sisyphus/evidence/plan-00-t1-baseline-360.png

  Scenario: Baseline capture at 390×844
    Tool: Bash
    Steps: cd web && npx playwright test tests/e2e/screenshots.pw.ts --project=Mobile-390
    Expected: 9 baseline files created
    Evidence: .sisyphus/evidence/plan-00-t1-baseline-390.png
  ```

  **Commit**: NO

- [x] T2: Audit Native `<select>` Usage

  **What to do**: Search `web/src/features/champ-select/` and `web/src/features/lobby/` for all native `<select>` elements. Document file path, line number, and replacement strategy. Save report to `.sisyphus/evidence/select-audit.md`.
  **Must NOT do**: Do not modify files.

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: []

  **Parallelization**: YES | Blocks: Plans 01-03 | Blocked By: —

  **Acceptance Criteria**:
  - [ ] `grep -R "<select" web/src/features/champ-select web/src/features/lobby` output documented.
  - [ ] Report saved.

  **QA Scenarios**:
  ```
  Scenario: Complete audit
    Tool: Bash
    Steps: grep -R "<select" web/src/features/champ-select web/src/features/lobby
    Expected: All matches documented
    Evidence: .sisyphus/evidence/select-audit.md
  ```

  **Commit**: NO

- [x] T3: Verify Data Dragon Champion Ability Data

  **What to do**: Check if `https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion/{key}.json` returns spell data. If yes, add `useChampionDetail(championKey)` query hook in `ddragon-client.ts`. If no, document fallback.
  **Must NOT do**: Do not implement Ability Preview UI yet.

  **Recommended Agent Profile**:
  - Category: `deep`
  - Skills: []

  **Parallelization**: YES | Blocks: Plan 01-T3 | Blocked By: —

  **References**:
  - `web/src/core/http/ddragon-client.ts`
  - Data Dragon API docs

  **Acceptance Criteria**:
  - [ ] Verified via curl/jq that spell data exists.
  - [ ] Hook added OR fallback documented.

  **QA Scenarios**:
  ```
  Scenario: Data availability
    Tool: Bash
    Steps: curl -s "https://ddragon.leagueoflegends.com/cdn/15.1.1/data/en_US/champion/Aatrox.json" | jq '.data.Aatrox.spells | length'
    Expected: 4
    Evidence: .sisyphus/evidence/plan-00-t3-spells.json
  ```

  **Commit**: YES | `chore(web): add champion detail query for ability preview data` | Files: `web/src/core/http/ddragon-client.ts`

- [x] T4: Create `<BottomSheet>` Reusable Primitive

  **What to do**: Build/enhance `web/src/components/ui/bottom-sheet.tsx`. Must support: open/close animation, drag-to-dismiss, backdrop tap-to-close, focus trap, ARIA dialog semantics, max-height 90vh, scrollable content. Use CSS transitions + React state.
  **Must NOT do**: No external libraries like react-modal/react-spring.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `frontend-ui-ux`

  **Parallelization**: YES | Blocks: Plans 01-04 | Blocked By: —

  **References**:
  - `web/src/components/ui/bottom-sheet.tsx` (existing)
  - Tailwind: `transition-transform`, `translate-y-full`

  **Acceptance Criteria**:
  - [ ] Slide-up animation (200ms ease-out).
  - [ ] Closes on backdrop tap, drag down, Escape.
  - [ ] Focus returns to trigger on close.
  - [ ] Scrollable content area.
  - [ ] Renders at 360x800 without overflow.

  **QA Scenarios**:
  ```
  Scenario: Open/close on mobile
    Tool: Playwright
    Steps: Tap trigger → verify sheet up → tap backdrop → verify closed
    Expected: Sheet visible then hidden
    Evidence: .sisyphus/evidence/plan-00-t4-bottom-sheet.png

  Scenario: Keyboard a11y
    Tool: Playwright
    Steps: Open sheet → press Escape → verify closed + focus returned
    Expected: Sheet closed, active element is trigger
    Evidence: .sisyphus/evidence/plan-00-t4-bottom-sheet-a11y.png
  ```

  **Commit**: YES | `feat(ui): add reusable BottomSheet primitive` | Files: `web/src/components/ui/bottom-sheet.tsx`

- [x] T5: Create `<IconGridSelector>` Reusable Primitive

  **What to do**: Build `web/src/components/ui/icon-grid-selector.tsx`. Props: `items` (array of `{id, iconUrl, name, disabled?}`), `selectedId`, `onSelect`, `columns` (default 3). Selected state: gold border/glow. Disabled: opacity 50%. Label below each icon. Tap target >= 44px.
  **Must NOT do**: No spell/rune-specific logic. Keep generic.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: `frontend-ui-ux`

  **Parallelization**: YES | Blocks: Plans 01-04 | Blocked By: —

  **References**:
  - `web/src/features/champ-select/components/primary-rune-grid.tsx`
  - `web/src/features/champ-select/components/stat-shard-grid.tsx`

  **Acceptance Criteria**:
  - [ ] Configurable grid columns.
  - [ ] Selected: `border-lol-border-gold shadow-lol-glow-gold`.
  - [ ] Disabled: `opacity-50`, non-interactive.
  - [ ] Tap target >= 44px.
  - [ ] Name label visible.

  **QA Scenarios**:
  ```
  Scenario: Grid selection
    Tool: Playwright
    Steps: Render 6 items → tap item 3 → verify selected styling
    Expected: Item 3 has gold border
    Evidence: .sisyphus/evidence/plan-00-t5-icon-grid.png

  Scenario: Disabled item
    Tool: Playwright
    Steps: Render with disabled item → tap it → verify no change
    Expected: onSelect not called
    Evidence: .sisyphus/evidence/plan-00-t5-icon-grid-disabled.png
  ```

  **Commit**: YES | `feat(ui): add IconGridSelector primitive` | Files: `web/src/components/ui/icon-grid-selector.tsx`

- [x] T6: Create `<ChampionIdentity>` Helper Component

  **What to do**: Build `web/src/features/champ-select/components/champion-identity.tsx`. Accepts `championId` + optional `size`. Resolves via `useChampions()` to `{name, title, avatarUrl, splashUrl}`. Shows circular avatar + name + optional title. Loading: skeleton shimmer. Error: fallback to championId string.
  **Must NOT do**: Do not duplicate Data Dragon fetching.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: []

  **Parallelization**: YES | Blocks: Plans 01, 03, 04 | Blocked By: Step 0-T2 (AssetResolver)

  **References**:
  - `web/src/core/http/ddragon-client.ts` — `useChampions()`
  - `web/src/features/champ-select/components/members.tsx`
  - `web/src/features/champ-select/components/bench.tsx`

  **Acceptance Criteria**:
  - [ ] Component exported.
  - [ ] Shows avatar + name + optional title.
  - [ ] Skeleton loading state.
  - [ ] Error fallback to string.

  **QA Scenarios**:
  ```
  Scenario: Known champion
    Tool: Playwright
    Steps: Render with championId 266
    Expected: Shows "Aatrox" + avatar
    Evidence: .sisyphus/evidence/plan-00-t6-champion-identity.png

  Scenario: Unknown champion
    Tool: Playwright
    Steps: Render with championId 99999
    Expected: Shows "99999" fallback
    Evidence: .sisyphus/evidence/plan-00-t6-champion-identity-fallback.png
  ```

  **Commit**: YES | `feat(champ-select): add ChampionIdentity helper` | Files: `web/src/features/champ-select/components/champion-identity.tsx`

- [x] T7: Extend Tailwind with Urgency Animation Keyframes

  **What to do**: Add `@keyframes timer-drain`, `@keyframes pulse-fast`, `@keyframes shake-subtle` to Tailwind v4 theme (via `@theme` block or CSS custom properties in `design-tokens.css`). Define utilities: `animate-timer-drain`, `animate-pulse-fast`, `animate-shake-subtle`. Additionally, add `@keyframes fade-in-up` with stagger utilities (`animate-fade-in-up-0`, `animate-fade-in-up-100`, `animate-fade-in-up-200`, etc.) for staggered list reveals (used by Plans 01, 03, 04).
  **Must NOT do**: No arbitrary values in JSX.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: []

  **Parallelization**: YES | Blocks: Plan 02-T3 | Blocked By: —

  **References**:
  - `web/src/styles/design-tokens.css`
  - `web/src/styles.css` or `web/src/index.css` — Tailwind v4 CSS entry point

  **Acceptance Criteria**:
  - [ ] Three animation classes available.
  - [ ] timer-drain: linear, 1s.
  - [ ] pulse-fast: 0.5s.
  - [ ] shake-subtle: 0.3s.
  - [ ] fade-in-up: translateY(10px) → 0 + opacity 0 → 1, duration 300ms, ease-out.
  - [ ] Stagger delay utilities: 0ms, 100ms, 200ms, 300ms, 400ms available.

  **QA Scenarios**:
  ```
  Scenario: Keyframes exist
    Tool: Bash
    Steps: grep "animate-timer-drain\|animate-pulse-fast\|animate-shake-subtle\|animate-fade-in-up" web/src/styles/design-tokens.css
    Expected: All four defined
    Evidence: .sisyphus/evidence/plan-00-t7-keyframes.css
  ```

  **Commit**: YES | `feat(styles): add urgency animation keyframes` | Files: `web/src/styles/design-tokens.css`

## Final Verification Wave (MANDATORY)
- [ ] F1. Plan Compliance — oracle: Verify all 7 tasks completed per spec.
- [ ] F2. Code Quality — unspecified-high: Lint, type check, no anti-patterns.
- [ ] F3. Integration QA — unspecified-high: Verify primitives work together in a test page.
- [ ] F4. Scope Check — deep: Confirm no production component code modified.
