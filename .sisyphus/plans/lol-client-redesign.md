# Plan: LoL Client-Inspired UI Redesign for Mimic

## TL;DR

> **Summary**: Transform `apps/web-next` from a basic shadcn mobile UI into a League of Legends client-inspired dark fantasy design with gold/bronze accents, responsive hybrid layout (mobile-first + desktop sidebar), and a new social/friends panel. All existing game flows are redesigned; business logic is preserved.
> **Deliverables**: Custom design system, redesigned AppShell + navigation, 9 redesigned flows, new social feature with friends/groups/chat, responsive hybrid layout, accessibility compliance.
> **Effort**: XL
> **Parallel**: YES — 5 waves + final verification
> **Critical Path**: Wave 1 (Design System + Shell) → Wave 2 (Core Flows) → Wave 3 (Champ Select + Game Flows) → Wave 4 (Social) → Wave 5 (Polish)

## Context

### Original Request

Replicar el estilo de web legacy con flujos similares a League of Legends, darles un enfoque más moderno usando skills de Vercel, y convertir la codebase en lo mejor posible. Incluye imágenes de referencia del cliente de LoL.

### Interview Summary

- **Visual Goal**: LoL-inspired (dark navy backgrounds, gold/bronze borders, fantasy typography, shield-shaped CTAs) adapted for web — not pixel-perfect clone.
- **Scope**: `apps/web-next` only. Legacy (`web/`, `rift/`, `src-old/`) remains untouched.
- **Flows**: All existing flows redesigned + new social/friends feature.
- **Responsive**: Hybrid, mobile-first maintaining LoL essence. Desktop gets persistent social sidebar; mobile uses drawer/overlay.
- **Social**: Friends list with online/away/offline states, groups, invite to lobby, basic one-to-one chat (no persistence required).
- **Fidelity**: Inspired by LoL, adapted to web. Use DDragon/public assets only.

### Metis Review (gaps addressed)

- **Phased approach**: Design system shell first, then flow migration, then social as isolated feature.
- **Scope creep guardrails**: Social is highest risk; treat as separately verifiable. No unrelated features (profiles, store, loot, collections, settings).
- **Do NOT**: Rewrite business logic, clone pixel-perfect, touch legacy, add premature abstractions.
- **Acceptance criteria**: All must be agent-executable (build, typecheck, Playwright, responsive assertions, axe).
- **Edge cases planned**: LCU disconnect, 0 friends, hundreds of friends, long names, missing assets, reduced motion, landscape.

## Work Objectives

### Core Objective

Establish a complete LoL-inspired design system and apply it across all existing flows in `apps/web-next`, while adding a new social/friends panel with basic chat. Preserve all existing business logic and data fetching.

### Deliverables

1. Custom CSS design tokens (colors, shadows, borders, typography) integrated with Tailwind v4
2. Redesigned UI primitives (Button, Card, Input, Badge, Avatar) in LoL style
3. Redesigned AppShell with responsive hybrid layout
4. Redesigned navigation (desktop tabs + mobile drawer)
5. Redesigned connect screen
6. Redesigned lobby with game mode selection grid
7. Redesigned queue + ready-check screens
8. Redesigned champ-select with improved visuals
9. Redesigned create-lobby, swiftplay, custom, arena, clash screens
10. New social/friends feature (list, groups, invite, basic chat)
11. Animation and polish layer (CSS transitions, glows, hover states)
12. Accessibility compliance (contrast, focus states, keyboard nav, reduced motion)

### Definition of Done (verifiable conditions with commands)

- `cd apps/web-next && bun run build` succeeds with zero errors
- `cd apps/web-next && bun run typecheck` succeeds with zero errors _(Note: add `"typecheck": "tsc -b"` to `apps/web-next/package.json` scripts if missing)_
- `cd apps/web-next && bun run lint` succeeds
- Playwright tests verify all redesigned routes render without errors
- Responsive tests pass at 390x844 (mobile), 768x1024 (tablet), 1440x900 (desktop)
- Accessibility axe checks pass on connect, lobby, champ-select, and social screens
- Existing queue/lobby/champ-select actions still invoke the same LCU hooks/mutations

### Must Have

- Dark navy background with subtle texture/gradient (no flat gray)
- Gold/bronze accent colors for borders, highlights, and primary actions
- Fantasy-style display font for headings (Cinzel or similar), sans-serif for UI text
- Buttons with angular/shield-like styling (not default rounded shadcn)
- Cards with subtle gold border and dark translucent background
- Responsive hybrid layout: mobile stack, desktop sidebar + main content
- Social panel visible/persistent on desktop, behind drawer on mobile
- Friend states: online (green), away (yellow), offline (gray)
- Friend groups with expand/collapse
- Basic chat: read/send one-to-one messages via LCU (no persistence)
- All existing flows remain functionally intact

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)

- Do NOT touch `web/`, `rift/`, `src-old/`, `apps/conduit-next`, `apps/rift-next`
- Do NOT rewrite queue/lobby/champ-select business logic or data fetching
- Do NOT add unrelated features: profiles, match history, store, loot, collections, settings
- Do NOT use copyrighted Riot logos, proprietary fonts, or exact client layouts
- Do NOT introduce Framer Motion or heavy animation libraries unless CSS alone is insufficient
- Do NOT build a full chat system with persistence, history, or group chat
- Do NOT add virtualization unless a list genuinely exceeds 50 items and profiling shows jank
- Do NOT replace TanStack Router, React Query, Zustand, i18next, or Tailwind v4
- Do NOT create compound component abstractions for one-off screens

## Verification Strategy

> ZERO HUMAN INTERVENTION — all verification is agent-executed.

- **Test decision**: Tests-after (no existing test infra for UI redesign). Agent QA scenarios for every task.
- **QA policy**: Every task has agent-executed happy-path + failure-path scenarios
- **Evidence**: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves

> Target: 5-8 tasks per wave. Extract shared dependencies as Wave-1 tasks for max parallelism.

