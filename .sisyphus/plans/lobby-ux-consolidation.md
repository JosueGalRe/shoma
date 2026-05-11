# UX Planning: Mimic Lobby Consolidation

## Context

The current Mimic lobby interface requires significant vertical scrolling on mobile to access all functionality. A full-page screenshot reveals 9+ distinct sections stacked vertically:

1. Header (MIMIC logo, status, controls)
2. Lobby card
3. Queue card (with inner status panel)
4. Members card
5. Invite Player card
6. Invites card
7. Sent Invites card
8. Role Preferences card (Primary)
9. Role Preferences card (Secondary)

This creates a poor UX where critical actions (queue, invites, role selection) are scattered across multiple screen heights.

---

## Design Goal

**Single-viewport lobby**: All critical information and primary actions visible without scrolling on a standard mobile screen (375x812). Secondary features accessible via bottom sheet.

---

## Analysis of Current Issues

### Problem 1: Excessive Vertical Stacking
Each section is a full-width card with generous padding. 9 cards stacked vertically = ~1500px+ total height.

### Problem 2: Inefficient Space Usage
- Empty states ("No invites", "No lobby data") still consume full card height
- Role preferences use large icon grids that expand vertically
- Queue status has redundant labels ("Phase", "Queue Type", "Queue ID")

### Problem 3: Information Hierarchy is Flat
All sections have equal visual weight. Critical actions (Find Match, Change Role) are not prioritized.

---

## Proposed UX Solutions

### Solution A: Tabbed/Bottom Navigation (Recommended)

Consolidate secondary features into tabs or a bottom sheet.

**Viewport 1 (Always Visible - Top 60%):**
```
┌─────────────────────────────┐
│ MIMIC    Phase: Connected   │  Header (compact, single row)
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ Normal Draft     [Idle] │ │  Game Status Card
│ │ [Find Match] [Change]   │ │  (Lobby + Queue merged)
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ MEMBERS (Owner)         [3] │  Members strip
│ [🧑][🧑][🧑] +3 more      │  (horizontal scroll)
├─────────────────────────────┤
│ ⭐ Role Prefs   📨 Inv(2)  │  Bottom nav triggers
│      (swipe up)             │
└─────────────────────────────┘
```

**Bottom Sheet / Tabs (Swipe up to expand):**
- Role Preferences (primary/secondary roles)
- Invites (received, with badge count)
- Sent Invites

**Rationale:**
- Primary actions (queue, mode change) always visible
- Members shown as horizontal avatar strip (League Wild Rift pattern)
- Secondary features accessible but not consuming viewport
- Invite count visible as badge on bottom nav trigger

### Solution B: Compact Card Grid (Alternative)

Replace vertical stacking with a 2-column grid for non-critical cards.

**Layout:**
```
┌─────────────────────────────┐
│ Header (compact)            │
├─────────────────────────────┤
│ LOBBY        [Change Mode]  │
│ Normal Draft                │
├─────────────────────────────┤
│ QUEUE        [Idle]         │
│ [Find Match] [Leave]        │
├──────────┬──────────────────┤
│ MEMBERS  │ ROLE PREFS       │
│ [Avatar] │ ⭐ [Selected]    │
│ [Avatar] │ 🛡️ [Selected]    │
├──────────┴──────────────────┤
│ INVITES (0)  SENT (0)       │  (tab switcher)
│ [No invites]                │
└─────────────────────────────┘
```

**Rationale:**
- Uses horizontal space more efficiently
- Members and Role Prefs side-by-side
- Invites collapsed to tab switcher

### Solution C: Collapsible Sections (Progressive Disclosure)

Keep all sections but make non-critical ones collapsible by default.

**Default View:**
```
┌─────────────────────────────┐
│ Header                      │
├─────────────────────────────┤
│ LOBBY - Normal Draft        │
│ [Change Mode]               │
├─────────────────────────────┤
│ QUEUE - [Idle]              │
│ [Find Match] [Leave Queue]  │
├─────────────────────────────┤
│ MEMBERS ▼ (1)               │
│ [Avatar] JOSUEGALRE#...     │
├─────────────────────────────┤
│ ROLE PREFS ▶                │  (collapsed)
├─────────────────────────────┤
│ INVITES ▶ (0)               │  (collapsed)
└─────────────────────────────┘
```

**Rationale:**
- Minimal changes to existing structure
- User controls information density
- Sections expand in-place (modal-like overlay or accordion)

---

## Recommended Implementation: Hybrid Approach

Combine **Solution A** (tabbed bottom sheet) with **Solution C** (collapsible sections) for maximum flexibility.

### Phase 1: Header Consolidation
- Merge "Phase: Connected" into header bar
- Compact MIMIC logo + status + controls into single row
- Height: ~50px

### Phase 2: Game Status Card (Lobby + Queue Merged)
- Single card showing current mode + queue status inline
- **State-driven styling:**
  - Idle: Configuration panel look, mode selector prominent
  - Queuing: Pulsing border, timer display, "Cancel" button prominent
- Action buttons (Find Match, Change Mode, Leave Queue) in a row
- Empty state: Show selected mode + CTA, no negative messaging
- Height: ~120px

### Phase 3: Members Horizontal Strip
- Convert Members vertical list to horizontal avatar strip
- Avatar size: 56-64px (minimum 48px for touch targets)
- Show username + role on tap/press (tooltip or bottom sheet)
- Owner badge inline with avatar
- Wrap in `role="list"`, items with `role="listitem"`
- ARIA label: "Player: [Name], Role: [Mid], Status: [Ready]"
- Height: ~80px

### Phase 4: Bottom Navigation Bar
- Fixed bottom bar with triggers:
  - Role Preferences (icon + label)
  - Invites (icon + badge count)
