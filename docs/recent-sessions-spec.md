# Recent Sessions Feature Spec

## Context

The user wants to replace the aggressive auto-reconnect behavior on the home screen with a **recent sessions** system. Currently:

- `useConnectionFlow` auto-connects with persisted code, competing with `?code=` URL params
- The fix we committed makes `?code=` sync with the input, but the user wants to go further
- The user confirmed: entering `?code=336077` on a fresh tab leaves the input EMPTY — the auto-reconnect logic is the real problem

## Goal

Replace auto-reconnect with a **recent sessions list**:
1. `?code=XYZ` only fills the OTP input, never auto-connects
2. The main card keeps the OTP input + Connect button (as-is)
3. Below the main card (outside it), show a "Recent sessions" list
4. Each session shows the code + a "Reconnect" button
5. Clicking a recent session connects with that code
6. LRU persistence: up to 5 codes in `localStorage`, deduplicated, most recent first

## Current Architecture

### Files involved:
- `loom/src/features/connect/hooks/use-connection-flow.ts` — main hook, currently auto-connects
- `loom/src/features/connect/components/connect-screen.tsx` — renders OTP + Connect
- `loom/src/features/connect/components/connect-screen-styles.ts` — tailwind-variants styles
- `loom/src/core/state/session-store.ts` — persist connection code in localStorage
- `loom/src/features/connect/connect-types.ts` — `ConnectSearch`, `ConnectScreenProps`
- `loom/src/lib/reconnect-utils.ts` — global auto-reconnect (already fixed to skip on `/`)

### Store:
- `session-store.ts` persists `connectionCode` in `localStorage` under `shoma:connection`
- `relay-store.ts` manages `code`, `status`, `connect`, `disconnect`
- `useGlobalSessionReconnect` in `__root` also tries to auto-reconnect

## Required Changes

### Business Logic (deep agent)
1. **Remove all auto-connect logic** from `use-connection-flow.ts`
2. **Create `recent-sessions-store.ts`** (or extend session-store):
   - Persist array of recent codes in `localStorage`
   - Max 5, LRU with deduplication
   - API: `addRecentSession(code)`, `getRecentSessions()`, `removeRecentSession(code)`, `clearRecentSessions()`
3. **On successful connect**, add the code to recent sessions
4. **On manual disconnect/logout**, optionally keep or remove from recents (user decision — default: keep)
5. **`use-connection-flow.ts`**: `?code=` only fills input. No auto-connect. No `useEffect` for auto-connect.
6. **`reconnect-utils.ts`**: Remove or disable the auto-reconnect effect entirely (or make it only work if explicitly opted in)

### UI/UX (visual agent)
1. **Location**: Outside/underneath the main `Card`, not inside it
2. **Layout**: `ConnectScreen` currently renders one `Card`. Add a new section below it.
3. **Recent sessions component**:
   - List of recent codes, each with a "Reconnect" button
   - Show a small label/header like "Recent sessions" or similar
   - If no recent sessions, don't render the section at all
   - Each item should be clearly tappable (mobile-first)
4. **Styling**: Use existing `tailwind-variants` patterns, match dark theme, keep it subtle
5. **Accessibility**: Proper labels, focus states

## Technical Constraints

- React 19 + TanStack Router + Tailwind v4
- `tailwind-variants` for styles > 80 chars
- One component per file
- No `any`, no `as` assertions
- `oxfmt` formatting (no semicolons, single quotes, printWidth 128)
- No inline Tailwind strings > 80 chars
- Use `zustand` for state, `createPersistedStore` from `create-persisted-store.ts` for persistence
- Follow existing naming: `-types.ts`, `-utils.ts`, `-styles.ts` suffixes

## Current `ConnectScreen` structure

```tsx
<div className={styles.root()}>
  <Card className={styles.card()}>
    <CardContent className={styles.content()}>
      {/* Title, status, OTP, buttons */}
    </CardContent>
  </Card>
</div>
```

The recent sessions should go **after** the `Card`, still inside `styles.root()`, or in a new wrapper.

## Existing style patterns

See `connect-screen-styles.ts` for reference. Uses `tailwind-variants` with `slots`:
```ts
export const connectScreenStyles = tv({
  slots: {
    root: '...',
    card: '...',
    content: '...',
    // ...
  }
})
```

## Out of Scope
- OAuth / auth changes
- Backend changes
- QR code scanner changes

## Verification
- `pnpm --filter @shoma/loom typecheck`
- `pnpm --filter @shoma/loom lint`
- `pnpm --filter @shoma/loom test`
- Manual: open `/?code=336077`, confirm input fills, no auto-connect, recent sessions appear after first connect
