# Mimic UX/UI Overhaul: Align with LoL 2026 Launcher

## TL;DR

> **Summary**: Overhaul Mimic's mobile web UI to align with LoL 2026 launcher changes: eliminate native `<select>` controls, add Champion Ability Previews, Rune Recommender UI, Anti-Tilt ban affordances, distinct Role/Pick Swap visuals, urgency timer states, and improve mobile touch targets throughout the pre-game flow.
> **Deliverables**: 15-20 refactored components, 2-3 new UI primitives, Playwright mobile screenshot baselines, zero native `<select>` in champ-select/lobby flows.
> **Effort**: Large
> **Parallel**: YES — 5 waves
> **Critical Path**: Wave 0 (baseline) → Wave 1 (primitives) → Wave 2 (core flows) → Wave 3 (2026 features) → Wave 4 (QA)

## Context

### Original Request

User requested an investigation of LoL launcher changes in 2026 (champion select, runes, summoner spells, bans, lane selection, swaps) and a visual engineering analysis to improve Mimic's UI/UX.

### Interview Summary

- **Scope**: 2026 confirmed changes only. League Next 2027 excluded (too speculative).
- **Platform**: Mobile-first web UI (Mimic is a phone remote control for LoL client).
- **Test strategy**: Tests-after with Bun for logic, Playwright mobile screenshots for UI regression.
- **Execution**: Single plan with parallel waves.

### Metis Review (gaps addressed)

- Added **Data Availability Matrix** — features gated if backend data unavailable.
- Added explicit **Must Have / Must NOT Have** guardrails.
- Added **Wave 0** for baseline screenshot capture and data contract validation.
- Required keyboard/ARIA accessibility for all `<select>` replacements.
- Required mobile viewport targets: `360x800` (primary), `390x844` (secondary).
- Flagged scope creep risk into full LoL client clone — mitigated with hard boundaries.

## Work Objectives

### Core Objective

Transform Mimic's pre-game UI from a dense "admin panel" into a mobile-optimized, tactile experience that matches the speed and clarity of LoL's 2026 launcher, while maintaining full compatibility with the existing LCU protocol layer.

### Deliverables

1. Zero native `<select>` elements in `web/src/features/champ-select/` and `web/src/features/lobby/`.
2. Custom mobile selector primitives (bottom sheet, searchable grid).
3. Champion Ability Preview UI shell (gated — requires new Data Dragon queries).
4. Rune Recommender UI shell (gated — no LCU endpoint confirmed; local heuristic fallback).
5. Anti-Tilt ban UI: disable/warn when banning an ally's hovered champion.
6. Distinct visual treatments for Role Swap vs Pick Swap.
7. Timer urgency states: normal / warning / critical / expired.
8. Raw `championId` replaced with champion names/icons everywhere.
9. Touch targets >= 44px on all interactive elements.
10. Playwright mobile screenshot baselines for all pre-game screens.

### Definition of Done (verifiable conditions with commands)

```bash
# 1. No native selects remain
grep -R "<select" web/src/features/champ-select web/src/features/lobby
# Expected: no output

# 2. Lint, test, build pass
bun run lint
bun run test
bun run build

# 3. No raw champion IDs visible in common states
# Verified via Playwright assertions in QA scenarios

# 4. Mobile screenshots captured at 360x800 and 390x844
# Verified via Playwright test suite
```

### Must Have

- Remove all native `<select>` from champ-select and lobby mobile flows.
- Replace raw `championId` displays with champion names/icons where data exists.
- Add distinct visual treatment for Role Swap vs Pick Swap.
- Add anti-tilt ban affordance for hovered allies (using existing `championPickIntent` data).
- Improve touch targets to minimum 44px and mobile spacing.
- Add urgency states to draft timer.
- Capture Playwright mobile screenshot baselines before and after changes.

### Must NOT Have (guardrails)

- MUST NOT modify `legacy/` packages.
- MUST NOT redesign unrelated app areas outside `web/src/features/champ-select/` and `web/src/features/lobby/` unless specifically justified.
- MUST NOT add Riot-unsupported or speculative 2027 features.
- MUST NOT invent rune recommendation data without a documented source (use disabled/empty state if unavailable).
- MUST NOT modify protocol/rift/conduit packages unless the plan explicitly adds cross-package phases.
- MUST NOT add broad design-system abstractions before concrete use cases exist (create primitives only when reused by 2+ screens).

## Data Availability Matrix

| Feature                   | Required Data                                | Current Source                   | Available | Fallback Behavior                                               |
| ------------------------- | -------------------------------------------- | -------------------------------- | --------- | --------------------------------------------------------------- |
| Champion names/icons      | `champion.id` → name/key                     | Data Dragon (`useChampions`)     | YES       | Use `championId` as string                                      |
| Champion Ability Previews | Spell names/descriptions/images per champion | Data Dragon (requires new query) | PARTIAL   | UI shell with placeholder; enable when data loads               |
| Rune Recommender          | Recommended runes per champion/role          | No LCU endpoint found            | NO        | UI shell with disabled state; local heuristic fallback optional |
| Anti-Tilt Ban             | Ally `championPickIntent`                    | LCU `ChampSelectMemberSchema`    | YES       | Disable/warn ban on hovered allies                              |
| Role Swap vs Pick Swap    | Swap request states                          | Not in current LCU parsers       | NO        | UI shell with distinct icons; show only if data exists          |
| Crowd Favorite ARAM       | Special ARAM card metadata                   | Not in current LCU/session       | NO        | UI shell; reuse existing blessed card styling                   |
| Bravery ARAM              | Random champion selection flag               | Not in current LCU/session       | NO        | UI shell; toggle existing `braveryEnabled`                      |
| Climb Indicator           | MMR vs visible rank                          | Not in current LCU parsers       | NO        | Excluded from scope                                             |
| Premade Ready Check       | Party member ready states before queue       | Not in current LCU parsers       | NO        | Excluded from scope                                             |

## Verification Strategy

> ZERO HUMAN INTERVENTION — all verification is agent-executed.

- **Test decision**: Tests-after (Bun for logic, Playwright for UI/screenshots).
- **Baseline**: Capture Playwright mobile screenshots at `360x800` and `390x844` BEFORE implementation (Wave 0).
- **QA policy**: Every implementation task has agent-executed Playwright scenarios.
- **Evidence**: `.sisyphus/evidence/task-{N}-{slug}.{ext}`.

## Execution Strategy

### Parallel Execution Waves

> Target: 5-8 tasks per wave. Extract shared dependencies as Wave-1 tasks for max parallelism.

**Wave 0: Baseline + Data Contract Validation**

- Capture Playwright mobile screenshot baselines.
- Audit existing `<select>` usage.
- Verify Data Dragon champion full data availability for Ability Previews.

**Wave 1: UI Primitives**