**Wave 1: Foundation** — Design tokens, theme, layout shell, UI primitives, typography, responsive scaffold. All downstream waves depend on this.
**Wave 2: Core Flows** — Connect screen, Lobby, Queue, Ready-check. Can start after Wave 1 primitives are done.
**Wave 3: Game Flows** — Champ-select (most complex), Create-lobby, Swiftplay, Custom, Arena, Clash. Can start after Wave 1.
**Wave 4: Social Feature** — Friends list, groups, chat, LCU integration. Can start after Wave 1 layout shell is done.
**Wave 5: Polish & Performance** — Animations, accessibility, responsive refinements, asset optimization, bundle review. Depends on Waves 2-4.

### Dependency Matrix (full, all tasks)

| Task                                                   | Blocks                                           | Blocked By                                       |
| ------------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------ |
| 1.1 Design Tokens                                      | 1.2, 1.3, 1.4, 1.5                               | —                                                |
| 1.2 Tailwind v4 Theme Integration                      | 1.3, 1.4, 1.5                                    | 1.1                                              |
| 1.3 Typography & Fonts                                 | 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2 | 1.1, 1.2                                         |
| 1.4 UI Primitives (Button, Card, Input, Badge, Avatar) | 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2 | 1.1, 1.2, 1.3                                    |
| 1.5 AppShell + Responsive Layout                       | 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2 | 1.1, 1.2, 1.3, 1.4                               |
| 2.1 Connect Screen                                     | —                                                | 1.3, 1.4, 1.5                                    |
| 2.2 Lobby Redesign                                     | —                                                | 1.3, 1.4, 1.5                                    |
| 2.3 Queue + Ready-check                                | —                                                | 1.3, 1.4, 1.5                                    |
| 3.1 Champ-select Redesign                              | —                                                | 1.3, 1.4, 1.5                                    |
| 3.2 Create-lobby Redesign                              | —                                                | 1.3, 1.4, 1.5                                    |
| 3.3 Swiftplay Redesign                                 | —                                                | 1.3, 1.4, 1.5                                    |
| 3.4 Custom Redesign                                    | —                                                | 1.3, 1.4, 1.5                                    |
| 3.5 Arena Redesign                                     | —                                                | 1.3, 1.4, 1.5                                    |
| 3.6 Clash Redesign                                     | —                                                | 1.3, 1.4, 1.5                                    |
| 4.1 Social Layout + Stores                             | 4.2                                              | 1.3, 1.4, 1.5                                    |
| 4.2 Social Components (FriendList, Groups, Chat)       | 4.3                                              | 4.1                                              |
| 4.3 Social LCU Integration                             | —                                                | 4.2                                              |
| 5.1 Animations + Glow Effects                          | —                                                | 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.3 |
| 5.2 Accessibility Audit + Fixes                        | —                                                | 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.3 |
| 5.3 Responsive Refinements                             | —                                                | 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.3 |
| 5.4 Asset Optimization + Bundle Review                 | —                                                | 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.3 |

### Agent Dispatch Summary (wave → task count → categories)

| Wave   | Tasks | Categories                           |
| ------ | ----- | ------------------------------------ |
| Wave 1 | 5     | visual-engineering, quick            |
| Wave 2 | 3     | visual-engineering, quick            |
| Wave 3 | 6     | visual-engineering, deep             |
| Wave 4 | 3     | visual-engineering, deep             |
| Wave 5 | 4     | visual-engineering, unspecified-high |
| Final  | 4     | unspecified-high, deep, oracle       |

## TODOs

> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 1.1. Establish LoL-Inspired Design Tokens (CSS Variables)

  **What to do**: Create a comprehensive set of CSS custom properties in `apps/web-next/src/styles/design-tokens.css` that define the LoL visual identity. This includes a dark navy palette (`--lol-navy-950` to `--lol-navy-800`), gold/bronze accents (`--lol-gold`, `--lol-bronze`), text colors (`--lol-text-primary`, `--lol-text-secondary`), and structural properties for borders, glows, and spacing.
  **Must NOT do**: Do NOT use flat gray colors (`bg-gray-900`). Do NOT create a traditional `tailwind.config.js`; Tailwind v4 is configured via CSS. Do NOT copy exact Riot hex codes.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: This is pure CSS/styling work.
  - Skills: [`web-design-guidelines`] - Reason: To ensure tokens are accessible and follow design system best practices.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 1.2, 1.3, 1.4, 1.5 | Blocked By: —

  **References**:
  - Pattern: `apps/web-next/src/main.tsx` - Check how global styles are imported.
  - API/Type: Tailwind v4 `@theme` block in `apps/web-next/vite.config.ts` or global CSS.
  - External: `https://tailwindcss.com/docs/theme` - Tailwind v4 theme documentation.

  **Acceptance Criteria**:
  - [x] File `apps/web-next/src/styles/design-tokens.css` exists and exports a set of at least 20 CSS variables.
  - [x] Variables cover colors (navy, gold, bronze, text), borders, shadows, and spacing.
  - [x] Build command `bun run build` in `apps/web-next` succeeds.

  **QA Scenarios**:

  ```
  Scenario: Design tokens are globally available
    Tool: Bash
    Steps: grep -r -e "--lol-" apps/web-next/src/styles/design-tokens.css | wc -l
    Expected: Output is >= 20
    Evidence: .sisyphus/evidence/task-1-1-tokens.txt
  ```

  **Commit**: YES | Message: `feat(ui): add LoL-inspired design tokens` | Files: `apps/web-next/src/styles/design-tokens.css`

- [x] 1.2. Integrate Design Tokens with Tailwind v4

  **What to do**: Register the custom design tokens within Tailwind v4's configuration. Since Tailwind v4 is used via a Vite plugin without a traditional config file, map the CSS variables to Tailwind's `@theme` block in the main CSS file or via the Vite plugin options. Ensure utilities like `bg-lol-navy`, `text-lol-gold`, and `border-lol-bronze` work.
  **Must NOT do**: Do NOT create a `tailwind.config.js` file. Do NOT break existing Tailwind utilities.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Requires understanding of Tailwind v4's new configuration model.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 1.3, 1.4, 1.5 | Blocked By: 1.1

  **References**:
  - Pattern: `apps/web-next/vite.config.ts` - Inspect Tailwind v4 plugin configuration.
  - API/Type: `apps/web-next/src/main.tsx` or global CSS entry for `@theme` usage.
  - External: `https://tailwindcss.com/docs/v4-beta` - Tailwind v4 configuration guide.

  **Acceptance Criteria**:
  - [x] Custom Tailwind utilities (e.g., `bg-lol-navy-900`, `text-lol-gold`) can be used in any component.
  - [x] `bun run build` succeeds without Tailwind compilation errors.

  **QA Scenarios**:

  ```
  Scenario: Tailwind utilities are functional
    Tool: Bash
    Steps: Create a test component using `className="bg-lol-navy-900 text-lol-gold"` and run `bun run build`.
    Expected: Build succeeds with no CSS-related errors.
    Evidence: .sisyphus/evidence/task-1-2-build.txt
  ```

  **Commit**: YES | Message: `feat(ui): integrate design tokens with tailwind v4` | Files: `apps/web-next/src/styles/*`, `apps/web-next/vite.config.ts`