- Tap opens bottom sheet
- Height: ~50px

### Phase 5: Bottom Sheet Component
- Reusable drawer for secondary features
- Swipe up to expand, swipe down to close
- Drag handle (pill shape) at top
- Scrim overlay on main content
- Lock main viewport scroll when open
- Height: Expands to 50-60% of viewport (~400-500px)

### Phase 6: Compact Empty States
- "No invites" → Hide section completely if count = 0
- "No lobby data" → Show friendly CTA: "Select a Game Mode"
- "Not in queue" → Simply show mode + Find Match button

---

## Visual References

**League of Legends: Wild Rift Lobby**
- Large CTA button anchored bottom
- Horizontal teammate avatars above CTA
- Game mode selector as top pill
- Secondary actions in bottom sheet

**Dota Underlords Mobile**
- Stacked compact rows for status
- Expandable player list
- Role/class icons inline

**Legends of Runeterra**
- Collapsible deck/info panels
- Bottom navigation for secondary screens
- Full-width primary action

---

## Technical Considerations

1. **OverlayScrollbars** - Lock scroll instance when bottom sheet opens
2. **TanStack Router** - Bottom sheet as state-driven component (not modal route)
3. **Tailwind v4** - Use `grid-cols-2`, `flex-row`, `overflow-x-auto` for layouts
4. **i18n** - Ensure all new labels are translatable
5. **Accessibility** - `aria-expanded`, focus trap in bottom sheet, ARIA roles for member strip
6. **Touch targets** - Minimum 44px for all interactive elements, 48px+ for avatars

---

## Success Criteria

- [x] All primary actions (queue, mode change) visible in first viewport
- [x] Invite count accessible via badge on bottom nav (one tap to open)
- [x] No vertical scroll required on 375x812 viewport
- [x] Members visible as horizontal strip (not vertical list)
- [x] Role Preferences accessible via bottom sheet
- [x] Empty states hidden or shown as inline text (not full cards)
- [x] Maintains dark theme and gold accent aesthetic
- [x] All touch targets minimum 44px
- [x] Screen reader compatible (ARIA roles, labels)

---

## Implementation Order

1. **Compact Header** - Reduce header height, merge status
2. **Merge Lobby+Queue Cards** - Single game status section with state-driven styling
3. **Horizontal Members** - Avatar strip with inline roles and ARIA
4. **Bottom Navigation Bar** - Fixed triggers for secondary features
5. **Bottom Sheet Component** - Reusable drawer with scroll lock
6. **Move Role Prefs to Bottom Sheet** - Free up viewport space
7. **Compact Invites** - Inline empty states, badge counts
8. **Testing** - Verify single-viewport on multiple screen sizes

---

## Files to Modify

- `apps/web-next/src/components/layout/AppShell.tsx` - Bottom sheet support, scroll lock
- `apps/web-next/src/routes/connected/route.tsx` - Compact header layout
- `apps/web-next/src/routes/connected/lobby/route.lazy.tsx` - Consolidated lobby view
- `apps/web-next/src/features/lobby/components/lobby-member.tsx` - Horizontal avatar variant
- `apps/web-next/src/components/ui/` - Bottom sheet/drawer primitive (new)
- `apps/web-next/src/styles.css` - Bottom sheet animations, compact padding utilities

---

## QA Scenarios

### Scenario 1: Single Viewport Verification
**Tool:** Playwright
**Steps:**
1. Set viewport to 375x812
2. Navigate to /connected/lobby
3. Measure document.documentElement.scrollHeight vs window.innerHeight
**Expected:** scrollHeight <= innerHeight (no scroll needed)
**Evidence:** Screenshot with viewport dimensions

### Scenario 2: Bottom Sheet Open/Close
**Tool:** Playwright
**Steps:**
1. Open lobby page
2. Tap "Role Preferences" bottom nav button
3. Verify bottom sheet opens (animation complete)
4. Verify main content has overflow: hidden
5. Tap scrim or swipe down
6. Verify bottom sheet closes
**Expected:** Smooth open/close, no scroll bleed on main content
**Evidence:** Screen recording

### Scenario 3: Member Strip Accessibility
**Tool:** Playwright
**Steps:**
1. Open lobby page
2. Tab navigate to member strip
3. Verify focus moves between avatars with arrow keys
4. Verify screen reader announces: "Player: [Name], Role: [Role], Status: [Status]"
**Expected:** Proper ARIA roles and keyboard navigation
**Evidence:** Accessibility tree dump

### Scenario 4: Touch Target Sizes
**Tool:** Playwright
**Steps:**
1. Open lobby page on mobile viewport
2. Inspect all interactive elements
3. Verify bounding boxes are >= 44x44px
**Expected:** No touch targets below 44px
**Evidence:** Element bounding box report

### Scenario 5: State-Driven Game Status Card
**Tool:** Playwright
**Steps:**
1. Verify idle state styling (configuration panel look)
2. Trigger queue state
3. Verify queuing state styling (pulsing border, timer)
**Expected:** Visual transformation between states
**Evidence:** Screenshots of both states

---

## Notes

- **Space available:** On 375x812 viewport, proposed layout uses ~300px, leaving ~512px for content/padding. This is spacious, not cramped.
- **OverlayScrollbars setup should remain** for the main scroll container when bottom sheet is closed
- **Bottom sheet animation:** 300ms ease-out, spring-like feel
- **Thumb zone:** Place critical actions (Find Match, bottom nav triggers) in bottom 30% of screen
- **Consider CSS Grid:** `grid-template-rows: auto 1fr auto` for viewport layout
- **Empty sections:** Completely hide Invites/Sent Invites cards when count = 0