- Create reusable `<BottomSheet>` component.
- Create reusable `<IconGridSelector>` component.
- Create reusable `<ChampionIdentity>` helper (id → avatar + name).
- Extend Tailwind theme with urgency animation keyframes.

**Wave 2: Core Flow Cleanup**

- Refactor `ChampionPicker`: replace `<select>`, add role/class filter chips.
- Refactor `SummonerPicker`: replace `<select>` with icon grid modal.
- Refactor `RuneEditor`: move to bottom sheet, simplify layout.
- Refactor `PlayerSettings`: integrate new primitives.
- Refactor `Timer`: add urgency states and progress bar.
- Refactor `Members`: replace raw IDs with champion identities.
- Refactor `Bench`: replace raw IDs with champion avatars.

**Wave 3: 2026 Feature Integrations**

- Champion Ability Previews UI (gated).
- Rune Recommender UI shell (gated).
- Anti-Tilt Ban UI (enabled — data available).
- Role Swap vs Pick Swap visual distinction (gated).
- ARAM Crowd Favorite / Bravery card styling (gated).

**Wave 4: QA Hardening**

- Playwright mobile screenshot comparison.
- Interaction tests for all custom selectors.
- Accessibility checks (focus, ARIA, keyboard).
- Final build/lint/test verification.

### Dependency Matrix (full, all tasks)

| Task                                 | Blocks              | Blocked By            |
| ------------------------------------ | ------------------- | --------------------- |
| W0-T1 Baseline screenshots           | W4-T1               | —                     |
| W0-T2 Select audit                   | W2 all              | —                     |
| W0-T3 Data Dragon ability data check | W3-T1               | —                     |
| W1-T1 BottomSheet primitive          | W2-T1, W2-T3, W3-T1 | —                     |
| W1-T2 IconGridSelector primitive     | W2-T2, W3-T2        | —                     |
| W1-T3 ChampionIdentity helper        | W2-T1, W2-T6, W2-T7 | —                     |
| W1-T4 Tailwind urgency keyframes     | W2-T5               | —                     |
| W2-T1 ChampionPicker refactor        | W3-T1               | W1-T1, W1-T3          |
| W2-T2 SummonerPicker refactor        | —                   | W1-T2                 |
| W2-T3 RuneEditor refactor            | —                   | W1-T1                 |
| W2-T4 PlayerSettings refactor        | —                   | W2-T2, W2-T3          |
| W2-T5 Timer refactor                 | —                   | W1-T4                 |
| W2-T6 Members refactor               | W3-T3, W3-T4        | W1-T3                 |
| W2-T7 Bench refactor                 | W3-T5               | W1-T3                 |
| W3-T1 Ability Previews               | —                   | W0-T3, W2-T1          |
| W3-T2 Rune Recommender               | —                   | W1-T2                 |
| W3-T3 Anti-Tilt Ban                  | —                   | W2-T6                 |
| W3-T4 Swap visuals                   | —                   | W2-T6                 |
| W3-T5 ARAM special cards             | —                   | W2-T7                 |
| W4-T1 Screenshot comparison          | —                   | W0-T1, W2 all, W3 all |
| W4-T2 Interaction tests              | —                   | W2 all                |
| W4-T3 Accessibility checks           | —                   | W2 all, W3 all        |
| W4-T4 Build/lint/test                | —                   | All above             |

### Agent Dispatch Summary (wave → task count → categories)

| Wave               | Tasks | Categories                           |
| ------------------ | ----- | ------------------------------------ |
| Wave 0             | 3     | visual-engineering, unspecified-high |
| Wave 1             | 4     | visual-engineering                   |
| Wave 2             | 7     | visual-engineering                   |
| Wave 3             | 5     | visual-engineering, deep             |
| Wave 4             | 4     | unspecified-high, visual-engineering |
| Final Verification | 4     | oracle, unspecified-high, deep       |

## TODOs

> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [ ] 1. W0-T1: Capture Playwright Mobile Screenshot Baselines

  **What to do**: Before any UI changes, capture full-page Playwright screenshots of all pre-game screens at mobile viewports (`360x800`, `390x844`). Screens: lobby, role picker, champion picker grid, champion picker with picker open, summoner spell selection, rune editor, ban phase, pick phase, ARAM bench. Store baselines in `web/tests/e2e/baselines/`.
  **Must NOT do**: Do not modify any source code in this task.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: requires careful Playwright setup and screenshot consistency.
  - Skills: `playwright` — Reason: browser automation and mobile viewport handling.
  - Omitted: `frontend-ui-ux` — Reason: no UI design work, purely QA baseline.

  **Parallelization**: Can Parallel: YES | Wave 0 | Blocks: W4-T1 | Blocked By: —

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `web/tests/e2e/` — E2E test location
  - Config: `web/playwright.config.ts` — Playwright configuration
  - Route: `web/src/routes/connected/lobby/route.tsx` — Lobby screen
  - Route: `web/src/routes/connected/champ-select/route.tsx` — Champ select screen

  **Acceptance Criteria** (agent-executable only):
  - [ ] `bun run test:e2e:baseline` captures 9 screenshots.
  - [ ] Screenshots exist at `web/tests/e2e/baselines/{screen}-{viewport}.png`.
  - [ ] No diff in `git status` for source files.

  **QA Scenarios** (MANDATORY):

  ```
  Scenario: Baseline capture success
    Tool: Bash
    Steps: Run baseline capture script
    Expected: 18 files created (9 screens × 2 viewports)
    Evidence: .sisyphus/evidence/task-1-baseline-capture.png
  ```

  **Commit**: NO

- [ ] 2. W0-T2: Audit Native `<select>` Usage

  **What to do**: Search `web/src/features/champ-select/` and `web/src/features/lobby/` for all native `<select>` elements. Document file path, line number, and replacement strategy for each. Report count.
  **Must NOT do**: Do not modify files yet.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: read-only audit, low complexity.
  - Skills: [] — Reason: grep + documentation only.

  **Parallelization**: Can Parallel: YES | Wave 0 | Blocks: W2 all | Blocked By: —

  **References**:
  - Search path: `web/src/features/champ-select/`
  - Search path: `web/src/features/lobby/`

  **Acceptance Criteria**:
  - [ ] `grep -R "<select" web/src/features/champ-select web/src/features/lobby` output documented.
  - [ ] Markdown report saved to `.sisyphus/evidence/select-audit.md` listing each occurrence.

  **QA Scenarios**:

  ```
  Scenario: Complete audit
    Tool: Bash
    Steps: grep -R "<select" web/src/features/champ-select web/src/features/lobby
    Expected: All matches documented with file:line
    Evidence: .sisyphus/evidence/task-2-select-audit.md
  ```

  **Commit**: NO