- [x] 1.3. Implement Typography System (Fonts)

  **What to do**: Integrate a fantasy/display font (e.g., Cinzel from Google Fonts) for headings and a clean sans-serif for UI text. Set up global CSS rules and Tailwind font family utilities (e.g., `font-display`, `font-body`). Ensure font files are loaded efficiently (e.g., via `@fontsource` or preconnect link tags).
  **Must NOT do**: Do NOT use proprietary Riot fonts. Do NOT block initial render with heavy font loading.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Typography is a core visual pillar.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: None | Blocked By: 1.1, 1.2

  **References**:
  - Pattern: `apps/web-next/index.html` - Add font preconnect/links.
  - API/Type: Tailwind v4 `fontFamily` theme configuration.

  **Acceptance Criteria**:
  - [x] `font-display` and `font-body` utilities are available in Tailwind.
  - [x] Headings across the app use the display font.
  - [x] No layout shift (CLS) caused by font loading.

  **QA Scenarios**:

  ```
  Scenario: Fonts load correctly
    Tool: Playwright
    Steps: Open the app, inspect a heading element's `font-family`.
    Expected: Font-family contains the display font name (e.g., "Cinzel").
    Evidence: .sisyphus/evidence/task-1-3-fonts.png
  ```

  **Commit**: YES | Message: `feat(ui): implement typography system with display and body fonts` | Files: `apps/web-next/index.html`, `apps/web-next/src/styles/typography.css`

- [x] 1.4. Create LoL-Styled UI Primitives

  **What to do**: Redesign the core shadcn/ui primitives to match the LoL aesthetic. Update `Button` (angular/shield-like shapes, gold gradients), `Card` (dark translucent background, subtle gold border), and `Input` (dark background with subtle glow on focus). **Also create new `Badge` and `Avatar` primitives** since they do not currently exist in the codebase. Badge will be used for status indicators; Avatar will be used for summoner profile pictures with online/away/offline border states. Keep component APIs consistent with shadcn conventions.
  **Must NOT do**: Do NOT change existing component prop interfaces (Button, Card, Input). Do NOT break existing functionality. Do NOT use inline styles; use Tailwind classes and CSS variables.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Heavy UI component work.
  - Skills: [`vercel-composition-patterns`] - Reason: To ensure primitives are composable and avoid prop proliferation.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: None | Blocked By: 1.1, 1.2, 1.3

  **References**:
  - Pattern: `apps/web-next/src/components/ui/button.tsx` - Current button implementation.
  - Pattern: `apps/web-next/src/components/ui/card.tsx` - Current card implementation.
  - Pattern: `apps/web-next/src/components/ui/input.tsx` - Current input implementation.
  - API/Type: `apps/web-next/src/components/ui/index.ts` - Export barrel.

  **Acceptance Criteria**:
  - [ ] Button, Card, Input are visually redesigned.
  - [ ] New `Badge` primitive exists in `apps/web-next/src/components/ui/badge.tsx` and is exported from `index.ts`.
  - [ ] New `Avatar` primitive exists in `apps/web-next/src/components/ui/avatar.tsx` and is exported from `index.ts`.
  - [ ] Existing prop interfaces for Button, Card, Input are unchanged.
  - [ ] All existing usages of Button, Card, Input automatically pick up the new styles.

  **QA Scenarios**:

  ```
  Scenario: Primitives render with new styles
    Tool: Playwright
    Steps: Navigate to `/connected/lobby`, take a screenshot.
    Expected: Buttons are dark with gold borders, cards have subtle gold edges.
    Evidence: .sisyphus/evidence/task-1-4-primitives.png

  Scenario: New primitives exist
    Tool: Bash
    Steps: ls apps/web-next/src/components/ui/badge.tsx && ls apps/web-next/src/components/ui/avatar.tsx
    Expected: Both files exist.
    Evidence: .sisyphus/evidence/task-1-4-new-primitives.txt
  ```

  **Commit**: YES | Message: `feat(ui): redesign core ui primitives and add badge/avatar` | Files: `apps/web-next/src/components/ui/*`

- [x] 1.5. Redesign AppShell and Responsive Layout

  **What to do**: Rewrite `AppShell` and `ConnectedRouteComponent` to support the new responsive hybrid layout. The layout should feature a dark textured background. On desktop (`lg:` breakpoint and up), it displays a persistent social sidebar on the right and the main content area on the left. On mobile, the social panel is hidden and accessible via a toggle/drawer. The navigation header should be redesigned with the new typography and colors.
  **Must NOT do**: Do NOT remove the `LandscapeWarning` or `SafeArea` wrappers. Do NOT break TanStack Router's `Outlet`. Do NOT make the layout unusable on small screens.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Complex layout restructuring.
  - Skills: [`vercel-react-best-practices`] - Reason: To optimize layout re-renders and responsive behavior.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: None | Blocked By: 1.1, 1.2, 1.3, 1.4

  **References**:
  - Pattern: `apps/web-next/src/components/layout/AppShell.tsx` - Current shell.
  - Pattern: `apps/web-next/src/routes/connected/route.tsx` - Current connected layout.
  - API/Type: `apps/web-next/src/lib/connected-layout-utils.ts` - Navigation items.

  **Acceptance Criteria**:
  - [ ] Desktop layout shows main content + social sidebar side-by-side.
  - [ ] Mobile layout shows main content only, with a way to open the social drawer.
  - [ ] Navigation header uses the new design tokens and fonts.
  - [ ] `bun run build` succeeds.

  **QA Scenarios**:

  ```
  Scenario: Desktop layout has sidebar
    Tool: Playwright
    Steps: Open `/connected/lobby` at 1440x900, check for social panel visibility.
    Expected: Social panel is visible on the right side of the screen.
    Evidence: .sisyphus/evidence/task-1-5-desktop.png

  Scenario: Mobile layout hides sidebar
    Tool: Playwright
    Steps: Open `/connected/lobby` at 390x844, check for social panel visibility.
    Expected: Social panel is hidden; a toggle button to open it exists.
    Evidence: .sisyphus/evidence/task-1-5-mobile.png
  ```

  **Commit**: YES | Message: `feat(ui): redesign appshell with responsive hybrid layout` | Files: `apps/web-next/src/components/layout/AppShell.tsx`, `apps/web-next/src/routes/connected/route.tsx`

