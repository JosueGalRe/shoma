# Role Picker UX Redesign + Swiftplay Crash Fix

## TL;DR

> **Summary**: Replace lobby role `<select>` dropdowns with circular icon buttons (matching official LoL client), implement FILL behavior (primary FILL hides secondary and sets it UNSELECTED), preserve legacy swap logic, and fix Swiftplay infinite render loop caused by unstable Zustand selectors.
> **Deliverables**: New `RolePicker` component using CommunityDragon icon URLs, updated `LobbyBottomSheets`, fixed `swiftplay-store.ts` selectors.
> **Effort**: Medium
> **Parallel**: YES — 3 waves
> **Critical Path**: Task 1 (URLs) → Task 3 (RolePicker) → Task 4 (integration) → Task 2 (Swiftplay fix)

## Context

### Original Request

User wants to improve the lobby role selection UI to match the official League of Legends client design (circular role icons instead of dropdowns). Additionally fix the Swiftplay route crash (`Maximum update depth exceeded`) and implement FILL behavior where selecting FILL as primary role hides the secondary selector.

### Interview Summary

- **Scope**: Only lobby role picker (Swiftplay position dropdown stays unchanged)
- **Icons**: Use CommunityDragon URLs (user explicitly requested)
- **FILL behavior**: When primary = FILL, secondary becomes UNSELECTED and selector disappears (matches legacy Vue app)
- **User confirmed**: No redesign for Swiftplay position selector

### Metis Review (gaps addressed)

- Must preserve legacy swap logic (selecting same role in both positions swaps them)
- UNSELECTED should be a visible "clear" option (empty circle icon)
- Fix Zustand selectors at source (`swiftplay-store.ts`), not just component
- Touch targets must be ≥44px for mobile accessibility
- Queue readiness logic must treat `{first: FILL, second: UNSELECTED}` as valid

## Work Objectives

### Core Objective

Replace the lobby role selection UI from two `<select>` dropdowns to a grid of circular icon buttons (TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY, FILL, UNSELECTED), matching the official LoL client aesthetic and preserving legacy interaction behaviors.

### Deliverables

1. CommunityDragon role icon URL constants defined in RolePicker
2. Redesigned `RolePicker` component with circular icon buttons
3. Updated `LobbyBottomSheets` with FILL logic and role swap behavior
4. Fixed Swiftplay Zustand selectors preventing infinite re-render
5. Unit tests for role transition logic
6. Updated lobby queue readiness logic for FILL+UNSELECTED state

### Definition of Done

- [ ] `bun run --filter @mimic/web-next test` passes
- [ ] `bun run --filter @mimic/web-next build` passes
- [ ] `bun run lint` passes
- [ ] Lobby role picker shows 7 circular icons (6 roles + unselected)
- [ ] Selecting FILL as primary hides secondary selector and sets it UNSELECTED
- [ ] Selecting same role in both positions swaps them (legacy behavior)
- [ ] Swiftplay route loads without `Maximum update depth exceeded` error
- [ ] All role icons load correctly from CommunityDragon URLs
- [ ] Touch targets are ≥44px, focus rings visible, screen reader labels present

### Must Have

- Circular icon buttons for all 7 role states using CommunityDragon URLs
- FILL behavior: hide secondary, set to UNSELECTED
- Legacy swap behavior for duplicate roles
- UNSELECTED as a visible/clearable option
- Swiftplay crash fix
- Accessibility: aria-labels, focus rings, 44px touch targets

### Must NOT Have

- Redesign of Swiftplay position dropdown
- Changes to role protocol/API contract
- New external dependencies
- Breaking changes to lobby state model
- Animations beyond existing Tailwind transitions
- Local copies of role icon assets

## Verification Strategy

- **Test decision**: Tests-after (existing test infra, add unit tests for new logic)
- **QA policy**: Agent-executed scenarios for happy path + edge cases
- **Evidence**: Screenshots and console logs saved to `.sisyphus/evidence/`

## Execution Strategy

### Parallel Execution Waves

**Wave 1**: Foundation (CommunityDragon URLs + Swiftplay fix)
**Wave 2**: Component + Integration (RolePicker + LobbyBottomSheets)
**Wave 3**: Polish + Verification (tests, lint, build, accessibility checks)

### Dependency Matrix

| Task               | Blocks | Blocked By |
| ------------------ | ------ | ---------- |
| T1 (CDragon URLs)  | T3     | -          |
| T2 (Swiftplay fix) | T6     | -          |
| T3 (RolePicker)    | T4     | T1         |
| T4 (Integration)   | T6     | T3         |
| T5 (Tests)         | T6     | T4         |
| T6 (Verification)  | -      | T2, T4, T5 |