- [ ] 3. W0-T3: Verify Data Dragon Champion Full Data

  **What to do**: Check if Data Dragon provides champion spell data (Q, W, E, R names, descriptions, images) per champion. If yes, determine the API endpoint and add a query hook. If no, document fallback.
  **Must NOT do**: Do not implement the full Ability Preview feature yet.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: requires investigating external API availability.
  - Skills: [] — Reason: API investigation.

  **Parallelization**: Can Parallel: YES | Wave 0 | Blocks: W3-T1 | Blocked By: —

  **References**:
  - Client: `web/src/core/http/ddragon-client.ts` — existing Data Dragon client
  - Pattern: `useChampions()` hook — existing champion data query
  - Data Dragon docs: `https://developer.riotgames.com/docs/lol#data-dragon_champions`

  **Acceptance Criteria**:
  - [ ] Determined if `https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion/{championKey}.json` returns spell data.
  - [ ] If available: added `useChampionDetail(championKey)` query hook in `ddragon-client.ts`.
  - [ ] If unavailable: documented fallback in `.sisyphus/evidence/ability-data-fallback.md`.

  **QA Scenarios**:

  ```
  Scenario: Data availability check
    Tool: Bash
    Steps: curl -s "https://ddragon.leagueoflegends.com/cdn/15.1.1/data/en_US/champion/Aatrox.json" | jq '.data.Aatrox.spells | length'
    Expected: Returns 4 (Q, W, E, R spells)
    Evidence: .sisyphus/evidence/task-3-ddragon-spells.json
  ```

  **Commit**: YES | Message: `chore(web): add champion detail query for ability preview data` | Files: `web/src/core/http/ddragon-client.ts`

- [ ] 4. W1-T1: Create `<BottomSheet>` Reusable Primitive

  **What to do**: Build a reusable BottomSheet component in `web/src/components/ui/bottom-sheet.tsx` (or enhance existing). Must support: open/close animation, drag-to-dismiss, backdrop tap-to-close, focus trap, ARIA dialog semantics, max-height 90vh, scrollable content area. Use it for rune editor, spell picker, and ability preview.
  **Must NOT do**: Do not use external libraries like react-modal or react-spring. Use CSS transitions/animations + React state.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: mobile interaction primitive.
  - Skills: `frontend-ui-ux` — Reason: tactile mobile interactions.
  - Omitted: `vercel-composition-patterns` — Reason: not a component composition problem.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: W2-T1, W2-T3, W3-T1 | Blocked By: —

  **References**:
  - Existing: `web/src/components/ui/bottom-sheet.tsx` — check if exists and enhance
  - Pattern: shadcn/ui Dialog primitive — `web/src/components/ui/dialog.tsx`
  - Tailwind: `transition-transform`, `translate-y-full`, `translate-y-0`
  - ARIA: `role="dialog"`, `aria-modal="true"`, focus management with `useRef`

  **Acceptance Criteria**:
  - [ ] Component exported from `web/src/components/ui/bottom-sheet.tsx`.
  - [ ] Opens with slide-up animation (200ms ease-out).
  - [ ] Closes on backdrop tap, drag down, or Escape key.
  - [ ] Focus returns to trigger element on close.
  - [ ] Content area scrollable when content exceeds max-height.
  - [ ] Renders correctly at `360x800` without overflow.

  **QA Scenarios**:

  ```
  Scenario: BottomSheet open/close on mobile
    Tool: Playwright
    Steps: Navigate to test page, tap trigger, verify sheet slides up, tap backdrop, verify closes
    Expected: Sheet visible after tap, hidden after backdrop tap
    Evidence: .sisyphus/evidence/task-4-bottom-sheet.png

  Scenario: Keyboard accessibility
    Tool: Playwright
    Steps: Open sheet, press Escape, verify closed and focus returned
    Expected: Sheet closed, active element is trigger button
    Evidence: .sisyphus/evidence/task-4-bottom-sheet-a11y.png
  ```

  **Commit**: YES | Message: `feat(ui): add reusable BottomSheet primitive` | Files: `web/src/components/ui/bottom-sheet.tsx`

- [ ] 5. W1-T2: Create `<IconGridSelector>` Reusable Primitive

  **What to do**: Build a reusable IconGridSelector component for selecting items from a grid of icons (spells, runes, skins). Props: `items` (array of `{id, iconUrl, name, disabled?}`), `selectedId`, `onSelect`, `columns` (default 3). Must show selected state with gold border/glow, disabled state with opacity, and label tooltip on long-press/hover.
  **Must NOT do**: Do not hardcode spell or rune-specific logic. Keep it generic.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: visual grid interaction.
  - Skills: `frontend-ui-ux` — Reason: touch-optimized grid.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: W2-T2, W3-T2 | Blocked By: —

  **References**:
  - Pattern: `web/src/features/champ-select/components/primary-rune-grid.tsx` — existing rune grid
  - Pattern: `web/src/features/champ-select/components/stat-shard-grid.tsx` — existing shard grid
  - Tailwind: `grid-cols-3`, `gap-2`, `size-16`, `border-lol-border-gold`

  **Acceptance Criteria**:
  - [ ] Component exported from `web/src/components/ui/icon-grid-selector.tsx`.
  - [ ] Renders grid of icons with configurable columns.
  - [ ] Selected item has `border-lol-border-gold shadow-lol-glow-gold`.
  - [ ] Disabled items have `opacity-50` and are not interactive.
  - [ ] Tap target >= 44px per item.
  - [ ] Name label visible below each icon.

  **QA Scenarios**:

  ```
  Scenario: Grid selection on mobile
    Tool: Playwright
    Steps: Render component with 6 items, tap item 3, verify selected styling
    Expected: Item 3 has gold border; onSelect called with item 3 id
    Evidence: .sisyphus/evidence/task-5-icon-grid.png

  Scenario: Disabled item not selectable
    Tool: Playwright
    Steps: Render with disabled item, tap it, verify onSelect not called
    Expected: No selection change
    Evidence: .sisyphus/evidence/task-5-icon-grid-disabled.png
  ```

  **Commit**: YES | Message: `feat(ui): add IconGridSelector primitive` | Files: `web/src/components/ui/icon-grid-selector.tsx`