- [x] 2.1. Redesign Connect Screen

  **What to do**: Redesign the landing/connect screen (`/`) to match the LoL aesthetic. Replace the plain form with a more atmospheric layout featuring the dark navy background, the fantasy display font for the title, and styled inputs/buttons. Maintain the existing connection logic (code entry, auto-connect).
  **Must NOT do**: Do NOT change the connection flow logic in `use-connection-flow.ts`. Do NOT remove the reconnect hook.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Single-screen visual overhaul.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: None | Blocked By: 1.3, 1.4, 1.5

  **References**:
  - Pattern: `apps/web-next/src/routes/index/route.tsx` - Current connect route.
  - Pattern: `apps/web-next/src/features/connect/components/connect-screen.tsx` - Current connect screen component.
  - API/Type: `apps/web-next/src/features/connect/hooks/use-connection-flow.ts` - Connection logic to preserve.

  **Acceptance Criteria**:
  - [ ] Connect screen visually matches the LoL dark fantasy theme.
  - [ ] Code entry and auto-connect functionality remain intact.
  - [ ] Screen is usable on mobile (390x844) and desktop (1440x900).

  **QA Scenarios**:

  ```
  Scenario: Connect screen renders in new style
    Tool: Playwright
    Steps: Open `/`, take a screenshot.
    Expected: Background is dark navy, title uses display font, buttons are styled.
    Evidence: .sisyphus/evidence/task-2-1-connect.png
  ```

  **Commit**: YES | Message: `feat(ui): redesign connect screen` | Files: `apps/web-next/src/routes/index/route.tsx`, `apps/web-next/src/features/connect/components/connect-screen.tsx`

- [x] 2.2. Redesign Lobby Screen

  **What to do**: Transform the lobby screen (`/connected/lobby`) from a vertical stack of cards into a layout inspired by the LoL client's "Play" screen. Feature a top section for game mode selection (Grieta del Invocador, ARAM, Arena, TFT) presented as a grid of cards with icons and descriptions. Below that, show the active lobby details: queue status, members list with role preferences, and invite actions. Use the new primitives and layout.
  **Must NOT do**: Do NOT change the `useLobby` hook logic. Do NOT remove the `InviteOverlay`. Do NOT change the role selection flow.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Complex screen with many sub-components.
  - Skills: [`vercel-composition-patterns`] - Reason: The game mode selector and member list can benefit from compound component patterns.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: None | Blocked By: 1.3, 1.4, 1.5

  **References**:
  - Pattern: `apps/web-next/src/routes/connected/lobby/route.tsx` - Current lobby route.
  - Pattern: `apps/web-next/src/features/lobby/hooks/use-lobby.ts` - Lobby logic.
  - Pattern: `apps/web-next/src/features/lobby/components/lobby-member.tsx` - Member component.

  **Acceptance Criteria**:
  - [ ] Game mode selection is presented as a grid/cards at the top of the screen.
  - [ ] Queue controls use the new Button primitive.
  - [ ] Member list is visually restyled.
  - [ ] All lobby actions (join queue, leave queue, invite, kick, promote, change role) remain functional.

  **QA Scenarios**:

  ```
  Scenario: Lobby shows game mode grid
    Tool: Playwright
    Steps: Open `/connected/lobby` with a connected session, take a screenshot.
    Expected: Game modes are displayed in a styled grid at the top.
    Evidence: .sisyphus/evidence/task-2-2-lobby.png

  Scenario: Lobby actions still work
    Tool: Playwright
    Steps: Click "Find Match" (or equivalent), verify queue status changes.
    Expected: Queue status updates to "Searching".
    Evidence: .sisyphus/evidence/task-2-2-queue.mp4
  ```

  **Commit**: YES | Message: `feat(ui): redesign lobby with game mode selection grid` | Files: `apps/web-next/src/routes/connected/lobby/route.tsx`, `apps/web-next/src/features/lobby/components/*`

- [x] 2.3. Redesign Queue and Ready-Check Screens

  **What to do**: Redesign the queue (`/connected/queue`) and ready-check (`/connected/ready-check`) screens. The queue screen should show a prominent timer and a "Cancel" button with the new styling. The ready-check screen should feel urgent and important: large centered timer, clear "Accept" and "Decline" buttons styled as primary actions. Use glow effects for the active state.
  **Must NOT do**: Do NOT change the `useQueue` or `useReadyCheck` hooks. Do NOT alter the timer logic.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Focus on urgency and clarity.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: None | Blocked By: 1.3, 1.4, 1.5

  **References**:
  - Pattern: `apps/web-next/src/routes/connected/queue/route.tsx` - Current queue route.
  - Pattern: `apps/web-next/src/routes/connected/ready-check/route.tsx` - Current ready-check route.
  - API/Type: `apps/web-next/src/features/queue/use-queue.ts` - Queue logic.
  - API/Type: `apps/web-next/src/features/ready-check/hooks/use-ready-check.ts` - Ready-check logic.

  **Acceptance Criteria**:
  - [ ] Queue screen shows a styled timer and cancel button.
  - [ ] Ready-check screen has prominent Accept/Decline buttons.
  - [ ] Timer logic is visually represented (e.g., progress bar or pulsing glow).

  **QA Scenarios**:

  ```
  Scenario: Ready-check is visually urgent
    Tool: Playwright
    Steps: Open `/connected/ready-check`, take a screenshot.
    Expected: Large timer, glowing accept button, clear layout.
    Evidence: .sisyphus/evidence/task-2-3-ready-check.png
  ```

  **Commit**: YES | Message: `feat(ui): redesign queue and ready-check screens` | Files: `apps/web-next/src/routes/connected/queue/route.tsx`, `apps/web-next/src/routes/connected/ready-check/route.tsx`

