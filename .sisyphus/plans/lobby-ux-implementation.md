# Plan: Lobby UX Consolidation Implementation

## TL;DR

> **Summary**: Apply the lobby UX consolidation to achieve single-viewport mobile layout (375x812) with BottomNav, horizontal member strip, and BottomSheet for secondary features.
> **Deliverables**: BottomNav component, consolidated lobby layout in route.lazy.tsx, synchronized route.tsx
> **Effort**: Medium
> **Parallel**: YES - BottomNav creation + Lobby layout modifications can happen in parallel
> **Critical Path**: BottomNav → Lobby layout → QA

## Context

### Original Request

User asked "los cambios de lobby están?, no los veo reflejados" — confirmed that lobby consolidation changes from `lobby-ux-consolidation.md` were never applied to the actual lobby route files.

### Current State

- **create-lobby/route.tsx**: ✅ Complete redesign applied (game mode grid + BottomSheet)
- **lobby/route.tsx**: ❌ Unchanged (original two-column layout)
- **lobby/route.lazy.tsx**: ❌ Unchanged (original two-column layout)
- **BottomSheet component**: ✅ Exists at `apps/web-next/src/components/ui/bottom-sheet.tsx`
- **BottomNav component**: ❌ Does not exist
- **ScrollContainer component**: ❌ Does not exist (not needed for this implementation)

### What Was Planned vs Reality

The original `lobby-ux-consolidation.md` planned 8 phases. None were applied. We need to implement them now, adapting to current codebase state.

## Work Objectives

### Core Objective

Transform the lobby from a vertically-scrolling multi-card layout into a single-viewport mobile-first interface where:

1. Header, game status, and members fit in the visible area without scrolling
2. Secondary features (Role Preferences, Invites, Sent Invites) are accessible via BottomSheet triggered from BottomNav
3. Empty sections are hidden entirely

### Deliverables

1. **BottomNav component** (`apps/web-next/src/components/ui/bottom-nav.tsx`)
2. **Updated lobby/route.lazy.tsx** with consolidated layout
3. **Updated lobby/route.tsx** synchronized with lazy route
4. **Updated components/ui/index.ts** exporting BottomNav

### Definition of Done

- [ ] Lobby fits in 375x812 viewport without vertical scroll (`scrollHeight <= innerHeight`)
- [ ] BottomNav visible at bottom with Role Preferences and Invites triggers
- [ ] Tapping BottomNav buttons opens BottomSheet with correct content
- [ ] Members displayed as horizontal strip, not vertical list
- [ ] Game Status Card shows lobby + queue info in compact form
- [ ] All touch targets >= 44px
- [ ] TypeScript compiles without errors
- [ ] All i18n keys exist in en.ts and es.ts

### Must Have

- Header compacto (single row, ~50px)
- Game Status Card fusionado (lobby + queue)
- Members horizontal strip
- BottomNav fijo inferior
- BottomSheet para Role Preferences
- BottomSheet para Invites (received + sent)
- Ocultar secciones vacías

### Must NOT Have

- No cambiar lógica de negocio
- No modificar hooks de lobby (`useLobby`, `useCreateLobby`, etc.)
- No cambiar componentes reutilizables (Button, Card, Badge) sin justificación
- No usar `!important`

## Verification Strategy

- **Test decision**: tests-after (no test infra exists for lobby UI)
- **QA policy**: Agent-executed Playwright scenarios
- **Evidence**: Screenshots in `.sisyphus/evidence/`

## Execution Strategy

### Parallel Execution Waves

**Wave 1: Foundation (Parallel)**

- Task 1: Create BottomNav component
- Task 2: Export BottomNav from components/ui/index.ts
- Task 3: Read and analyze current lobby code structure

**Wave 2: Core Layout (Depends on Wave 1)**

- Task 4: Consolidate lobby/route.lazy.tsx layout
- Task 5: Add i18n keys for new UI elements

**Wave 3: Synchronization & Polish**

- Task 6: Sync lobby/route.tsx with route.lazy.tsx
- Task 7: Typecheck and QA

### Dependency Matrix

- Task 1 → Task 4 (BottomNav needed in lobby layout)
- Task 2 → Task 4 (export needed for import)
- Task 4 → Task 6 (lazy route is source of truth)
- All tasks → Task 7 (final verification)

## TODOs

### Task 1: Create BottomNav Component

**What to do**: Create a fixed bottom navigation bar component with triggers for secondary features.

**Recommended Agent Profile**:

- Category: `visual-engineering`
- Skills: []

**Parallelization**: Can Parallel: YES | Wave 1 | Blocks: Task 4 | Blocked By: None