- [ ] 6. W1-T3: Create `<ChampionIdentity>` Helper Component

  **What to do**: Create a reusable component/hook that resolves a `championId` to `{name, title, avatarUrl, splashUrl}`. Use the existing `useChampions()` Data Dragon data. Component should handle loading and error states gracefully (fallback to championId string). Use everywhere raw IDs are currently displayed.
  **Must NOT do**: Do not duplicate Data Dragon fetching logic. Consume existing `useChampions()` hook.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: data-to-visual mapping.
  - Skills: [] — Reason: simple data resolution component.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: W2-T1, W2-T6, W2-T7 | Blocked By: —

  **References**:
  - Hook: `web/src/core/http/ddragon-client.ts` — `useChampions()`
  - Usage: `web/src/features/champ-select/components/members.tsx` — replace `championId` display
  - Usage: `web/src/features/champ-select/components/bench.tsx` — replace `championId` display

  **Acceptance Criteria**:
  - [ ] Component `ChampionIdentity` exported from `web/src/features/champ-select/components/champion-identity.tsx`.
  - [ ] Accepts `championId` and optional `size` prop.
  - [ ] Shows circular avatar + champion name + optional title.
  - [ ] Loading state: skeleton shimmer.
  - [ ] Error state: shows `championId` as fallback string.

  **QA Scenarios**:

  ```
  Scenario: Render known champion
    Tool: Playwright
    Steps: Render with championId 266 (Aatrox)
    Expected: Shows "Aatrox" text and avatar image
    Evidence: .sisyphus/evidence/task-6-champion-identity.png

  Scenario: Render unknown champion
    Tool: Playwright
    Steps: Render with championId 99999
    Expected: Shows "99999" as fallback text
    Evidence: .sisyphus/evidence/task-6-champion-identity-fallback.png
  ```

  **Commit**: YES | Message: `feat(champ-select): add ChampionIdentity helper` | Files: `web/src/features/champ-select/components/champion-identity.tsx`

- [ ] 7. W1-T4: Extend Tailwind with Urgency Animation Keyframes

  **What to do**: Add CSS custom keyframes to the Tailwind config/theme for timer urgency states: `@keyframes timer-drain` (progress bar depletion), `@keyframes pulse-fast` (rapid pulsing for critical state), `@keyframes shake-subtle` (subtle shake for expired state). Use Tailwind v4 `@theme` or CSS custom properties approach.
  **Must NOT do**: Do not use arbitrary values in JSX (`animate-[...]`). Define proper theme tokens.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: animation tokens.
  - Skills: [] — Reason: CSS/Tailwind configuration.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: W2-T5 | Blocked By: —

  **References**:
  - Config: `web/tailwind.config.ts` or `web/src/styles/design-tokens.css` — check current setup
  - Tailwind v4 docs: `@theme` block for custom keyframes

  **Acceptance Criteria**:
  - [ ] `animate-timer-drain`, `animate-pulse-fast`, `animate-shake-subtle` available as utility classes.
  - [ ] Duration and easing defined: timer-drain (linear, 1s), pulse-fast (0.5s), shake-subtle (0.3s).
  - [ ] Visual test page renders all three animations.

  **QA Scenarios**:

  ```
  Scenario: Animation classes exist
    Tool: Bash
    Steps: grep -R "animate-timer-drain\|animate-pulse-fast\|animate-shake-subtle" web/src/styles/
    Expected: Keyframes defined in CSS/Tailwind config
    Evidence: .sisyphus/evidence/task-7-keyframes.css
  ```

  **Commit**: YES | Message: `feat(styles): add urgency animation keyframes` | Files: `web/src/styles/design-tokens.css` or `web/tailwind.config.ts`

- [ ] 8. W2-T1: Refactor ChampionPicker — Eliminate Native Select + Add Filters

  **What to do**: Refactor `web/src/features/champ-select/components/champion-picker.tsx`. Replace the native `<select>` for sorting with a custom horizontal scrollable chip list (Name A-Z, Name Z-A, Role). Add role/class filter chips (Assassin, Fighter, Mage, Marksman, Support, Tank) using existing champion tags from Data Dragon. Ensure touch targets >= 44px. Use `ChampionIdentity` for any champion name display.
  **Must NOT do**: Do not add Champion Ability Preview logic yet. That is Wave 3.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: major UI component refactor.
  - Skills: `frontend-ui-ux`, `vercel-react-best-practices` — Reason: mobile performance and interaction.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: W3-T1 | Blocked By: W1-T1 (BottomSheet), W1-T3 (ChampionIdentity)

  **References**:
  - Source: `web/src/features/champ-select/components/champion-picker.tsx`
  - Data: `useChampions()` returns `tags` array per champion (e.g., `['Fighter', 'Tank']`)
  - Primitive: `web/src/components/ui/bottom-sheet.tsx` — for filter overflow
  - Primitive: `web/src/features/champ-select/components/champion-identity.tsx`

  **Acceptance Criteria**:
  - [ ] Zero `<select>` elements in `champion-picker.tsx`.
  - [ ] Sort chips: Name (A-Z), Name (Z-A).
  - [ ] Filter chips: at least 6 role/class options.
  - [ ] Active filter/sort chips have gold border.
  - [ ] Tap targets >= 44px.
  - [ ] ARAM card mode preserved and functional.

  **QA Scenarios**:

  ```
  Scenario: Sort champions on mobile
    Tool: Playwright
    Steps: Open champ picker, tap "Name Z-A" chip, verify first champion is Zyra/Zeri
    Expected: Grid reorders correctly
    Evidence: .sisyphus/evidence/task-8-sort-filter.png

  Scenario: Filter by role
    Tool: Playwright
    Steps: Tap "Mage" filter chip, verify only mages visible
    Expected: Grid shows only champions with "Mage" tag
    Evidence: .sisyphus/evidence/task-8-role-filter.png
  ```

  **Commit**: YES | Message: `feat(champ-select): refactor ChampionPicker with custom filters` | Files: `web/src/features/champ-select/components/champion-picker.tsx`

- [ ] 9. W2-T2: Refactor SummonerPicker — Icon Grid Modal

  **What to do**: Refactor `web/src/features/champ-select/components/summoner-picker.tsx`. Replace both native `<select>` elements with a touch-optimized flow: show two selected spell slots (icon + name). Tapping a slot opens a BottomSheet with `IconGridSelector` displaying all available summoner spells in a 3-column grid. Selecting a spell closes the sheet and updates the slot.
  **Must NOT do**: Do not use `<select>` or `<option>` elements. Do not hardcode spell list.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: tactile mobile interaction.
  - Skills: `frontend-ui-ux` — Reason: mobile-first spell selection.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: W2-T4 | Blocked By: W1-T1 (BottomSheet), W1-T2 (IconGridSelector)

  **References**:
  - Source: `web/src/features/champ-select/components/summoner-picker.tsx`
  - Data: `useChampSelect()` returns `summonerSpells` array
  - Primitive: `web/src/components/ui/bottom-sheet.tsx`
  - Primitive: `web/src/components/ui/icon-grid-selector.tsx`

  **Acceptance Criteria**:
  - [ ] Zero `<select>` elements in `summoner-picker.tsx`.
  - [ ] Two spell slots visible: icon (size-12) + name.
  - [ ] Tapping slot opens BottomSheet with spell grid.
  - [ ] Selecting spell closes sheet and updates slot.
  - [ ] Each spell in grid has tap target >= 44px.

  **QA Scenarios**:

  ```
  Scenario: Change summoner spell on mobile
    Tool: Playwright
    Steps: Tap spell1 slot, select "Flash" from grid, verify slot updates
    Expected: Spell1 shows Flash icon and name
    Evidence: .sisyphus/evidence/task-9-summoner-picker.png

  Scenario: Close without selecting
    Tool: Playwright
    Steps: Tap spell1 slot, tap backdrop, verify no change
    Expected: Spell1 unchanged
    Evidence: .sisyphus/evidence/task-9-summoner-picker-cancel.png
  ```

  **Commit**: YES | Message: `feat(champ-select): replace native selects in SummonerPicker with icon grid` | Files: `web/src/features/champ-select/components/summoner-picker.tsx`