## TODOs

### Wave 1: Foundation

- [x] **T1. Define CommunityDragon Role Icon URLs**

  **What to do**: Create a static role-to-URL mapping in a new constants file using CommunityDragon's official LoL client position icons. Use `/latest/` for auto-updating assets.
  **Must NOT do**: Copy PNGs locally, use legacy assets, or hardcode patch versions.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: constant definitions only
  - Skills: [] — No skills needed

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T3 | Blocked By: -

  **References**:
  - CommunityDragon docs: `https://github.com/CommunityDragon/Docs/blob/master/assets.md`
  - Verified base URL: `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/`
  - Available variants: `{name}.png` (default), `{name}-blue.png` (selected/highlighted)

  **URL mapping**:

  ```ts
  // apps/web-next/src/features/lobby/constants/role-icons.ts
  const CDRAGON_BASE =
    'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions'

  export const ROLE_ICONS: Record<LobbyRole, string> = {
    UNSELECTED: `${CDRAGON_BASE}/icon-position-unselected.png`,
    TOP: `${CDRAGON_BASE}/icon-position-top.png`,
    JUNGLE: `${CDRAGON_BASE}/icon-position-jungle.png`,
    MIDDLE: `${CDRAGON_BASE}/icon-position-middle.png`,
    BOTTOM: `${CDRAGON_BASE}/icon-position-bottom.png`,
    UTILITY: `${CDRAGON_BASE}/icon-position-utility.png`,
    FILL: `${CDRAGON_BASE}/icon-position-fill.png`,
  }

  export const ROLE_ICONS_SELECTED: Record<LobbyRole, string> = {
    UNSELECTED: `${CDRAGON_BASE}/icon-position-unselected-blue.png`,
    TOP: `${CDRAGON_BASE}/icon-position-top-blue.png`,
    JUNGLE: `${CDRAGON_BASE}/icon-position-jungle-blue.png`,
    MIDDLE: `${CDRAGON_BASE}/icon-position-middle-blue.png`,
    BOTTOM: `${CDRAGON_BASE}/icon-position-bottom-blue.png`,
    UTILITY: `${CDRAGON_BASE}/icon-position-utility-blue.png`,
    FILL: `${CDRAGON_BASE}/icon-position-fill-blue.png`,
  }
  ```

  **Acceptance Criteria**:
  - [ ] All 7 roles mapped to valid CommunityDragon URLs
  - [ ] Selected-state variant (`-blue.png`) defined for each role
  - [ ] URLs use `/latest/` (not hardcoded patch version)
  - [ ] File created at `apps/web-next/src/features/lobby/constants/role-icons.ts`

  **QA Scenarios**:

  ```
  Scenario: Icons load from CommunityDragon
    Tool: Bash / curl
    Steps: curl -I https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-top.png
    Expected: HTTP 200
    Evidence: .sisyphus/evidence/t1-cdragon.txt
  ```

  **Commit**: YES | Message: `feat(lobby): add CommunityDragon role icon URLs` | Files: `apps/web-next/src/features/lobby/constants/role-icons.ts`

- [x] **T2. Fix Swiftplay infinite render loop in Zustand selectors**

  **What to do**: Fix the unstable selectors in `swiftplay-store.ts` that return new objects/arrays on every call, causing infinite re-renders.

  **Root cause**: `selectSwiftplayIsValid` and `selectSwiftplayErrors` call `getValidationResult(state.myConfig)` which constructs a new `{ errors, isValid }` object and a new `errors` array on every invocation. Zustand's default shallow comparison triggers re-render loops.

  **Approach options** (implementer should choose simplest):
  1. **Option A (recommended)**: Split into primitive selectors:

     ```ts
     export const selectSwiftplayIsValid: SwiftplayStoreSelector<boolean> = (state) => {
       const option1 = state.myConfig.option1
       const option2 = state.myConfig.option2
       return isOptionComplete(option1) && isOptionComplete(option2)
     }

     const EMPTY_ERRORS: string[] = []
     export const selectSwiftplayErrors: SwiftplayStoreSelector<readonly string[]> = (state) => {
       const option1 = state.myConfig.option1
       const option2 = state.myConfig.option2
       const isOption1Complete = isOptionComplete(option1)
       const isOption2Complete = isOptionComplete(option2)
       if (!isOption1Complete || !isOption2Complete) {
         return ['swiftplay.errors.bothOptionsRequired'] as const
       }
       return EMPTY_ERRORS
     }
     ```

  2. **Option B**: Use Zustand's `shallow` equality:
     ```ts
     import { shallow } from 'zustand/shallow'
     const errors = useSwiftplayStore(selectSwiftplayErrors, shallow)
     ```

  **Must NOT do**: Do NOT change Swiftplay UI. Do NOT change validation logic.

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: [`zustand`]

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T6 | Blocked By: -

  **References**:
  - File: `apps/web-next/src/features/swiftplay/swiftplay-store.ts` lines 54-68, 120-122
  - Docs: https://docs.pmnd.rs/zustand/guides/preventing-rerenders-with-equality-fn

  **Acceptance Criteria**:
  - [ ] `selectSwiftplayIsValid` returns a primitive `boolean`
  - [ ] `selectSwiftplayErrors` returns a stable reference (module-level constant empty array when no errors)
  - [ ] Swiftplay route renders without `Maximum update depth exceeded`

  **QA Scenarios**:

  ```
  Scenario: Swiftplay route loads without crash
    Tool: Playwright / browser_console
    Steps: Navigate to /connected/swiftplay, open browser console
    Expected: No "Maximum update depth exceeded" error
    Evidence: .sisyphus/evidence/t2-swiftplay-console.png
  ```

  **Commit**: YES | Message: `fix(swiftplay): stabilize zustand selectors to prevent infinite re-render` | Files: `apps/web-next/src/features/swiftplay/swiftplay-store.ts`