- [x] 3.1. Redesign Champion Select Screen

  **What to do**: Redesign the champion select screen (`/connected/champ-select`) to match the LoL client's picker. The champion grid should have hover effects with gold borders and subtle glows. The selected champion's splash art should be prominently displayed. The action panel (Lock In / Ban) should use the new angular buttons. Skin picker, rune editor, and spell selector should be restyled into compact, visually cohesive panels. The team/enemy team member list (`ChampSelectMembers`) should show champion portraits with styling.
  **Must NOT do**: Do NOT change the `useChampSelect` hook logic. Do NOT alter the pick/ban/lock-in flow. Do NOT break ARAM bench functionality.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: The most complex visual screen.
  - Skills: [`vercel-react-best-practices`] - Reason: Champion grid can be heavy; ensure performance with `React.memo` and lazy loading for DDragon images.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: None | Blocked By: 1.3, 1.4, 1.5

  **References**:
  - Pattern: `apps/web-next/src/routes/connected/champ-select/route.tsx` - Current champ-select route.
  - Pattern: `apps/web-next/src/features/champ-select/hooks/use-champ-select.ts` - Core logic.
  - Pattern: `apps/web-next/src/features/champ-select/components/champion-picker.tsx` - Champion grid.
  - API/Type: `apps/web-next/src/core/http/ddragon-client.ts` - DDragon asset URLs.

  **Acceptance Criteria**:
  - [ ] Champion grid has gold hover borders and dark cells.
  - [ ] Lock In / Ban buttons use the new angular Button style.
  - [ ] Skin picker, rune editor, and spell selector are restyled.
  - [ ] DDragon images (champion portraits, skins, spells) load correctly with the new layout.
  - [ ] All champ-select actions (select, lock, ban, reroll, swap bench, change skin/spell/rune) remain functional.

  **QA Scenarios**:

  ```
  Scenario: Champion picker shows styled grid
    Tool: Playwright
    Steps: Open `/connected/champ-select`, take a screenshot of the champion grid.
    Expected: Grid cells are dark with gold borders on hover.
    Evidence: .sisyphus/evidence/task-3-1-picker.png

  Scenario: Lock-in action works
    Tool: Playwright
    Steps: Select a champion, click "Lock In".
    Expected: Champion is locked in, UI updates accordingly.
    Evidence: .sisyphus/evidence/task-3-1-lockin.mp4
  ```

  **Commit**: YES | Message: `feat(ui): redesign champion select screen` | Files: `apps/web-next/src/routes/connected/champ-select/route.tsx`, `apps/web-next/src/features/champ-select/components/*`

- [x] 3.2. Redesign Create-Lobby Screen

  **What to do**: Redesign the create-lobby screen (`/connected/create-lobby`) to match the new visual system. It should allow users to choose a game mode and configure lobby settings in a styled form using the new Input, Button, and Card primitives.
  **Must NOT do**: Do NOT change the lobby creation logic.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Form-based screen restyling.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: None | Blocked By: 1.3, 1.4, 1.5

  **References**:
  - Pattern: `apps/web-next/src/routes/connected/create-lobby/route.tsx` - Current route.

  **Acceptance Criteria**:
  - [ ] Screen uses the new design tokens and primitives.
  - [ ] Lobby creation functionality remains intact.

  **QA Scenarios**:

  ```
  Scenario: Create-lobby renders in new style
    Tool: Playwright
    Steps: Open `/connected/create-lobby`, take a screenshot.
    Expected: Styled form with dark inputs and gold-accented buttons.
    Evidence: .sisyphus/evidence/task-3-2-create-lobby.png
  ```

  **Commit**: YES | Message: `feat(ui): redesign create-lobby screen` | Files: `apps/web-next/src/routes/connected/create-lobby/route.tsx`

- [x] 3.3. Redesign Swiftplay Screen

  **What to do**: Redesign the swiftplay configuration screen (`/connected/swiftplay`). Present the configuration options (e.g., preferred roles, game mode settings) using the new styled form components.
  **Must NOT do**: Do NOT change the swiftplay configuration logic or store.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Form-based screen restyling.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: None | Blocked By: 1.3, 1.4, 1.5

  **References**:
  - Pattern: `apps/web-next/src/routes/connected/swiftplay/route.tsx` - Current route.
  - API/Type: `apps/web-next/src/features/swiftplay/swiftplay-store.ts` - Swiftplay store.

  **Acceptance Criteria**:
  - [ ] Screen uses the new design tokens and primitives.
  - [ ] Swiftplay configuration remains functional.

  **QA Scenarios**:

  ```
  Scenario: Swiftplay renders in new style
    Tool: Playwright
    Steps: Open `/connected/swiftplay`, take a screenshot.
    Expected: Styled configuration form.
    Evidence: .sisyphus/evidence/task-3-3-swiftplay.png
  ```

  **Commit**: YES | Message: `feat(ui): redesign swiftplay screen` | Files: `apps/web-next/src/routes/connected/swiftplay/route.tsx`

- [x] 3.4. Redesign Custom Game Screen

  **What to do**: Redesign the custom game setup screen (`/connected/custom`). Apply the new visual system to the custom game configuration UI.
  **Must NOT do**: Do NOT change custom game logic.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Form-based screen restyling.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: None | Blocked By: 1.3, 1.4, 1.5

  **References**:
  - Pattern: `apps/web-next/src/routes/connected/custom/route.tsx` - Current route.

  **Acceptance Criteria**:
  - [ ] Screen uses the new design tokens and primitives.
  - [ ] Custom game setup remains functional.

  **QA Scenarios**:

  ```
  Scenario: Custom game renders in new style
    Tool: Playwright
    Steps: Open `/connected/custom`, take a screenshot.
    Expected: Styled custom game setup UI.
    Evidence: .sisyphus/evidence/task-3-4-custom.png
  ```

  **Commit**: YES | Message: `feat(ui): redesign custom game screen` | Files: `apps/web-next/src/routes/connected/custom/route.tsx`