- [ ] 10. W2-T3: Refactor RuneEditor — Bottom Sheet + Simplified Layout

  **What to do**: Refactor `web/src/features/champ-select/components/rune-editor.tsx`. Move the inline dense grid into a BottomSheet that opens from `PlayerSettings`. Inside the sheet, organize into 3 tabs: "Recommended" (placeholder for gated feature), "Primary", "Secondary". Primary tab shows tree selector + rune grid. Secondary tab shows tree selector + rune grid. Keep stat shards at the bottom. Ensure all tap targets >= 44px.
  **Must NOT do**: Do not remove existing LCU save logic. Do not implement actual recommendations yet (gated).

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: complex component restructure.
  - Skills: `frontend-ui-ux` — Reason: mobile form optimization.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: W2-T4 | Blocked By: W1-T1 (BottomSheet)

  **References**:
  - Source: `web/src/features/champ-select/components/rune-editor.tsx`
  - Source: `web/src/features/champ-select/components/player-settings.tsx` — triggers editor
  - Source: `web/src/features/champ-select/components/rune-tree-selector.tsx`
  - Source: `web/src/features/champ-select/components/primary-rune-grid.tsx`
  - Source: `web/src/features/champ-select/components/secondary-rune-grid.tsx`
  - Primitive: `web/src/components/ui/bottom-sheet.tsx`

  **Acceptance Criteria**:
  - [ ] Rune editor opens in BottomSheet from PlayerSettings.
  - [ ] 3 tabs: Recommended (disabled/placeholder), Primary, Secondary.
  - [ ] Primary tab: tree selector + primary rune grid.
  - [ ] Secondary tab: tree selector + secondary rune grid.
  - [ ] Stat shards visible at bottom of both tabs.
  - [ ] Auto-save preserved; toast notification on save.

  **QA Scenarios**:

  ```
  Scenario: Open rune editor on mobile
    Tool: Playwright
    Steps: Tap "Edit Runes" in PlayerSettings, verify BottomSheet opens
    Expected: Sheet visible with Primary tab active
    Evidence: .sisyphus/evidence/task-10-rune-editor.png

  Scenario: Switch tab and select rune
    Tool: Playwright
    Steps: Tap Secondary tab, select tree, select rune, verify save toast
    Expected: Rune selected, toast visible
    Evidence: .sisyphus/evidence/task-10-rune-editor-tab.png
  ```

  **Commit**: YES | Message: `feat(champ-select): move RuneEditor to BottomSheet with tabs` | Files: `web/src/features/champ-select/components/rune-editor.tsx`, `player-settings.tsx`

- [ ] 11. W2-T4: Refactor PlayerSettings — Integrate New Primitives

  **What to do**: Refactor `web/src/features/champ-select/components/player-settings.tsx` to integrate the new SummonerPicker and RuneEditor. Remove the native `<select>` for rune page selection. Replace with a horizontal scrollable list of rune page cards (icon + name). Tapping a card selects the page. Add an "Edit Runes" button that opens the RuneEditor BottomSheet. Ensure the rune preview section (currently showing 12 flat icons) is reorganized into a compact summary (primary tree icon + 4 primary runes + secondary tree icon + 2 secondary runes + 3 stat shards).
  **Must NOT do**: Do not remove mode-based conditional rendering (`modeRules.usesSummonerSpells`, `modeRules.usesRunes`).

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: integration task.
  - Skills: `frontend-ui-ux` — Reason: compact mobile layout.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: — | Blocked By: W2-T2 (SummonerPicker), W2-T3 (RuneEditor)

  **References**:
  - Source: `web/src/features/champ-select/components/player-settings.tsx`
  - Source: `web/src/features/champ-select/components/summoner-picker.tsx` (refactored)
  - Source: `web/src/features/champ-select/components/rune-editor.tsx` (refactored)
  - Data: `runeTrees` from `useChampSelect()`

  **Acceptance Criteria**:
  - [ ] Zero `<select>` elements in `player-settings.tsx`.
  - [ ] Rune page selector shows horizontal scrollable cards.
  - [ ] "Edit Runes" button opens RuneEditor BottomSheet.
  - [ ] Rune summary shows structured primary + secondary + shards.
  - [ ] SummonerPicker integrated without native selects.

  **QA Scenarios**:

  ```
  Scenario: Select rune page on mobile
    Tool: Playwright
    Steps: Swipe rune page list, tap page card, verify selection
    Expected: Selected page highlighted, summary updates
    Evidence: .sisyphus/evidence/task-11-player-settings.png
  ```

  **Commit**: YES | Message: `feat(champ-select): refactor PlayerSettings with new primitives` | Files: `web/src/features/champ-select/components/player-settings.tsx`

- [ ] 12. W2-T5: Refactor Timer — Urgency States + Progress Bar

  **What to do**: Refactor `web/src/features/champ-select/components/timer.tsx`. Add a horizontal progress bar at the top of the timer card that depletes as time passes. Add urgency states: normal (>20s), warning (<=20s, yellow), critical (<=10s, red + pulse-fast animation), expired (0s, shake-subtle). Ensure the phase indicator (pick/ban/waiting) and turn indicator (your turn) are visually distinct with appropriate colors.
  **Must NOT do**: Do not change the timer countdown logic. Only visual presentation.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: state-driven visual feedback.
  - Skills: `frontend-ui-ux` — Reason: urgency communication.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: — | Blocked By: W1-T4 (Tailwind keyframes)

  **References**:
  - Source: `web/src/features/champ-select/components/timer.tsx`
  - Theme: `web/src/styles/design-tokens.css` — urgency keyframes
  - Hook: `useCountdown` in `web/src/hooks/useCountdown.ts`

  **Acceptance Criteria**:
  - [ ] Progress bar visible at top of timer card, width = `timer / totalTime * 100%`.
  - [ ] Normal state: gold/white text, no animation.
  - [ ] Warning state (<=20s): yellow text, no animation.
  - [ ] Critical state (<=10s): red text, `animate-pulse-fast`.
  - [ ] Expired state (0s): red text, `animate-shake-subtle`.
  - [ ] Phase and turn indicators visually distinct.

  **QA Scenarios**:

  ```
  Scenario: Timer urgency progression
    Tool: Playwright
    Steps: Mock timer at 25s, 15s, 8s, 0s; capture screenshot at each
    Expected: Visual state changes match urgency level
    Evidence: .sisyphus/evidence/task-12-timer-urgency.png
  ```

  **Commit**: YES | Message: `feat(champ-select): add urgency states to Timer` | Files: `web/src/features/champ-select/components/timer.tsx`