**References**:

- Pattern: `apps/web-next/src/components/ui/bottom-sheet.tsx` — existing BottomSheet to trigger
- Pattern: `apps/web-next/src/routes/connected/create-lobby/route.tsx:188-217` — BottomSheet usage example
- Design: Fixed bottom bar, height ~56px, safe-area-inset-bottom padding

**Implementation Details**:

```tsx
// apps/web-next/src/components/ui/bottom-nav.tsx
interface BottomNavProps {
  items: {
    id: string
    label: string
    icon: React.ReactNode
    badge?: number
    onClick: () => void
  }[]
}

export function BottomNav({ items }: BottomNavProps) {
  return (
    <nav
      className='fixed bottom-0 left-0 right-0 bg-lol-navy-900/95 border-t border-lol-border-subtle backdrop-blur-sm z-30 pb-[env(safe-area-inset-bottom)]'
      aria-label='Lobby navigation'
    >
      <div className='flex items-center justify-around h-[56px]'>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className='flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-3 relative'
            aria-label={item.label}
          >
            {item.icon}
            <span className='text-[10px] text-lol-text-secondary mt-0.5'>{item.label}</span>
            {item.badge ? (
              <span className='absolute top-1 right-1 h-4 min-w-[16px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center'>
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </nav>
  )
}
```

**Acceptance Criteria**:

- [ ] Component renders without errors
- [ ] Fixed at bottom with proper z-index
- [ ] Each item has min 44px touch target
- [ ] Badge renders as red circle with white text
- [ ] Uses `pb-[env(safe-area-inset-bottom)]` for iOS safe area
- [ ] Has `aria-label` for accessibility

**QA Scenarios**:

```
Scenario: BottomNav renders with items
  Tool: Playwright
  Steps:
    1. Render BottomNav with 2 items
    2. Measure nav height
  Expected: Height >= 56px, items spaced evenly
  Evidence: .sisyphus/evidence/bottom-nav-render.png

Scenario: Badge display
  Tool: Playwright
  Steps:
    1. Render with badge=5
    2. Inspect badge element
  Expected: Badge is visible, >= 16px diameter, white text on red
  Evidence: .sisyphus/evidence/bottom-nav-badge.png
```

**Commit**: YES | Message: `feat(ui): add BottomNav component for lobby` | Files: `apps/web-next/src/components/ui/bottom-nav.tsx`

---

### Task 2: Export BottomNav from UI Index

**What to do**: Add BottomNav export to `apps/web-next/src/components/ui/index.ts`

**Recommended Agent Profile**:

- Category: `quick`
- Skills: []

**Parallelization**: Can Parallel: YES | Wave 1 | Blocks: Task 4 | Blocked By: None

**Acceptance Criteria**:

- [ ] BottomNav is exported from `components/ui/index.ts`
- [ ] Can be imported as `import { BottomNav } from '@/components/ui'`

**Commit**: YES | Message: `chore(ui): export BottomNav from index` | Files: `apps/web-next/src/components/ui/index.ts`

---

### Task 3: Analyze Lobby Code Structure

**What to do**: Read and document current lobby structure for transformation planning.

**Recommended Agent Profile**:

- Category: `quick`
- Skills: []

**Parallelization**: Can Parallel: YES | Wave 1 | Blocks: Task 4 | Blocked By: None

**Files to analyze**:

- `apps/web-next/src/routes/connected/lobby/route.lazy.tsx` (full file)
- `apps/web-next/src/features/lobby/components/lobby-member.tsx`
- `apps/web-next/src/features/lobby/components/role-picker.tsx`
- `apps/web-next/src/features/lobby/components/invite-overlay.tsx`

**Output**: Summary of:

- Current sections and their JSX structure
- State variables used
- Hook dependencies
- Component imports needed

**Commit**: NO

---

### Task 4: Consolidate Lobby Layout (route.lazy.tsx)

**What to do**: Transform `lobby/route.lazy.tsx` from multi-card vertical layout to single-viewport consolidated layout.

**Recommended Agent Profile**:

- Category: `visual-engineering`
- Skills: []

**Parallelization**: Can Parallel: NO | Wave 2 | Blocks: Task 6 | Blocked By: Task 1, Task 2, Task 3

**Transformation Plan**:

#### Phase A: Header Compacto

- Reduce from `space-y-4` with large title to single compact row
- Keep: MIMIC logo area, connection status, settings button
- Change: `h2` from `text-2xl` to `text-lg`, reduce padding
- Target height: ~50px

#### Phase B: Game Status Card Fusionado