- [x] 3.5. Redesign Arena Screen

  **What to do**: Redesign the arena screen (`/connected/arena`). Apply the new visual theme. If the arena screen has a readiness/party view similar to the screenshot, style it with the new member cards and action buttons.
  **Must NOT do**: Do NOT change arena logic.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Screen restyling.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: None | Blocked By: 1.3, 1.4, 1.5

  **References**:
  - Pattern: `apps/web-next/src/routes/connected/arena/route.tsx` - Current route.

  **Acceptance Criteria**:
  - [ ] Screen uses the new design tokens and primitives.
  - [ ] Arena functionality remains intact.

  **QA Scenarios**:

  ```
  Scenario: Arena renders in new style
    Tool: Playwright
    Steps: Open `/connected/arena`, take a screenshot.
    Expected: Styled arena UI.
    Evidence: .sisyphus/evidence/task-3-5-arena.png
  ```

  **Commit**: YES | Message: `feat(ui): redesign arena screen` | Files: `apps/web-next/src/routes/connected/arena/route.tsx`

- [x] 3.6. Redesign Clash Screen

  **What to do**: Redesign the clash overview screen (`/connected/clash`). Apply the new visual theme.
  **Must NOT do**: Do NOT change clash logic.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Screen restyling.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: None | Blocked By: 1.3, 1.4, 1.5

  **References**:
  - Pattern: `apps/web-next/src/routes/connected/clash/route.tsx` - Current route.

  **Acceptance Criteria**:
  - [ ] Screen uses the new design tokens and primitives.
  - [ ] Clash functionality remains intact.

  **QA Scenarios**:

  ```
  Scenario: Clash renders in new style
    Tool: Playwright
    Steps: Open `/connected/clash`, take a screenshot.
    Expected: Styled clash UI.
    Evidence: .sisyphus/evidence/task-3-6-clash.png
  ```

  **Commit**: YES | Message: `feat(ui): redesign clash screen` | Files: `apps/web-next/src/routes/connected/clash/route.tsx`

- [x] 4.1. Implement Social Feature Stores and Layout

  **What to do**: Create the foundational state management and layout for the social feature. Create a Zustand store in `features/social/social-store.ts` to manage friend list data, groups, selected friend, and chat messages. Create the `SocialPanel` component that renders inside the AppShell sidebar (desktop) or inside a drawer/overlay (mobile). The panel should have tabs or sections for "Friends" and "Chat". Implement empty, loading, and offline states.
  **Must NOT do**: Do NOT integrate with LCU yet (mock data only for this task). Do NOT add persistence. Do NOT block other UI on social loading.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: State architecture for a new feature.
  - Skills: [`vercel-composition-patterns`] - Reason: Social panel can use compound components for tabs/friend list.

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: 4.2 | Blocked By: 1.3, 1.4, 1.5

  **References**:
  - Pattern: `apps/web-next/src/core/state/rift-store.ts` - Example Zustand store.
  - Pattern: `apps/web-next/src/features/lobby/lobby-store.ts` - Example feature store.
  - API/Type: `apps/web-next/src/core/rift/rift-client.ts` - Connection state to observe.

  **Acceptance Criteria**:
  - [ ] `social-store.ts` exists with state for friends, groups, selected friend, and messages.
  - [ ] `SocialPanel` component renders in the AppShell sidebar on desktop.
  - [ ] On mobile, `SocialPanel` is hidden behind a toggle/drawer.
  - [ ] Empty state, loading state, and offline state are implemented.

  **QA Scenarios**:

  ```
  Scenario: Social panel renders with mock data
    Tool: Playwright
    Steps: Open `/connected/lobby` with mock social data, take a screenshot.
    Expected: Friend list is visible in the sidebar (desktop) or behind a toggle (mobile).
    Evidence: .sisyphus/evidence/task-4-1-social-panel.png

  Scenario: Social panel handles empty state
    Tool: Playwright
    Steps: Render social panel with 0 friends.
    Expected: Empty state message is shown (e.g., "No friends online").
    Evidence: .sisyphus/evidence/task-4-1-empty.png
  ```

  **Commit**: YES | Message: `feat(social): add social stores and panel layout` | Files: `apps/web-next/src/features/social/social-store.ts`, `apps/web-next/src/features/social/components/SocialPanel.tsx`

- [x] 4.2. Implement Social Components (FriendList, Groups, Chat)

  **What to do**: Build the visual components for the social feature. `FriendList` should display friends grouped by their group/category (e.g., GENERAL, UWU), with expandable/collapsible sections. Each friend row should show their avatar (using the new Avatar primitive), summoner name, status (online/away/offline with color indicator), and an "Invite to Lobby" button. `ChatPanel` should display messages for the selected friend and a simple input to send messages. Use the new design tokens.
  **Must NOT do**: Do NOT integrate with LCU yet (use mock data and store actions). Do NOT implement persistence or history beyond the current session.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Pure UI component building.
  - Skills: [`vercel-composition-patterns`] - Reason: Friend list and chat can benefit from compound components.

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: 4.3 | Blocked By: 4.1

  **References**:
  - Pattern: `apps/web-next/src/features/lobby/components/lobby-member.tsx` - Member row component.
  - Pattern: `apps/web-next/src/components/ui/avatar.tsx` - Avatar primitive.
  - API/Type: `apps/web-next/src/features/social/social-store.ts` - Store created in task 4.1.

  **Acceptance Criteria**:
  - [ ] Friend list displays friends grouped by category with expand/collapse.
  - [ ] Friend rows show avatar, name, and status indicator (green/yellow/gray).
  - [ ] "Invite to Lobby" button is present and wired to a store action.
  - [ ] Chat panel shows messages and a send input.
  - [ ] Components are styled with the LoL design tokens.

  **QA Scenarios**:

  ```
  Scenario: Friend list shows groups and statuses
    Tool: Playwright
    Steps: Render SocialPanel with mock friends in groups.
    Expected: Groups are visible, friends have correct status colors.
    Evidence: .sisyphus/evidence/task-4-2-friends.png

  Scenario: Chat panel displays messages
    Tool: Playwright
    Steps: Select a friend, type a message, click send.
    Expected: Message appears in the chat panel.
    Evidence: .sisyphus/evidence/task-4-2-chat.mp4
  ```

  **Commit**: YES | Message: `feat(social): add friend list, groups, and chat components` | Files: `apps/web-next/src/features/social/components/FriendList.tsx`, `apps/web-next/src/features/social/components/ChatPanel.tsx`, `apps/web-next/src/features/social/components/FriendRow.tsx`