- [ ] 13. W2-T6: Refactor Members — Champion Identities + PickIntent Visuals

  **What to do**: Refactor `web/src/features/champ-select/components/members.tsx`. Replace raw `championId` display with `ChampionIdentity` component for all members. Add visual distinction for `championPickIntent`: show the intended champion with 70% opacity and a pulsing border if the ally has hovered a champion. In ban phase, if an ally has a `pickIntent`, show a shield icon overlay on their avatar to indicate anti-tilt protection. Show assigned position with role icon (from `features/lobby/constants/role-icons.ts`).
  **Must NOT do**: Do not implement actual swap buttons yet. That is Wave 3.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: data visualization.
  - Skills: `frontend-ui-ux` — Reason: team roster clarity.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: W3-T3, W3-T4 | Blocked By: W1-T3 (ChampionIdentity)

  **References**:
  - Source: `web/src/features/champ-select/components/members.tsx`
  - Helper: `web/src/features/champ-select/components/champion-identity.tsx`
  - Icons: `web/src/features/lobby/constants/role-icons.ts`
  - Data: `ChampSelectMember.championPickIntent` — already available

  **Acceptance Criteria**:
  - [ ] No raw `championId` numbers visible in member cards.
  - [ ] Each member shows champion avatar + name (or pick intent).
  - [ ] `pickIntent` shown with 70% opacity + pulsing border.
  - [ ] Assigned position shown with role icon.
  - [ ] Ban phase: hovered allies show shield overlay.

  **QA Scenarios**:

  ```
  Scenario: Ally with pick intent
    Tool: Playwright
    Steps: Render with ally having pickIntent=266, verify pulsing border and opacity
    Expected: Aatrox shown at 70% opacity with pulsing gold border
    Evidence: .sisyphus/evidence/task-13-members-pickintent.png

  Scenario: Anti-tilt shield in ban phase
    Tool: Playwright
    Steps: Render in ban phase with ally pickIntent=266, verify shield icon
    Expected: Shield icon visible on ally card
    Evidence: .sisyphus/evidence/task-13-members-shield.png
  ```

  **Commit**: YES | Message: `feat(champ-select): refactor Members with champion identities and pick intent` | Files: `web/src/features/champ-select/components/members.tsx`

- [ ] 14. W2-T7: Refactor Bench — Champion Avatars + Clean Layout

  **What to do**: Refactor `web/src/features/champ-select/components/bench.tsx`. Replace raw `championId` buttons with `ChampionIdentity` cards in a horizontal scrollable strip. Each card shows avatar + name + swap button. Reroll button remains prominent at the top. Ensure touch targets >= 44px.
  **Must NOT do**: Do not remove reroll logic. Do not add Crowd Favorite/Bravery styling yet (Wave 3).

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: layout refactor.
  - Skills: `frontend-ui-ux` — Reason: touch-optimized strip.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: W3-T5 | Blocked By: W1-T3 (ChampionIdentity)

  **References**:
  - Source: `web/src/features/champ-select/components/bench.tsx`
  - Helper: `web/src/features/champ-select/components/champion-identity.tsx`
  - Data: `benchChampionIds` from `useChampSelect()`

  **Acceptance Criteria**:
  - [ ] No raw `championId` numbers visible.
  - [ ] Horizontal scrollable strip of champion cards.
  - [ ] Each card: avatar + name + "Swap" button.
  - [ ] Reroll button prominent at top.
  - [ ] Tap targets >= 44px.

  **QA Scenarios**:

  ```
  Scenario: Bench shows champions
    Tool: Playwright
    Steps: Render bench with 3 champions, verify all show names and avatars
    Expected: 3 cards with Aatrox, Ahri, Akali (or whatever data)
    Evidence: .sisyphus/evidence/task-14-bench-avatars.png
  ```

  **Commit**: YES | Message: `feat(champ-select): refactor Bench with champion avatars` | Files: `web/src/features/champ-select/components/bench.tsx`

- [ ] 15. W3-T1: Champion Ability Previews UI (Gated)

  **What to do**: Add Champion Ability Preview feature to `champion-picker.tsx`. When a user long-presses (mobile) or hovers (desktop) on a champion card for 800ms, open a small BottomSheet with the champion's 4 abilities (Q, W, E, R) showing icon + name + short description. Data comes from `useChampionDetail()` (added in W0-T3). If Data Dragon data is unavailable, show a placeholder message "Ability data loading..." or disable the feature entirely.
  **Must NOT do**: Do not preload ability data for all champions. Fetch on-demand per champion.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: interactive preview feature.
  - Skills: `frontend-ui-ux` — Reason: long-press interaction design.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: — | Blocked By: W0-T3 (Data check), W2-T1 (Picker refactor), W1-T1 (BottomSheet)

  **References**:
  - Source: `web/src/features/champ-select/components/champion-picker.tsx`
  - Data: `useChampionDetail()` from `ddragon-client.ts`
  - Primitive: `web/src/components/ui/bottom-sheet.tsx`

  **Acceptance Criteria**:
  - [ ] Long-press on champion card opens preview sheet after 800ms.
  - [ ] Sheet shows 4 ability icons + names + descriptions.
  - [ ] If data unavailable: shows placeholder or feature disabled.
  - [ ] Sheet closes on tap outside or swipe down.

  **QA Scenarios**:

  ```
  Scenario: Ability preview on mobile
    Tool: Playwright
    Steps: Long-press Aatrox card, verify preview sheet with 4 abilities
    Expected: Sheet visible with Q, W, E, R abilities
    Evidence: .sisyphus/evidence/task-15-ability-preview.png
  ```

  **Commit**: YES | Message: `feat(champ-select): add Champion Ability Preview on long-press` | Files: `web/src/features/champ-select/components/champion-picker.tsx`