- Merge Lobby card + Queue card into single section
- Show: Mode label (e.g., "Normal Draft"), Queue status badge, action buttons
- Remove redundant fields (Queue ID, Queue Type separate labels)
- Keep: Find Match / Leave Queue buttons, dodge penalty warning
- Use state-driven styling: different border/bg when queuing vs idle
- Target height: ~120px

#### Phase C: Members Horizontal Strip

- Replace vertical `<ul className="space-y-3">` with horizontal scroll container
- Use `flex overflow-x-auto` with `snap-x`
- Each member: Avatar (48px) + name truncated below
- Keep: Owner badge, kick/promote actions (show on tap/press)
- ARIA: `role="list"`, items `role="listitem"`, labels with name+role+status
- Target height: ~80px

#### Phase D: BottomNav Integration

- Add BottomNav at bottom of page
- Items:
  1. Role Preferences (icon: Award or Settings, opens RolePrefs sheet)
  2. Invites (icon: Mail, badge: invites.length, opens Invites sheet)
- Position: fixed bottom, z-30
- Add padding-bottom to main content to account for BottomNav height

#### Phase E: BottomSheet Integration

- Add 2 BottomSheet instances controlled by state:
  - `isRoleSheetOpen` → contains RolePicker components
  - `isInviteSheetOpen` → contains received + sent invites
- Move RolePicker from inline to BottomSheet
- Move Invites/SentInvites from inline to BottomSheet

#### Phase F: Ocultar Secciones Vacías

- Hide Invites section entirely when `invites.length === 0`
- Hide Sent Invites when `sentInvites.length === 0`
- Hide Role Preferences section (moved to sheet, no longer inline)

**Layout Structure After Transformation**:

```tsx
<main className="flex flex-col h-[100dvh] overflow-hidden">
  {/* Header - compact */}
  <header className="shrink-0 h-[50px] ...">...</header>

  {/* Game Status - merged lobby+queue */}
  <section className="shrink-0 ...">...</section>

  {/* Members - horizontal strip */}
  <section className="shrink-0 ...">...</section>

  {/* Spacer to push BottomNav to bottom */}
  <div className="flex-1" />

  {/* BottomNav */}
  <BottomNav ... />

  {/* BottomSheets */}
  <BottomSheet isOpen={isRoleSheetOpen} ...>
    <RolePicker ... />
    <RolePicker ... />
  </BottomSheet>

  <BottomSheet isOpen={isInviteSheetOpen} ...>
    {/* Invites list */}
    {/* Sent invites list */}
  </BottomSheet>
</main>
```

**Key State Additions**:

```tsx
const [isRoleSheetOpen, setIsRoleSheetOpen] = useState(false)
const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false)
```

**References**:

- Pattern: `apps/web-next/src/routes/connected/create-lobby/route.tsx` — compact mobile layout
- Pattern: `apps/web-next/src/components/ui/bottom-sheet.tsx` — BottomSheet API
- Existing: `apps/web-next/src/routes/connected/lobby/route.lazy.tsx` — current structure (preserve all hooks/state)

**Acceptance Criteria**:

- [ ] All original functionality preserved (queue, invites, roles, kick, promote)
- [ ] No vertical scroll on 375x812 viewport
- [ ] BottomNav visible and functional
- [ ] BottomSheet opens/closes correctly for Role Prefs and Invites
- [ ] Members shown horizontally
- [ ] Empty sections hidden
- [ ] TypeScript compiles

**QA Scenarios**:

```
Scenario: Single Viewport Verification
  Tool: Playwright
  Steps:
    1. Set viewport to 375x812
    2. Navigate to /connected/lobby
    3. Execute: document.documentElement.scrollHeight <= window.innerHeight
  Expected: true
  Evidence: .sisyphus/evidence/lobby-viewport-375x812.png

Scenario: BottomSheet Role Preferences
  Tool: Playwright
  Steps:
    1. Open lobby
    2. Tap "Role Preferences" in BottomNav
    3. Verify BottomSheet opens with RolePicker components
    4. Select a role
    5. Close sheet
  Expected: Role selection works, sheet closes smoothly
  Evidence: .sisyphus/evidence/lobby-role-sheet.png

Scenario: BottomSheet Invites
  Tool: Playwright
  Steps:
    1. Open lobby with pending invites
    2. Verify badge count on BottomNav
    3. Tap "Invites" in BottomNav
    4. Verify invites list shown in BottomSheet
  Expected: Badge accurate, invites visible in sheet
  Evidence: .sisyphus/evidence/lobby-invite-sheet.png

Scenario: Member Strip Horizontal
  Tool: Playwright
  Steps:
    1. Open lobby with multiple members
    2. Inspect members section
    3. Verify flex-direction: row
  Expected: Members displayed horizontally, not vertically
  Evidence: .sisyphus/evidence/lobby-members-strip.png

Scenario: Empty Sections Hidden
  Tool: Playwright
  Steps:
    1. Open lobby with 0 invites
    2. Verify no invites section visible
    3. Verify no "No invites" text visible
  Expected: Invites section completely absent from DOM
  Evidence: .sisyphus/evidence/lobby-empty-hidden.png
```