- [x] 4.3. Integrate Social Feature with LCU

  **What to do**: Wire the social store and components to real LCU data. Use React Query to fetch the friend list and presence status from LCU endpoints (investigate available endpoints in `@mimic/protocol-contract` or the LCU API). Implement sending invites to friends via the existing lobby invite mechanism. Implement sending/receiving chat messages via LCU chat endpoints (if available). Provide robust error handling and fallback states if LCU social data is unavailable.
  **Must NOT do**: Do NOT block the UI if social data fails to load. Do NOT expose sensitive session data. Do NOT implement full chat history/persistence.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Requires understanding LCU API and integration patterns.

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: None | Blocked By: 4.2

  **References**:
  - Pattern: `apps/web-next/src/core/lcu/lcu-queries.ts` - Existing LCU query patterns.
  - Pattern: `apps/web-next/src/core/lcu/lcu-mutations.ts` - Existing LCU mutation patterns.
  - API/Type: `packages/protocol-contract/src/lcu/lcu-paths.ts` - Available LCU endpoints.
  - API/Type: `packages/protocol-contract/src/lcu/lcu-types.ts` - LCU type definitions.

  **Acceptance Criteria**:
  - [ ] Friend list populates from LCU when connected.
  - [ ] Presence status updates (online/away/offline) reflect LCU state.
  - [ ] "Invite to Lobby" sends an invite through the LCU.
  - [ ] Chat can send/receive messages via LCU (if endpoints exist).
  - [ ] Graceful fallback when LCU is disconnected or social endpoints fail.

  **QA Scenarios**:

  ```
  Scenario: Friends load from LCU
    Tool: Playwright
    Steps: Connect to LCU, open social panel.
    Expected: Friend list populates with real data.
    Evidence: .sisyphus/evidence/task-4-3-lcu-friends.png

  Scenario: LCU disconnect shows fallback
    Tool: Playwright
    Steps: Disconnect LCU while social panel is open.
    Expected: Social panel shows offline/error state, does not crash.
    Evidence: .sisyphus/evidence/task-4-3-disconnect.png
  ```

  **Commit**: YES | Message: `feat(social): integrate friends and chat with LCU` | Files: `apps/web-next/src/features/social/*`, `apps/web-next/src/core/lcu/*`

- [x] 5.1. Add Animations and Visual Polish

  **What to do**: Add CSS transitions and animations to enhance the LoL feel. Implement hover effects with gold glows on interactive elements (buttons, cards, champion grid cells). Add a subtle entrance animation for drawers/modals. Use `transition` and `animate` utilities from Tailwind. Ensure `prefers-reduced-motion` is respected. Avoid heavy JS animation libraries unless strictly necessary.
  **Must NOT do**: Do NOT add Framer Motion or similar libraries without explicit justification. Do NOT animate layout properties that cause reflow (width, height). Do NOT ignore `prefers-reduced-motion`.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Animation and micro-interactions.

  **Parallelization**: Can Parallel: YES | Wave 5 | Blocks: None | Blocked By: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.3

  **References**:
  - Pattern: `apps/web-next/src/styles/design-tokens.css` - Use glow/border tokens.
  - External: `https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion` - Reduced motion guidelines.

  **Acceptance Criteria**:
  - [ ] Buttons and cards have subtle hover glow effects.
  - [ ] Champion grid cells have a gold border transition on hover.
  - [ ] Drawers/modals have a fade/slide entrance animation.
  - [ ] Animations are disabled when `prefers-reduced-motion: reduce` is active.

  **QA Scenarios**:

  ```
  Scenario: Hover effects are visible
    Tool: Playwright
    Steps: Hover over a button and a champion cell, take screenshots.
    Expected: Visual change (glow/border) is visible.
    Evidence: .sisyphus/evidence/task-5-1-hover.png

  Scenario: Reduced motion disables animations
    Tool: Playwright
    Steps: Emulate `prefers-reduced-motion: reduce`, open a drawer.
    Expected: Drawer appears instantly without animation.
    Evidence: .sisyphus/evidence/task-5-1-reduced-motion.png
  ```

  **Commit**: YES | Message: `feat(ui): add animations and visual polish` | Files: `apps/web-next/src/styles/animations.css`, `apps/web-next/src/components/ui/*`

- [x] 5.2. Accessibility Audit and Fixes

  **What to do**: Run automated accessibility checks using axe-core (via Playwright or a CLI tool) on the primary screens: connect, lobby, champ-select, and social panel. Fix contrast issues (especially gold text on dark backgrounds), ensure focus states are visible, verify keyboard navigation works for all interactive elements (buttons, inputs, drawer toggles, friend list), and add proper ARIA labels where missing.
  **Must NOT do**: Do NOT degrade the visual design to pass accessibility; find a balance (e.g., lighter gold for text if needed). Do NOT skip focus management on mobile drawers.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Requires methodical testing and fixing.
  - Skills: [`web-design-guidelines`] - Reason: Accessibility compliance.

  **Parallelization**: Can Parallel: YES | Wave 5 | Blocks: None | Blocked By: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.3

  **References**:
  - External: `https://www.deque.com/axe/` - axe-core documentation.
  - Pattern: `apps/web-next/src/components/ui/button.tsx` - Add focus-visible styles.

  **Acceptance Criteria**:
  - [ ] axe-core checks pass with 0 violations on connect, lobby, champ-select, and social screens.
  - [ ] All interactive elements are reachable via keyboard (`Tab`, `Enter`, `Space`).
  - [ ] Focus indicators are visible on all focusable elements.
  - [ ] ARIA labels are present on icon-only buttons and complex components.

  **QA Scenarios**:

  ```
  Scenario: axe checks pass on lobby
    Tool: Bash
    Steps: Run axe-core audit on `/connected/lobby`.
    Expected: Zero critical or serious violations.
    Evidence: .sisyphus/evidence/task-5-2-axe-lobby.json

  Scenario: Keyboard navigation works
    Tool: Playwright
    Steps: Tab through the lobby screen, verify focus reaches all buttons and inputs.
    Expected: Focus moves sequentially and indicators are visible.
    Evidence: .sisyphus/evidence/task-5-2-keyboard.mp4
  ```

  **Commit**: YES | Message: `feat(a11y): audit and fix accessibility issues` | Files: `apps/web-next/src/components/ui/*`, `apps/web-next/src/features/*/components/*`

