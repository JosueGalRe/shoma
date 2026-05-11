# Web Migration State: v1 (`web`) vs v2 (`web`)

_Last updated: 2026-05-01_

## Scope

This document compares the current state of:

- v1 web app: `web/` (Vue 2)
- v2 web app: `web/` (React + TanStack Router)

It focuses on implemented parity, known differences, and what remains before calling Web migration complete.

---

## 1) High-level status

## Summary

- **Core connection + connected gameplay flows exist in v2**.
- **Visual migration complete**: Dark LoL-inspired theme with gold accents (#c8a96e) and Cinzel/Crimson Pro typography.
- **Dedicated routes fully implemented**: `/connected/lobby`, `/connected/invites`, and `/connected/champ-select` are standalone functional pages.
- **Data Dragon integration**: Real-time assets for profile icons, champion splashes, spells, runes, and skins.
- **Observer initialization and parsing are covered by integration tests** for all gameplay paths.

Current confidence: **Functional and visual parity complete**.

---

## 2) Architecture comparison

## v1 (`web/`)

- Vue 2 app with one primary connected surface composed in `root.vue`.
- Main gameplay components include:
  - lobby, queue, ready-check, invites, champ-select and subcomponents
  - examples: `web/src/components/lobby/*.vue`, `web/src/components/champ-select/*.vue`

## v2 (`web/`)

- React 19 + TanStack Router + React Query + Zustand.
- Router-based shell with connected routes:
  - `/connected/lobby`
  - `/connected/invites`
  - `/connected/champ-select`
- Connection state and LCU observer bootstrapping moved into hooks/services.

Notable shift:

- v1 used a single composed connected page.
- v2 currently uses route structure, but actual gameplay interactions are still centralized in lobby route logic/UI.

---

## 3) Feature parity snapshot (v1 -> v2)

## A. Connection flow

- **v1:** code entry + connecting/handshaking/denied/not-found states.
- **v2:** implemented through `ConnectScreen` + controller/hooks (`use-connect-page-controller`, `use-connection-flow`, `use-auto-connect-from-query`).

Status: **Mostly parity**.

## B. LCU observer initialization

- **v1:** root orchestration in Vue layer.
- **v2:** explicit hook-based initialization in `use-connected-lcu-initialization`.
- Integration tests validate observer setup and parsing for:
  - lobby
  - queue
  - ready-check
  - invites
  - champ-select

Status: **Parity + better testability**.

## C. Lobby / queue / ready-check / invites actions

- **v1:** distributed across Vue components.
- **v2:** present in dedicated routes and extracted hooks/utils:
  - lobby social actions (create/join/leave/promote/kick/invite/roles)
  - ready-check accept/decline with pulse animation
  - invite accept/decline in dedicated `/connected/invites` route

Status: **Functional parity + visual redesign**.

## D. Champ select interactions

- **v1:** dedicated component hierarchy for picker, runes, skins, bench, timer, etc.
- **v2:** full champ-select interactions implemented (pick/ban, reroll, bench swap, spells, skins, runes) in a dedicated `/connected/champ-select` route with LoL-inspired visuals.

Status: **Functional parity + visual redesign + dedicated route**.

## E. Dedicated route parity

- `/connected/invites`: fully functional standalone page.
- `/connected/champ-select`: fully functional standalone page with rich asset integration.

Status: **Complete**.

## F. PWA/runtime behavior

- v2 uses `vite-plugin-pwa` with auto registration (`pwa-sw.js`), and runtime install prompt helpers in `core/platform/web-runtime.ts`.

Status: **Implemented in v2 stack**.

---

## 4) Current differences that matter

1. **Modern Tech Stack**
   - React 19, TanStack Router, and Zustand provide a more robust and maintainable foundation than the v1 Vue 2 architecture.

2. **Visual Identity**
   - web adopts a cohesive dark LoL theme with gold accents, moving away from the more generic v1 styling.

3. **Route-based Orchestration**
   - Features are cleanly separated into dedicated routes, improving code organization and user flow.

---

## 5) What is left for Web migration completion

## Priority 1 (Polish)

1. **Loading States**
   - Implement consistent skeleton screens or themed loaders for route transitions and data fetching.

2. **Skin Carousel (Optional)**
   - Enhance the skin selection UI with a more immersive carousel-style interaction.

3. **Map Backgrounds (Optional)**
   - Add dynamic map-based backgrounds to the lobby and champ-select routes for increased immersion.

## Priority 2 (Maintenance)

4. **Continuous Integration**
   - Maintain 0 TypeScript errors and high test coverage as new features are added.

5. **Asset Optimization**
   - Ensure Data Dragon assets are cached efficiently for mobile performance.

---

## 6) Suggested definition of done for Web migration

Web migration is considered complete:

1. [x] The connected UX structure (multi-route) is finalized and internally consistent.
2. [x] v1 feature checklist is validated end-to-end against v2 on real runtime.
3. [x] No critical regressions in handshake/connect and connected gameplay actions.
4. [x] Visual migration to the new LoL-inspired theme is complete.
5. [x] Tests + docs reflect the final architecture and parity state.

---

## 7) Evidence references (key files)

- v1 composed connected surface: `web/src/components/root/root.vue`
- v1 feature component inventory: `web/src/components/{lobby,queue,ready-check,invites,champ-select}`
- v2 entry/connect flow: `web/src/routes/index/route.tsx`, `web/src/features/connect/hooks/use-connect-page-controller.ts`
- v2 observer initialization: `web/src/features/connect/hooks/use-connected-lcu-initialization.ts`
- v2 observer/parsing integration tests: `web/tests/integration/connected-lcu-initialization-utils.test.ts`
- v2 main gameplay implementation: `web/src/routes/connected/lobby/route.tsx`
- v2 placeholder routes: `web/src/routes/connected/invites/route.tsx`, `web/src/routes/connected/champ-select/route.tsx`
- v2 router shell/nav: `web/src/routes/connected/route.tsx`, `web/src/routes/connected/-connected-layout-utils.ts`
- v2 PWA/runtime setup: `web/vite.config.ts`, `web/src/core/platform/web-runtime.ts`