- [ ] 16. W3-T2: Rune Recommender UI Shell (Gated)

  **What to do**: Add a "Recommended" tab to the RuneEditor BottomSheet (from W2-T3). Display 3 placeholder recommendation cards: "Meta", "Pro", "Anti-Meta". Each card shows primary tree icon + 4 primary rune icons + secondary tree icon. Cards are disabled/greyed out with a "Coming soon" label until a recommendation data source is available. Ensure the UI shell is ready for real data integration.
  **Must NOT do**: Do not invent or hardcode actual rune recommendations.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: UI shell for future feature.
  - Skills: `frontend-ui-ux` — Reason: placeholder UX.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: — | Blocked By: W2-T3 (RuneEditor refactor), W1-T2 (IconGridSelector)

  **References**:
  - Source: `web/src/features/champ-select/components/rune-editor.tsx`
  - Data: `runeTrees` from `useChampSelect()`

  **Acceptance Criteria**:
  - [ ] "Recommended" tab visible in RuneEditor.
  - [ ] 3 cards visible: "Meta", "Pro", "Anti-Meta".
  - [ ] Cards show tree + rune icon previews.
  - [ ] Cards are disabled with "Coming soon" label.

  **QA Scenarios**:

  ```
  Scenario: Recommended tab placeholder
    Tool: Playwright
    Steps: Open RuneEditor, tap Recommended tab
    Expected: 3 greyed-out cards with "Coming soon"
    Evidence: .sisyphus/evidence/task-16-rune-recommender.png
  ```

  **Commit**: YES | Message: `feat(champ-select): add Rune Recommender UI shell` | Files: `web/src/features/champ-select/components/rune-editor.tsx`

- [ ] 17. W3-T3: Anti-Tilt Ban UI

  **What to do**: In `champion-picker.tsx`, during ban phase, check if any ally has `championPickIntent` set. If yes, visually disable/warn that champion in the grid: add shield overlay, disable click, show tooltip "Your ally wants to play this champion". In `members.tsx`, show shield icon on allies with pick intent during ban phase (already partially done in W2-T6; enhance here).
  **Must NOT do**: Do not prevent ban at protocol level. This is UI-only affordance. The LCU already prevents banning hovered allies in Ranked 2026.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: state-driven visual affordance.
  - Skills: `frontend-ui-ux` — Reason: anti-friction design.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: — | Blocked By: W2-T1 (Picker refactor), W2-T6 (Members refactor)

  **References**:
  - Source: `web/src/features/champ-select/components/champion-picker.tsx`
  - Source: `web/src/features/champ-select/components/members.tsx`
  - Data: `team[].championPickIntent` from `useChampSelect()`

  **Acceptance Criteria**:
  - [ ] In ban phase, champions with ally `pickIntent` show shield overlay in grid.
  - [ ] Those champions are not selectable for ban.
  - [ ] Tooltip/label explains why: "Ally wants to play this champion".

  **QA Scenarios**:

  ```
  Scenario: Cannot ban ally hovered champion
    Tool: Playwright
    Steps: Enter ban phase, verify Aatrox (ally pickIntent) has shield and is disabled
    Expected: Aatrox card disabled with shield icon
    Evidence: .sisyphus/evidence/task-17-anti-tilt.png
  ```

  **Commit**: YES | Message: `feat(champ-select): add Anti-Tilt ban UI for hovered allies` | Files: `web/src/features/champ-select/components/champion-picker.tsx`, `members.tsx`

- [ ] 18. W3-T4: Role Swap vs Pick Swap Visual Distinction (Gated)

  **What to do**: Add UI shell for swap requests in `members.tsx`. Create two distinct swap buttons/icon treatments:
  - **Role Swap**: Circular arrows icon (↻) with label "Swap Role", positioned near the member's role/position.
  - **Pick Swap**: Crossed arrows icon (⇄) with label "Swap Pick", positioned near the member's champion.
    Both buttons are hidden unless swap data exists. If swap data is unavailable (current state), render the buttons in a disabled/placeholder state or hide them entirely. Add distinct color treatments: Role Swap uses blue accent, Pick Swap uses purple accent.
    **Must NOT do**: Do not implement actual swap request logic. This is visual distinction only.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: iconography and color distinction.
  - Skills: `frontend-ui-ux` — Reason: clear action differentiation.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: — | Blocked By: W2-T6 (Members refactor)

  **References**:
  - Source: `web/src/features/champ-select/components/members.tsx`
  - Icons: Lucide `ArrowLeftRight` (⇄), `RotateCw` (↻)

  **Acceptance Criteria**:
  - [ ] Role Swap button uses ↻ icon + blue accent.
  - [ ] Pick Swap button uses ⇄ icon + purple accent.
  - [ ] Buttons hidden unless swap data available (or shown disabled).

  **QA Scenarios**:

  ```
  Scenario: Swap buttons distinct
    Tool: Playwright
    Steps: Render members with swap data, verify distinct icons and colors
    Expected: Role Swap = blue ↻, Pick Swap = purple ⇄
    Evidence: .sisyphus/evidence/task-18-swap-distinction.png
  ```

  **Commit**: YES | Message: `feat(champ-select): add Role Swap vs Pick Swap visual distinction` | Files: `web/src/features/champ-select/components/members.tsx`

- [ ] 19. W3-T5: ARAM Crowd Favorite / Bravery Card Styling (Gated)

  **What to do**: Enhance ARAM card rendering in `champion-picker.tsx` (ARAM mode). Add visual styles for special card types:
  - **Crowd Favorite**: Gold sparkling border + star icon + "Crowd Favorite" label.
  - **Bravery**: Chaotic purple/magenta gradient border + dice icon + "Bravery" label.
    Since backend data for these types is not confirmed, gate the rendering: show the styles only if card metadata includes `type: 'crowd-favorite'` or `type: 'bravery'`. Otherwise, render normal ARAM cards. Reuse existing `isBlessed` styling as reference.
    **Must NOT do**: Do not invent card type data. Gate on actual metadata.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: special card styling.
  - Skills: `frontend-ui-ux` — Reason: celebratory/chaotic visual language.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: — | Blocked By: W2-T1 (Picker refactor), W2-T7 (Bench refactor)

  **References**:
  - Source: `web/src/features/champ-select/components/champion-picker.tsx` (ARAM section)
  - Source: `web/src/features/champ-select/aram-store.ts`

  **Acceptance Criteria**:
  - [ ] Crowd Favorite card: gold border, star icon, label.
  - [ ] Bravery card: purple/magenta border, dice icon, label.
  - [ ] Normal cards unchanged.
  - [ ] Gated on card metadata `type` field.

  **QA Scenarios**:

  ```
  Scenario: Special ARAM cards
    Tool: Playwright
    Steps: Render ARAM cards with crowd-favorite and bravery types
    Expected: Distinct visual treatments for each
    Evidence: .sisyphus/evidence/task-19-aram-cards.png
  ```

  **Commit**: YES | Message: `feat(champ-select): add Crowd Favorite and Bravery card styling` | Files: `web/src/features/champ-select/components/champion-picker.tsx`