**Commit**: YES | Message: `feat(lobby): consolidate layout to single viewport` | Files: `apps/web-next/src/routes/connected/lobby/route.lazy.tsx`

---

### Task 5: Add i18n Keys

**What to do**: Add any missing translation keys used in the consolidated lobby.

**Recommended Agent Profile**:

- Category: `quick`
- Skills: []

**Parallelization**: Can Parallel: YES | Wave 2 | Blocks: None | Blocked By: Task 4 (need to know what keys are used)

**Files to modify**:

- `apps/web-next/src/i18n/translations/en.ts`
- `apps/web-next/src/i18n/translations/es.ts`

**Likely needed keys** (verify during Task 4):

- `lobby.bottomNav.rolePreferences`
- `lobby.bottomNav.invites`

**Acceptance Criteria**:

- [ ] All new UI text has i18n keys
- [ ] Keys exist in both en.ts and es.ts
- [ ] No hardcoded strings in JSX (except CSS class names)

**Commit**: YES | Message: `feat(i18n): add lobby bottom nav translations` | Files: `apps/web-next/src/i18n/translations/en.ts`, `apps/web-next/src/i18n/translations/es.ts`

---

### Task 6: Sync route.tsx with route.lazy.tsx

**What to do**: Apply identical changes to `lobby/route.tsx` as were made to `route.lazy.tsx`.

**Recommended Agent Profile**:

- Category: `quick`
- Skills: []

**Parallelization**: Can Parallel: NO | Wave 3 | Blocks: None | Blocked By: Task 4

**Important Note**: `route.tsx` and `route.lazy.tsx` currently have nearly identical content (both are ~500+ lines with the same structure). The only difference is:

- `route.tsx` uses `createFileRoute`
- `route.lazy.tsx` uses `createLazyFileRoute`

**Approach**: After Task 4 is complete, copy the consolidated JSX from route.lazy.tsx into route.tsx, preserving the import differences (`createFileRoute` vs `createLazyFileRoute`).

**Acceptance Criteria**:

- [ ] route.tsx has identical layout structure to route.lazy.tsx
- [ ] Only difference is router import (`createFileRoute` vs `createLazyFileRoute`)
- [ ] TypeScript compiles

**Commit**: YES | Message: `feat(lobby): sync route.tsx with consolidated layout` | Files: `apps/web-next/src/routes/connected/lobby/route.tsx`

---

### Task 7: Typecheck and Final QA

**What to do**: Run typecheck and execute QA scenarios.

**Recommended Agent Profile**:

- Category: `quick`
- Skills: []

**Parallelization**: Can Parallel: NO | Wave 3 | Blocks: None | Blocked By: Task 4, Task 5, Task 6

**Steps**:

1. Run `cd apps/web-next && npm run typecheck` (or equivalent)
2. Fix any TypeScript errors
3. Run dev server and verify visually
4. Execute QA scenarios from Task 4

**Acceptance Criteria**:

- [ ] `npm run typecheck` passes with 0 errors
- [ ] All QA scenarios pass
- [ ] Screenshots captured for evidence

**Commit**: NO (only if fixes needed)

## Final Verification Wave (MANDATORY)

- [ ] F1. Plan Compliance Audit — oracle: Verify all planned changes applied
- [ ] F2. Code Quality Review — unspecified-high: Check for AI slop, unused imports
- [ ] F3. Real Manual QA — unspecified-high: Playwright viewport tests
- [ ] F4. Scope Fidelity Check — deep: Ensure only layout changed, business logic untouched

## Commit Strategy

- Task 1: `feat(ui): add BottomNav component for lobby`
- Task 2: `chore(ui): export BottomNav from index`
- Task 4: `feat(lobby): consolidate layout to single viewport`
- Task 5: `feat(i18n): add lobby bottom nav translations`
- Task 6: `feat(lobby): sync route.tsx with consolidated layout`

## Success Criteria

- Lobby page fits in 375x812 viewport without vertical scrolling
- BottomNav visible with Role Preferences and Invites triggers
- BottomSheet opens correctly for both secondary features
- Members displayed horizontally
- All original functionality preserved
- TypeScript compiles cleanly
- All touch targets >= 44px