- [x] 5.3. Responsive Refinements

  **What to do**: Test the entire app at the target viewports (390x844 mobile, 768x1024 tablet, 1440x900 desktop) and fix any layout issues. Ensure the social panel drawer works smoothly on mobile, the champion grid is usable on small screens, the lobby game mode grid doesn't overflow, and text doesn't clip at any size. Refine Tailwind breakpoint usage.
  **Must NOT do**: Do NOT create separate mobile/desktop components unless absolutely necessary. Do NOT hide critical actions behind drawers on mobile.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: CSS/layout tweaking.

  **Parallelization**: Can Parallel: YES | Wave 5 | Blocks: None | Blocked By: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.3

  **References**:
  - Pattern: `apps/web-next/src/components/layout/AppShell.tsx` - Layout container.
  - Pattern: `apps/web-next/src/routes/connected/champ-select/route.tsx` - Complex responsive grid.

  **Acceptance Criteria**:
  - [ ] No horizontal scroll at 390x844 on any main screen.
  - [ ] All buttons and interactive elements are tappable (min 44x44px) on mobile.
  - [ ] Social panel drawer opens/closes smoothly on mobile.
  - [ ] Desktop layout uses space efficiently without excessive whitespace.

  **QA Scenarios**:

  ```
  Scenario: Mobile viewport has no horizontal scroll
    Tool: Playwright
    Steps: Open each redesigned route at 390x844, check `window.scrollX` and overflow.
    Expected: `scrollX` is 0, no `overflow-x: scroll` on main containers.
    Evidence: .sisyphus/evidence/task-5-3-responsive.txt
  ```

  **Commit**: YES | Message: `feat(ui): responsive refinements across all viewports` | Files: `apps/web-next/src/components/layout/*`, `apps/web-next/src/routes/**/*`

- [x] 5.4. Asset Optimization and Bundle Review

  **What to do**: Review the bundle for performance issues. Ensure DDragon images (champion portraits, skins, spells, runes) are lazy-loaded where possible. Check if any new font files are excessively large and consider subsetting. Review the build output size and ensure no major regressions were introduced by the redesign. If dynamic imports would significantly help (e.g., for the heavy champ-select components), implement them.
  **Must NOT do**: Do NOT add dynamic imports unless profiling shows a clear benefit. Do NOT remove preloading of critical assets.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Performance analysis.
  - Skills: [`vercel-react-best-practices`] - Reason: Bundle optimization guidelines.

  **Parallelization**: Can Parallel: YES | Wave 5 | Blocks: None | Blocked By: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.3

  **References**:
  - Pattern: `apps/web-next/vite.config.ts` - Build configuration.
  - Pattern: `apps/web-next/src/core/http/ddragon-client.ts` - Asset fetching.

  **Acceptance Criteria**:
  - [ ] DDragon images in champion grid and champ-select use `loading="lazy"` or equivalent.
  - [ ] Build output size is within 20% of pre-redesign size (or justified if larger).
  - [ ] No new heavy runtime dependencies were added without justification.

  **QA Scenarios**:

  ```
  Scenario: Images have lazy loading attribute
    Tool: Bash
    Steps: grep -r 'loading="lazy"' apps/web-next/src/features/champ-select/components/ | wc -l
    Expected: Output is >= 1
    Evidence: .sisyphus/evidence/task-5-4-lazyload.txt

  Scenario: IntersectionObserver used for lazy loading
    Tool: Bash
    Steps: grep -r "IntersectionObserver" apps/web-next/src/features/champ-select/components/ | wc -l
    Expected: Output is >= 1
    Evidence: .sisyphus/evidence/task-5-4-intersection.txt
  ```

  **Commit**: YES | Message: `perf(ui): optimize assets and review bundle` | Files: `apps/web-next/src/features/champ-select/components/*`, `apps/web-next/vite.config.ts`

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [x] F1. Plan Compliance Audit — oracle
- [x] F2. Code Quality Review — unspecified-high
- [x] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [x] F4. Scope Fidelity Check — deep

## Commit Strategy

- Commit per wave (or per task if task is large and isolated)
- Wave 1: `feat(ui): establish LoL-inspired design system and responsive shell`
- Wave 2: `feat(ui): redesign connect, lobby, queue, and ready-check flows`
- Wave 3: `feat(ui): redesign champ-select and game setup flows`
- Wave 4: `feat(social): add friends list, groups, and basic chat`
- Wave 5: `feat(ui): animations, accessibility, responsive polish, and asset optimization`
- Final verification fixes: `fix(ui): address review feedback from verification wave`

## Success Criteria

1. Build passes: `cd apps/web-next && bun run build` exits 0
2. Typecheck passes: `cd apps/web-next && bun run typecheck` exits 0
3. All redesigned routes render without runtime errors
4. Responsive layout works at mobile (390x844), tablet (768x1024), and desktop (1440x900)
5. Social panel is persistent on desktop, hidden behind drawer on mobile
6. Friend states display correctly (online/away/offline) with color indicators
7. Basic chat can read/send messages when LCU is connected
8. All existing game flows (queue join/leave, champ select pick/ban/lock-in, invites) remain functional
9. Accessibility: axe checks pass, keyboard navigation works, focus states visible, reduced motion respected
10. No regressions in legacy code (`web/`, `rift/`, `src-old/` untouched)