- [ ] 20. W4-T1: Playwright Mobile Screenshot Comparison

  **What to do**: After all UI changes, run Playwright to capture the same 9 screens at `360x800` and `390x844`. Compare against Wave 0 baselines. Report any unexpected visual regressions (layout shifts, missing elements, overflow). Document diffs.
  **Must NOT do**: Do not block on minor pixel differences from content changes. Only flag layout/functionality regressions.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: QA verification.
  - Skills: `playwright` — Reason: visual regression testing.

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: — | Blocked By: W0-T1 (baselines), W2 all, W3 all

  **References**:
  - Baselines: `web/tests/e2e/baselines/`
  - Playwright config: `web/playwright.config.ts`

  **Acceptance Criteria**:
  - [ ] All 18 screenshots captured (9 screens × 2 viewports).
  - [ ] Comparison report generated.
  - [ ] Zero layout overflow regressions.
  - [ ] All interactive elements visible and accessible.

  **QA Scenarios**:

  ```
  Scenario: Screenshot comparison
    Tool: Bash
    Steps: Run comparison script, review report
    Expected: Report shows no critical regressions
    Evidence: .sisyphus/evidence/task-20-comparison-report.md
  ```

  **Commit**: NO

- [ ] 21. W4-T2: Interaction Tests for Custom Selectors

  **What to do**: Write Playwright interaction tests for all custom selectors: BottomSheet open/close, IconGridSelector selection, ChampionPicker sort/filter chips, SummonerPicker spell grid, RuneEditor tab switching. Run at `360x800`.
  **Must NOT do**: Do not test LCU backend logic. Focus on UI interactions only.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: interaction QA.
  - Skills: `playwright` — Reason: browser automation.

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: — | Blocked By: W2 all

  **References**:
  - Tests: `web/tests/e2e/`

  **Acceptance Criteria**:
  - [ ] BottomSheet: open, close via backdrop, close via Escape.
  - [ ] IconGridSelector: select item, verify selected state.
  - [ ] ChampionPicker: apply sort chip, apply filter chip, verify grid updates.
  - [ ] SummonerPicker: open grid, select spell, verify slot update.
  - [ ] RuneEditor: switch tab, select rune, verify save.

  **QA Scenarios**:

  ```
  Scenario: All interactions pass
    Tool: Bash
    Steps: Run `bun run test:e2e:interactions`
    Expected: All tests pass
    Evidence: .sisyphus/evidence/task-21-interactions.log
  ```

  **Commit**: YES | Message: `test(e2e): add interaction tests for custom selectors` | Files: `web/tests/e2e/interactions.pw.ts`

- [ ] 22. W4-T3: Accessibility Checks

  **What to do**: Run automated accessibility checks on all modified screens: focus management, ARIA roles, color contrast, touch target sizes. Use `axe-core` via Playwright or manual inspection. Report and fix any violations.
  **Must NOT do**: Do not aim for WCAG 2.1 AAA. Target AA compliance for mobile.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: accessibility audit.
  - Skills: `web-design-guidelines` — Reason: accessibility compliance.

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: — | Blocked By: W2 all, W3 all

  **References**:
  - Tool: `@axe-core/playwright`
  - Guidelines: WCAG 2.1 AA for mobile

  **Acceptance Criteria**:
  - [ ] All interactive elements have accessible names.
  - [ ] Focus visible on all interactive elements.
  - [ ] Color contrast >= 4.5:1 for normal text.
  - [ ] Touch targets >= 44px.
  - [ ] No critical or serious axe violations.

  **QA Scenarios**:

  ```
  Scenario: Axe scan passes
    Tool: Bash
    Steps: Run `bun run test:a11y`
    Expected: Zero critical/serious violations
    Evidence: .sisyphus/evidence/task-22-a11y-report.md
  ```

  **Commit**: YES | Message: `a11y(champ-select,lobby): fix accessibility violations` | Files: Modified component files

- [ ] 23. W4-T4: Final Build / Lint / Test Verification

  **What to do**: Run the full verification suite: `bun run lint`, `bun run fmt:check`, `bun run test`, `bun run build`. Fix any failures. Verify `grep -R "<select" web/src/features/champ-select web/src/features/lobby` returns zero matches.
  **Must NOT do**: Do not skip any verification step.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: final verification.
  - Skills: [] — Reason: command execution.

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: — | Blocked By: W4-T1, W4-T2, W4-T3

  **References**:
  - Commands from `web/package.json` scripts

  **Acceptance Criteria**:
  - [ ] `bun run lint` exits 0.
  - [ ] `bun run fmt:check` exits 0.
  - [ ] `bun run test` exits 0.
  - [ ] `bun run build` exits 0.
  - [ ] `grep -R "<select" web/src/features/champ-select web/src/features/lobby` returns empty.

  **QA Scenarios**:

  ```
  Scenario: Full verification suite
    Tool: Bash
    Steps: Run lint, fmt:check, test, build
    Expected: All exit 0
    Evidence: .sisyphus/evidence/task-23-verification.log
  ```

  **Commit**: NO

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [ ] F1. Plan Compliance Audit — oracle: Verify every task in the plan was completed per spec. Check file references, acceptance criteria, QA scenarios.
- [ ] F2. Code Quality Review — unspecified-high: Run `bun run lint`, `bun run doctor:react`, check for anti-patterns (any, explicit types), review component complexity.
- [ ] F3. Real Manual QA — unspecified-high (+ playwright): Execute all Playwright E2E tests, screenshot comparisons, interaction tests. Report pass/fail per test.
- [ ] F4. Scope Fidelity Check — deep: Verify no scope creep occurred. Confirm only `web/src/features/champ-select/` and `web/src/features/lobby/` were modified. Verify no legacy/ protocol/ rift changes. Verify no 2027 speculative features.

## Commit Strategy

- **Wave 0**: No commits (read-only audit).
- **Wave 1**: One commit per primitive.
- **Wave 2**: One commit per component refactor.
- **Wave 3**: One commit per feature.
- **Wave 4**: One commit for interaction tests, one for a11y fixes.
- **Final Verification**: No commits unless fixes required.
- **Commit message format**: `type(scope): description` per conventional commits.

## Success Criteria

1. Zero native `<select>` elements in `web/src/features/champ-select/` and `web/src/features/lobby/`.
2. All pre-game screens render correctly at `360x800` and `390x844` without horizontal overflow.
3. All interactive elements have touch targets >= 44px.
4. Raw `championId` numbers are never displayed to users; champion names/icons shown instead.
5. Timer communicates urgency through visual states (progress bar, color, animation).
6. Anti-Tilt ban affordance visible during ban phase.
7. Rune Recommender UI shell ready for data integration.
8. Champion Ability Preview UI functional (gated on Data Dragon availability).
9. Playwright screenshot baselines captured before and after; no critical regressions.
10. `bun run lint`, `bun run test`, `bun run build` all pass.