### Wave 2: Component + Integration

- [x] **T3. Redesign RolePicker component with circular icon buttons**

  **What to do**: Replace the `<select>` dropdown in `RolePicker` with a horizontal row of circular icon buttons using CommunityDragon URLs.

  **Component API**: Keep existing props:

  ```tsx
  export type RolePickerProps = {
    disabled: boolean
    label: string
    onChange: (role: LobbyRole) => void
    value: LobbyRole
  }
  ```

  **Visual design**:
  - Horizontal flex row, gap-2, centered
  - Each button: `w-11 h-11 rounded-full border-2` (44px touch target)
  - Border color: `border-lol-border-subtle` (unselected), `border-lol-border-gold` (selected)
  - Background: `bg-lol-navy-950` (unselected), `bg-lol-navy-900/60` (selected)
  - Selected state also has `shadow-lol-glow-gold`
  - Icon: `w-6 h-6 object-contain` inside button, sourced from CommunityDragon
  - Use `-blue.png` variant for selected state, default `.png` for unselected
  - Disabled: `opacity-50 pointer-events-none`
  - Focus ring: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold`

  **Role-to-icon mapping**: Import from `role-icons.ts` constants.

  **Accessibility**:
  - Each button has `aria-label={t(`lobby.roles.${role.toLowerCase()}`)}`
  - `role="radiogroup"` on container
  - `role="radio"` on each button
  - `aria-checked={isSelected}`

  **Must NOT do**: Do NOT change the file path or exports. Do NOT remove existing props.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: [`frontend-ui-ux`, `react-patterns`]

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T4 | Blocked By: T1

  **References**:
  - Current: `apps/web-next/src/features/lobby/components/role-picker.tsx`
  - Icons: `apps/web-next/src/features/lobby/constants/role-icons.ts`
  - Styles: `apps/web-next/src/styles.css` (design tokens)
  - Avatar component: `apps/web-next/src/components/ui/avatar.tsx`

  **Acceptance Criteria**:
  - [ ] Component renders 7 circular buttons with CommunityDragon icons
  - [ ] Selected role shows `-blue.png` variant with gold border + glow
  - [ ] Unselected roles show default `.png` with subtle border
  - [ ] Disabled state applies opacity
  - [ ] Each button has aria-label and aria-checked
  - [ ] Touch targets are 44px minimum

  **QA Scenarios**:

  ```
  Scenario: Role picker renders CommunityDragon icons
    Tool: Playwright
    Steps: Open lobby, tap "Role Preferences" in bottom nav
    Expected: 7 circular icons visible with official LoL client icons
    Evidence: .sisyphus/evidence/t3-role-picker.png
  ```

  **Commit**: YES | Message: `feat(lobby): redesign RolePicker with circular CommunityDragon icon buttons` | Files: `apps/web-next/src/features/lobby/components/role-picker.tsx`, `apps/web-next/src/features/lobby/constants/role-icons.ts`

- [x] **T4. Update LobbyBottomSheets with FILL logic and role swap behavior**

  **What to do**: Update `LobbyBottomSheets` to implement legacy role interaction behaviors and conditionally show/hide the secondary role picker.

  **Legacy behaviors to replicate** (from `legacy/web/src/components/lobby/role-picker.ts:59-74`):

  ```ts
  function computeRolePreferences(
    current: LobbyRolePreferences,
    slot: 'first' | 'second',
    newRole: LobbyRole,
  ): LobbyRolePreferences {
    const { first, second } = current

    if (slot === 'first') {
      if (newRole === second) {
        // Swap
        return { first: newRole, second: first }
      }
      if (newRole === first) {
        // Clear
        return { first: 'UNSELECTED', second }
      }
      if (newRole === 'FILL') {
        // FILL forces secondary to UNSELECTED
        return { first: 'FILL', second: 'UNSELECTED' }
      }
      return { first: newRole, second }
    }

    // slot === 'second'
    if (newRole === first) {
      // Swap
      return { first: second, second: newRole }
    }
    if (newRole === second) {
      // Clear
      return { first, second: 'UNSELECTED' }
    }
    return { first, second: newRole }
  }
  ```

  **Integration**: Use the existing `changeRole` action but compute both preferences first:

  ```tsx
  const handleSelect = useCallback(
    (slot: 'first' | 'second', role: LobbyRole) => {
      const next = computeRolePreferences(rolePreferences, slot, role)
      if (next.first !== rolePreferences.first) {
        actions.changeRole('first', next.first)
      }
      if (next.second !== rolePreferences.second) {
        actions.changeRole('second', next.second)
      }
    },
    [rolePreferences, actions],
  )
  ```

  Note: calling `changeRole` twice sequentially may hit the `isChangingRoleRef` guard. If tests show this is a problem, batch by adding a `setRolePreferences` action that accepts both values.

  **Conditional rendering**:
  - Always show primary role picker with label "Primary role"
  - Show secondary role picker with label "Secondary role" ONLY when `rolePreferences.first !== 'FILL'`

  **Queue readiness update**:
  In `apps/web-next/src/routes/connected/lobby/route.tsx` line 114:

  ```tsx
  const hasRequiredRoles =
    rolePreferences.first !== 'UNSELECTED' && (rolePreferences.first === 'FILL' || rolePreferences.second !== 'UNSELECTED')
  ```

  **Must NOT do**: Do NOT change BottomSheet structure. Do NOT change other sheet contents.

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: [`react-patterns`, `zustand`]

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T5, T6 | Blocked By: T3

  **References**:
  - Legacy logic: `legacy/web/src/components/lobby/role-picker.ts:59-74`
  - Current: `apps/web-next/src/routes/connected/lobby/-components/lobby-bottom-sheets.tsx`
  - Store: `apps/web-next/src/features/lobby/lobby-store.ts`
  - Hook: `apps/web-next/src/features/lobby/hooks/use-lobby.ts`
  - Route readiness: `apps/web-next/src/routes/connected/lobby/route.tsx:114`

  **Acceptance Criteria**:
  - [ ] Primary role picker always visible
  - [ ] Secondary role picker hidden when primary = FILL
  - [ ] Selecting FILL as primary sets secondary = UNSELECTED
  - [ ] Selecting same role in both positions swaps them
  - [ ] Selecting already-selected role clears it to UNSELECTED
  - [ ] Queue readiness allows `{first: FILL, second: UNSELECTED}`

  **QA Scenarios**:

  ```
  Scenario: FILL behavior
    Tool: Playwright
    Steps: Open role sheet, click FILL in primary
    Expected: Secondary row disappears, secondary value = UNSELECTED
    Evidence: .sisyphus/evidence/t4-fill-primary.png

  Scenario: Role swap
    Tool: Playwright
    Steps: Select Top primary, Jungle secondary, then click Jungle in primary
    Expected: Primary = Jungle, Secondary = Top
    Evidence: .sisyphus/evidence/t4-swap.png
  ```

  **Commit**: YES | Message: `feat(lobby): implement FILL logic and role swap in bottom sheet` | Files: `apps/web-next/src/routes/connected/lobby/-components/lobby-bottom-sheets.tsx`, `apps/web-next/src/routes/connected/lobby/route.tsx`

### Wave 3: Polish + Verification

- [x] **T5. Add unit tests for role transition logic**

  **What to do**: Extract `computeRolePreferences` into a pure utility and add unit tests.

  **Test cases**:
  1. Normal: `{first: UNSELECTED, second: UNSELECTED}` → click first TOP → `{first: TOP, second: UNSELECTED}`
  2. Swap: `{first: TOP, second: JUNGLE}` → click first JUNGLE → `{first: JUNGLE, second: TOP}`
  3. Clear: `{first: TOP, second: JUNGLE}` → click first TOP → `{first: UNSELECTED, second: JUNGLE}`
  4. FILL primary: `{first: TOP, second: JUNGLE}` → click first FILL → `{first: FILL, second: UNSELECTED}`
  5. FILL secondary: `{first: TOP, second: UNSELECTED}` → click second FILL → `{first: TOP, second: FILL}`
  6. Swap via secondary: `{first: TOP, second: JUNGLE}` → click second TOP → `{first: JUNGLE, second: TOP}`
  7. Clear secondary: `{first: TOP, second: JUNGLE}` → click second JUNGLE → `{first: TOP, second: UNSELECTED}`

  **Test file**: `apps/web-next/src/features/lobby/utils/tests/compute-role-preferences.test.ts`

  **Must NOT do**: Do NOT test UI rendering. Do NOT mock LCU transport.

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: T6 | Blocked By: T4

  **Acceptance Criteria**:
  - [ ] All 7 test cases pass
  - [ ] `bun test apps/web-next/src/features/lobby/utils/tests/compute-role-preferences.test.ts` exits 0

  **QA Scenarios**:

  ```
  Scenario: Role transition tests
    Tool: Bash
    Steps: bun test apps/web-next/src/features/lobby/utils/tests/compute-role-preferences.test.ts
    Expected: 7 passing tests
    Evidence: .sisyphus/evidence/t5-tests.txt
  ```

  **Commit**: YES | Message: `test(lobby): add role transition logic tests` | Files: `apps/web-next/src/features/lobby/utils/compute-role-preferences.ts`, `apps/web-next/src/features/lobby/utils/tests/compute-role-preferences.test.ts`

- [x] **T6. Final verification — lint, build, and accessibility**

  **What to do**: Run full verification suite.

  **Commands**:

  ```bash
  bun run lint
  bun run --filter @mimic/web-next test
  bun run --filter @mimic/web-next build
  ```

  **Accessibility checks**:
  - [ ] Role buttons have `aria-label`
  - [ ] Focus rings visible on keyboard navigation
  - [ ] Touch targets ≥44px

  **Must NOT do**: Do NOT skip lint errors. Do NOT commit with failing tests.

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: [`playwright`, `web-design-guidelines`]

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: - | Blocked By: T2, T4, T5

  **Acceptance Criteria**:
  - [ ] `bun run lint` exits 0
  - [ ] `bun run --filter @mimic/web-next test` exits 0
  - [ ] `bun run --filter @mimic/web-next build` exits 0
  - [ ] Playwright lobby role picker test passes
  - [ ] Playwright Swiftplay no-crash test passes

  **QA Scenarios**:

  ```
  Scenario: Full build verification
    Tool: Bash
    Steps: bun run lint && bun run --filter @mimic/web-next test && bun run --filter @mimic/web-next build
    Expected: All commands exit 0
    Evidence: .sisyphus/evidence/t6-build.txt
  ```

  **Commit**: NO (verification only)

## Final Verification Wave (MANDATORY)

> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**

- [x] **F1. Plan Compliance Audit — oracle**
  - Verify all tasks from plan were completed
  - Verify no scope creep occurred
  - Verify CommunityDragon URLs are used (not legacy PNGs)

- [x] **F2. Code Quality Review — unspecified-high**
  - Review RolePicker component for React best practices
  - Review state management for Zustand patterns
  - Check for accessibility compliance

- [x] **F3. Real Manual QA — unspecified-high + playwright**
  - Open lobby in browser
  - Test all role transition scenarios
  - Test FILL behavior
  - Test Swiftplay route for crash
  - Verify icons load from CommunityDragon

- [x] **F4. Scope Fidelity Check — deep**
  - Verify Swiftplay position dropdown was NOT redesigned
  - Verify no backend/API changes were made
  - Verify only lobby role picker and Swiftplay selectors were touched

## Commit Strategy

| Task | Commit | Message                                                                       |
| ---- | ------ | ----------------------------------------------------------------------------- |
| T1   | Yes    | `feat(lobby): add CommunityDragon role icon URLs`                             |
| T2   | Yes    | `fix(swiftplay): stabilize zustand selectors to prevent infinite re-render`   |
| T3   | Yes    | `feat(lobby): redesign RolePicker with circular CommunityDragon icon buttons` |
| T4   | Yes    | `feat(lobby): implement FILL logic and role swap in bottom sheet`             |
| T5   | Yes    | `test(lobby): add role transition logic tests`                                |

## Success Criteria

1. Lobby role picker shows circular icon buttons using CommunityDragon official LoL client icons
2. FILL as primary role hides secondary selector and sets it UNSELECTED
3. Legacy swap behavior preserved (duplicate roles swap positions)
4. Swiftplay route loads without infinite render loop
5. All lint, test, and build commands pass
