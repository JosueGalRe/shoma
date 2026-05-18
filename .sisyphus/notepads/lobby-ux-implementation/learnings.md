# Lobby UX Implementation - Analysis & Context

## Current State (from reading files)

### route.lazy.tsx / route.tsx

- Both files are ~520 lines, nearly identical
- route.tsx has a `loader` function; route.lazy.tsx doesn't
- Two main render paths:
  1. `!isInLobby` → Play screen with mode grid (ALREADY REDESIGNED ✅)
  2. `isInLobby` → Lobby view with vertical multi-card layout (NEEDS CONSOLIDATION ❌)

### Lobby View Structure (isInLobby = true)

```
<main className="space-y-4">
  {/* Header - ~120px tall */}
  <section>Title + Status Badge + Change Mode button</section>

  {/* Two-column grid */}
  <div className="grid gap-4 xl:grid-cols-[...]">
    <div className="space-y-4"> {/* Left column */}
      <Card>Queue Status</Card>
      <Card>Members (vertical list)</Card>
    </div>
    <div className="space-y-4"> {/* Right column */}
      <Card>Invite Player</Card>
      <Card>Invites</Card>
      <Card>Sent Invites</Card>
      <Card>Role Preferences</Card>
    </div>
  </div>
</main>
```

### lobby-member.tsx

- Renders as `<li>` with `flex items-center gap-3`
- Contains: Avatar (md), name, role badges, kick/promote buttons
- Currently designed for vertical list layout
- Needs horizontal strip variant

### bottom-sheet.tsx (EXISTS ✅)

- Props: `isOpen`, `onClose`, `children`, `title?`
- Features: scroll lock, escape key, focus trap, swipe gestures, portal render
- Use: `import { BottomSheet } from '@/components/ui'` → NOT exported yet from index.ts

### i18n Keys Needed (not yet in en.ts/es.ts)

- `lobby.bottomNav.rolePreferences`
- `lobby.bottomNav.invites`

## Transformation Plan

1. **BottomNav**: New component, fixed bottom, ~56px height
2. **Header**: Compact single row, reduce from `text-2xl` to `text-lg`
3. **Game Status**: Merge Lobby card + Queue card into one compact section
4. **Members**: Convert vertical `<ul>` to horizontal scroll strip
5. **BottomSheet Integration**: Move Role Prefs and Invites into sheets
6. **Empty Sections**: Hide invites/sent invites when length === 0
7. **i18n**: Add bottomNav keys
8. **Sync**: Copy route.lazy.tsx changes to route.tsx (preserve loader)

## Notes

- `isInLobby = false` path (play screen) is ALREADY redesigned. DO NOT TOUCH.
- Only transform the `isInLobby = true` path.
- Keep all hooks, state, and business logic intact.
- route.tsx loader must be preserved.
- Added BottomNav component with fixed positioning and safe area padding for mobile web.
- Added `lobby.bottomNav.rolePreferences` and `lobby.bottomNav.invites` to both `en.ts` and `es.ts` right after `sentInvites` in the `lobby` object.
- Verified both translation files with `lsp_diagnostics`; no diagnostics were reported.

- Synced lobby layout from ; eager route keeps + loader, while the component body now uses the consolidated bottom-nav/bottom-sheet layout.

- Synced route.tsx lobby layout from route.lazy.tsx; eager route keeps createFileRoute + loader, while the component body now uses the consolidated bottom-nav/bottom-sheet layout.

- Minor QA polish fix: removed the empty invites fallback text from both lobby route invite sheets so empty states are fully blank.
- Added hover/focus-visible affordances to `BottomNav` buttons for clearer accessibility feedback.
- Verified the edited web-next files with `lsp_diagnostics` and ran `npx tsc --noEmit` successfully in `apps/web-next`.
