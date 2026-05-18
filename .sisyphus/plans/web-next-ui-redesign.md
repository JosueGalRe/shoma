# Plan: Redesign Premium Pass — web-next

## TL;DR

> **Summary**: Ajuste del redesign completo tras auditoría Momus. Gran parte del design system ya existe (tokens League, componentes estilizados, animaciones, connect screen rediseñada). Este plan se enfoca en los gaps reales: Champ Select performance/UX, layout system (safe areas, landscape), polish de pantallas existentes, y testing infra.
> **Deliverables**: Champ Select rediseñado (grid virtualizado, filtros, lazy loading), Layout system (AppShell, safe areas, landscape warning), Connect/Lobby/Invites polish, Performance audit, Testing infra (Playwright)
> **Effort**: Medium-Large (~4-5 semanas de trabajo agente)
> **Parallel**: YES — 3 waves (Foundation + Champ Select → Polish → Verification)
> **Critical Path**: T1 (Audit) + T2 (Layout) → T3 (Champ Select) → T4-T6 (Polish) → T7 (Performance) → F1-F4

## Context

### Original Request

Usuario quiere mejorar significativamente la interfaz de web-next usando Lazyweb MCP para investigación de diseño. Redesign completo, paralelo, basado en evidencia.

### Stack Actual

- React 19 + TanStack Router (file-based)
- Tailwind CSS v4 + `tw-animate-css`
- shadcn/ui (Button, Card, Input, Alert, Spinner, DropdownMenu, Skeleton)
- react-i18next con typed keys
- Bun para tests (solo integration tests, no RTL)

### Estado Actual Post-Momus Audit

**YA IMPLEMENTADO (no recrear):**

- ✅ `styles.css`: Tokens League (gold #c8a96e, teal #0ac8b9, hextech), fonts (Cinzel, Crimson Pro), utilities (`league-card`, `league-card-hover`, `text-gold`, `border-gold`)
- ✅ `Button.tsx`: 7 variants con gradientes, sombras, active states (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `hextech`)
- ✅ `Card.tsx`: League styling integrado (gradient border, hover glow, pseudo-element)
- ✅ Animaciones CSS: `page-enter`, `page-exit`, `queue-active`, `ready-check-enter`, `ready-check-glow`, `pulse-gold`
- ✅ Connected layout: Background animado con gradientes radiales + pattern SVG, header MIMIC con logo, nav tabs
- ✅ Connect screen: Shell con glow background, input estilizado, estados de conexión, language switcher
- ✅ Lobby: Cards funcionales (Queue, ReadyCheck, Members, Roles) con styling básico

**GAPS REALES (trabajo pendiente):**

- ❌ **Champ Select**: Grid renderiza TODOS los campeones sin virtualización, sin lazy loading de imágenes, sin filtros por rol, sin tabs (Champions/Spells/Runes/Skins), sin búsqueda. Es el gap más crítico.
- ❌ **Layout system**: No hay `AppShell`, safe areas (`env(safe-area-inset-*)`), ni warning de landscape.
- ❌ **Connect polish**: Funcional pero le falta el "wow" — input podría ser OTP segmentado, estados de conexión más inmersivos.
- ❌ **Lobby polish**: Cards funcionan pero el layout es grid básico de 2 cols, sin dashboard feel.
- ❌ **Invites**: Ruta existe pero sin share sheet ni avatars prominente.
- ❌ **Testing**: Solo Bun integration tests. Falta Playwright para visual QA.
- ❌ **Performance**: Sin lazy loading en imágenes Data Dragon.

### Investigación Lazyweb (Resumen)

**Connect/Paring**: Couple Joy (código grande + countdown), Peek (OTP segmentado). Patrón: código como héroe visual.

**Lobby/Dashboard**: DraftKings (cards + tabs + banners), Royal Match (currencies + badges). Patrón: cards con fondos, CTAs grandes, progreso visual.

**Champ Select**: SmartDreams (grid cards arte), Tapotron (facción grid). Patrón: grid con arte prominente, selección visual, filtros.

**Loading**: WeTransfer (minimal spinner), Weight Watchers (splash + %). Patrón: minimal dark, branding.

### Metis + Momus Review (Guardrails)

- Virtualización obligatoria para grids >50 items (Champ Select = ~160 campeones)
- Animaciones solo CSS/Tailwind — no Framer Motion
- Frontend = terminal tonto — no lógica de negocio
- shadcn/ui como base — desviaciones justificadas
- No replicar chat/amigos del LCU
- No editor de runas completo
- **No agregar dependency de virtualization** — usar CSS grid + intersection observer o decidir si agregar `@tanstack/react-virtual`
- **No "resource counters ficticios"** — evita scope creep

## Work Objectives

### Core Objective

Transformar los gaps identificados (especialmente Champ Select) en una experiencia visual pulida que aproveche el design system ya existente, sin duplicar trabajo.

### Deliverables

1. **Champ Select rediseñado** — Grid virtualizado/lazy, filtros por rol, búsqueda, tabs, estados pick/ban visuales
2. **Layout system** — AppShell, safe areas, landscape warning
3. **Connect polish** — OTP segmentado opcional, estados de conexión más inmersivos
4. **Lobby polish** — Dashboard feel, cards con fondos de mapa, header mejorado
5. **Invites polish** — Avatars Data Dragon, share sheet básico
6. **Testing infra** — Playwright para visual QA
7. **Performance audit** — Lazy loading, Lighthouse ≥ 80

### Definition of Done

- [ ] Champ Select renderiza grid con lazy loading, filtros funcionan, búsqueda filtra
- [ ] Layout soporta safe areas y muestra warning en landscape
- [ ] `bun run --filter @mimic/web-next test` pasa
- [ ] `bun run --filter @mimic/web-next build` compila
- [ ] Lighthouse mobile score ≥ 80
- [ ] Playwright screenshots de todas las pantallas sin regresiones

### Must Have

- Champ Select: grid con splash art Data Dragon, filtros por rol (Top/Jungle/Mid/ADC/Support), búsqueda, lazy loading, tabs (Champions/Spells/Runes/Skins), estados pick/ban/bench visuales
- Layout: AppShell reutilizable, safe-area-inset, landscape warning
- Connect: OTP segmentado o input mejorado, estados animados (connecting/handshaking/connected/error)
- Lobby: QueueCard con fondo de mapa, ReadyCheckCard con urgency visual, MembersCard con avatars Data Dragon
- Invites: avatars circulares, share sheet básico (copy link + Web Share API)
- Testing: Playwright configurado para screenshots por pantalla

### Must NOT Have (Guardrails)

- No Framer Motion (solo CSS/Tailwind animations)
- No editor de runas completo (solo selección)
- No chat/amigos del LCU replicados
- No Chromas/variantes de skins
- No landscape orientation soportado (solo portrait)
- No notificaciones push nativas
- No cambios en lógica de negocio
- No resource counters ficticios
- No breaking changes en API de Rift/LCU

## Verification Strategy

- **Test decision**: Tests-after (Bun integration + Playwright visual)
- **QA policy**: Cada pantalla tiene Playwright screenshot + interaction test
- **Evidence**: `.sisyphus/evidence/web-next-redesign/`

## Execution Strategy

### Parallel Execution Waves

**Wave 1: Foundation + Champ Select** (Tasks 1-3)

- T1: Foundation audit (extender tokens/utilities faltantes)
- T2: Layout system (AppShell, safe areas, landscape)
- T3: Champ Select rediseño completo (grid, filtros, lazy loading, tabs)

**Wave 2: Polish de Pantallas** (Tasks 4-6)

- T4: Connect polish
- T5: Lobby polish
- T6: Invites polish + Testing infra

**Wave 3: Performance + Verification** (Tasks 7 + F1-F4)

- T7: Performance audit
- F1-F4: Final Verification

### Dependency Matrix

| Task             | Blocks | Blocked By |
| ---------------- | ------ | ---------- |
| T1 Audit         | T2-T6  | -          |
| T2 Layout        | T4-T6  | T1         |
| T3 ChampSelect   | T7     | T1,T2      |
| T4 Connect       | T7     | T1,T2      |
| T5 Lobby         | T7     | T1,T2      |
| T6 Invites+Tests | T7     | T1,T2      |
| T7 Performance   | F1-F4  | T3-T6      |

### Agent Dispatch Summary

- Wave 1: 3 tasks → visual-engineering category
- Wave 2: 3 tasks → visual-engineering category (paralelo)
- Wave 3: 1 task + 4 verificaciones → unspecified-high + oracle + deep

## TODOs

- [x] 1. Foundation Audit — Extender Design Tokens y Utilities

  **What to do**: Auditar `styles.css` y componentes existentes para identificar gaps. Extender tokens/utilities faltantes (NO recrear lo existente). Trabajo específico:
  - Verificar que todos los tokens usados en nuevos diseños existen; crear los faltantes
  - Agregar utilities faltantes: `safe-area-padding`, `landscape-warning`, `otp-input`, `avatar-ring-{status}`, `map-bg-overlay`
  - Extender animaciones si faltan: `shake` (error), `connection-wave` (ondas concéntricas), `countdown-pulse` (timer urgente)
  - Verificar que `Button` y `Card` cubren necesidades; documentar decision de NO crear `GameButton`/`GameCard` separados
  - **Extender `ddragon-client.ts`**: Actualmente solo expone `ChampionNamesById: Record<number, string>`. Para Champ Select filters, extender a `ChampionMetadata` que incluya `{ id: number, key: string, name: string, tags: string[] }`. Data Dragon tags son `['Fighter', 'Tank', 'Mage', 'Assassin', 'Support', 'Marksman']` — estos se mapearán a lane roles vía static map o se mostrarán como filtros de clase.
    **Must NOT do**: No duplicar tokens existentes, no recrear Button/Card desde cero, no eliminar utilities existentes.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: Design system audit
  - Skills: [`frontend-ui-ux`] — Reason: Token architecture
  - Omitted: [`playwright`] — Reason: Not needed yet

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T2-T6 | Blocked By: -

  **References**:
  - File: `apps/web-next/src/styles.css` — audit and extend
  - File: `apps/web-next/src/components/ui/button.tsx` — verify coverage
  - File: `apps/web-next/src/components/ui/card.tsx` — verify coverage
  - File: `apps/web-next/src/core/http/ddragon-client.ts` — extend to expose tags
  - Lazyweb ref: DraftKings cards, Royal Match currencies

  **Acceptance Criteria**:
  - [ ] Audit documenta qué existe vs qué falta (evidence file, NO comentarios en CSS)
  - [ ] `ddragon-client.ts` expone `ChampionMetadata` con `id, key, name, tags`
  - [ ] Nuevos tokens compilados sin errores de Tailwind
  - [ ] `shake` animation funciona (3 oscilaciones)
  - [ ] `connection-wave` animation creada (ondas concéntricas)
  - [ ] `safe-area-padding` utility usa `env(safe-area-inset-*)`
  - [ ] Build pasa: `bun run --filter @mimic/web-next build`

  **QA Scenarios**:

  ```
  Scenario: Foundation audit
    Tool: Bash
    Steps: cd apps/web-next && bun run build
    Expected: Build succeeds, no CSS errors, no duplicated utilities
    Evidence: .sisyphus/evidence/web-next-redesign/t1-audit.md
  ```

  **Commit**: YES | Message: `design(web-next): audit and extend missing tokens/utilities` | Files: `apps/web-next/src/styles.css`, `apps/web-next/src/core/http/ddragon-client.ts`

- [x] 2. Layout System — AppShell, Safe Areas, Landscape Warning

  **What to do**: Crear layout system mobile-first que todas las pantallas puedan usar. Componentes:
  - `AppShell` (en `src/components/layout/`): envuelve contenido con safe areas, opcionalmente header/footer. Props: `header`, `footer`, `children`, `className`.
  - `SafeArea` wrapper: aplica `padding-top: env(safe-area-inset-top)`, `padding-bottom: env(safe-area-inset-bottom)`
  - `LandscapeWarning` component: detecta orientación landscape (via `window.matchMedia('(orientation: landscape)')`), muestra overlay con mensaje "Rotate your device" + icono. Solo visible en mobile landscape (< 768px width).
  - Integrar `AppShell` en `connected/route.tsx` (layout existente) y `index/route.tsx` (connect). No modificar `__root/route.tsx` (layout mínimo).
    **Must NOT do**: No cambiar estructura de rutas de TanStack Router, no agregar librerías de layout.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: Layout architecture
  - Skills: [`frontend-ui-ux`] — Reason: Responsive patterns
  - Omitted: [`playwright`] — Reason: Not yet

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T4-T6 | Blocked By: T1

  **References**:
  - File: `apps/web-next/src/routes/connected/route.tsx` — integrate AppShell here
  - File: `apps/web-next/src/routes/index/route.tsx` — integrate AppShell here
  - File: `apps/web-next/src/core/platform/web-runtime.ts` — check existing notch detection
  - Pattern: CSS `env(safe-area-inset-*)`, `matchMedia('(orientation: landscape)')`

  **Acceptance Criteria**:
  - [ ] `AppShell` renderiza con header, scrollable content, footer opcional
  - [ ] Safe areas aplicadas en top/bottom (testear en iPhone sim o DevTools)
  - [ ] Landscape warning aparece en mobile landscape (< 768px)
  - [ ] Portrait funciona normalmente, sin warning
  - [ ] Layout no causa horizontal scroll en ningún breakpoint

  **QA Scenarios**:

  ```
  Scenario: Safe areas
    Tool: Playwright
    Steps: Emulate iPhone 14 Pro (393x852), check padding-top/bottom
    Expected: Content not hidden by notch/home indicator
    Evidence: .sisyphus/evidence/web-next-redesign/t2-safearea.png

  Scenario: Landscape warning
    Tool: Playwright
    Steps: Emulate iPhone in landscape (852x393)
    Expected: Overlay with "Rotate your device" visible, content blocked
    Evidence: .sisyphus/evidence/web-next-redesign/t2-landscape.png
  ```

  **Commit**: YES | Message: `feat(web-next): add AppShell, safe areas, and landscape warning` | Files: `apps/web-next/src/components/layout/**`, `apps/web-next/src/routes/connected/route.tsx`, `apps/web-next/src/routes/index/route.tsx`

- [x] 3. Champ Select Redesign — Grid, Filtros, Lazy Loading, Tabs

  **What to do**: Rediseñar completamente `/connected/champ-select`. Este es el gap más crítico. Trabajo detallado:
  - **Tabs**: Crear tabs en la parte superior (Champions, Spells, Runes, Skins) — estilo navegación del connected layout pero más prominente. Usar `buttonVariants` o componente custom.
  - **Champions tab**: Grid de campeones con splash art de Data Dragon. Cada card muestra: splash art, nombre, indicador de estado (border color: verde=pick disponible, rojo=ban, gris=unavailable/bench, gold=selected). Lazy loading OBLIGATORIO para todas las imágenes (`loading="lazy"` + `decoding="async"`). Intersection Observer para cargar imágenes solo cuando entran en viewport.
  - **Virtualización**: Usar **CSS grid + native lazy images (`loading="lazy"` + `decoding="async"`) + IntersectionObserver** primero. NO agregar `@tanstack/react-virtual` ni otra dependency de virtualization a menos que post-implementación el scroll no mantenga 60fps en throttled CPU. Documentar decisión en evidence.
  - **Data Dragon URLs CRÍTICO**: `buildChampionSplashUrl` actual usa `championName` (nombre localizado) pero Data Dragon splash URLs requieren el **slug** (`id` field, ej. `MonkeyKing`, `MissFortune`, `DrMundo`). El `ddragon-client.ts` extendido en T1 debe exponer `key` (slug) además de `name`. Actualizar `buildChampionSplashUrl` y `buildChampionIconUrl` para usar `key` en lugar de `name`.
  - **Filtros**: Chips horizontales scrollables por **Data Dragon tags** (`Fighter`, `Tank`, `Mage`, `Assassin`, `Support`, `Marksman`) mapeados a labels amigables. Opcionalmente agregar static lane-role map (`Top/Jungle/Mid/ADC/Support`) si se prefiere UX por lane. Filtro por nombre (search bar prominente).
  - **Estados visuales**: Pick (border verde + glow), Ban (border rojo + grayscale overlay), Bench (border gris), Selected (border gold + checkmark overlay), Unavailable (opacity 50%).
  - **Spells tab**: Grid de hechizos con iconos Data Dragon, selección de 2 slots visual.
  - **Runes tab**: Lista de páginas predefinidas como cards simples (NO editor completo).
  - **Skins tab**: Grid de skins para campeón actual con splash art y owned indicator.
  - Reference: SmartDreams (grid), Tapotron (facción selection), WebNovel (character cards).
    **Must NOT do**: No cambiar lógica de champ select (hooks, LCU calls), no agregar editor de runas, no cargar todas las imágenes de una vez, no agregar virtualización sin justificar la decisión.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: Complex screen, highest priority
  - Skills: [`frontend-ui-ux`, `playwright`] — Reason: Visual + performance QA
  - Omitted: [] — Reason: Full UI work

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: T7 | Blocked By: T1,T2

  **References**:
  - Files: `apps/web-next/src/routes/connected/champ-select/route.tsx`, `-components/*`
  - File: `apps/web-next/src/routes/connected/lobby/-components/ChampSelectCard.tsx` — existing grid (to redesign)
  - Lazyweb: SmartDreams (grid), Tapotron (selection), WebNovel (cards)
  - External: Data Dragon `https://ddragon.leagueoflegends.com/` — splash arts, icons
  - Components: Existing `Card`, `Button` (no crear GameCard/GameButton)

  **Acceptance Criteria**:
  - [ ] Tabs (Champions/Spells/Runes/Skins) navegables y visibles
  - [ ] Grid de campeones renderiza con splash art de Data Dragon (URLs usan slug `key`, no nombre localizado)
  - [ ] Lazy loading: solo imágenes en/near viewport se cargan (verificar en Network tab)
  - [ ] Filtros por rol funcionan (chips horizontales scrollables)
  - [ ] Búsqueda filtra campeones en tiempo real (≤100ms debounce)
  - [ ] Estados pick/ban/bench/selected visuales en cards (border colors + overlays)
  - [ ] Scroll del grid mantiene 60fps (Chrome DevTools Performance)
  - [ ] Responsive: 3-4 cols mobile, 6-8 tablet+

  **QA Scenarios**:

  ```
  Scenario: Champ grid performance
    Tool: Playwright + DevTools
    Steps: Open champ select, scroll grid, measure memory and network requests
    Expected: Images load lazily (not all 160+ at once), scroll 60fps, no memory leaks
    Evidence: .sisyphus/evidence/web-next-redesign/t3-champ-perf.json

  Scenario: Filter interaction
    Tool: Playwright
    Steps: Click "Support" filter, type "Thresh" in search
    Expected: Grid filters to Support champions, search narrows to Thresh
    Evidence: .sisyphus/evidence/web-next-redesign/t3-filter.png

  Scenario: Tab navigation
    Tool: Playwright
    Steps: Click "Spells" tab, then "Runes", then "Skins"
    Expected: Content changes without page reload, active tab highlighted
    Evidence: .sisyphus/evidence/web-next-redesign/t3-tabs.png
  ```

  **Commit**: YES | Message: `feat(web-next): redesign champ select with lazy grid, role filters, and tabs` | Files: `apps/web-next/src/routes/connected/champ-select/**`

- [x] 4. Connect Screen Polish

  **What to do**: Refinar la pantalla `/` existente sin reescribir desde cero. Trabajo:
  - **OTP segmentado**: Evaluar si el input actual (input grande centrado) se reemplaza por OTP segmentado de 6 cajas (estilo Peek/Revolut). Si se implementa: cada caja es un input individual, navegación con flechas/backspace, paste distribuye en cajas, auto-focus siguiente caja. Si NO se implementa: mejorar el input existente (más grande, mejor focus ring, placeholder animado).
  - **Estados inmersivos**: Mejorar animaciones de estados de conexión. "connecting": ondas concéntricas CSS alrededor del input (usar `connection-wave` utility). "handshaking": icono de candado con glow teal. "connected": checkmark animado (scale + opacity) + CTA "Enter Dashboard" con transición suave. "error": shake animation en el input + mensaje de error prominente.
  - **Fondo**: Mantener glow background existente, posiblemente agregar partículas sutiles o pattern SVG animado (muy sutil, no distraer).
  - Reference: Couple Joy (código prominente), Spectre (estado visual), WeTransfer (loading minimalista).
    **Must NOT do**: No cambiar lógica de conexión (hooks, stores, react-hook-form), no agregar validación extra.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: Polish work
  - Skills: [`frontend-ui-ux`, `playwright`] — Reason: Visual QA
  - Omitted: [] — Reason: Full UI work

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T7 | Blocked By: T1,T2

  **References**:
  - Files: `apps/web-next/src/features/connect/components/connect-screen.tsx`, `connect-screen-shell.tsx`, `connect-entry-form.tsx`
  - Lazyweb: Couple Joy, Peek, Spectre, WeTransfer
  - Components: Existing `Button`, `Card`, `Input`, `Spinner`

  **Acceptance Criteria**:
  - [ ] Input de código es prominente (≥30% de pantalla)
  - [ ] Estados de conexión tienen animaciones distintivas
  - [ ] Estado "connected" muestra checkmark + CTA con transición
  - [ ] Estado "error" tiene shake + mensaje claro
  - [ ] OTP segmentado (si se implementa) soporta paste y navegación por teclado
  - [ ] Responsive: se ve bien en 375px y 768px

  **QA Scenarios**:

  ```
  Scenario: Connect flow visual
    Tool: Playwright
    Steps: Open /, enter code 123456, click connect
    Expected: Animaciones de estados se ven bien, CTA aparece al conectar
    Evidence: .sisyphus/evidence/web-next-redesign/t4-connect-flow.mp4
  ```

  **Commit**: YES | Message: `feat(web-next): polish connect screen with immersive states` | Files: `apps/web-next/src/features/connect/components/**`

- [x] 5. Lobby Screen Polish

  **What to do**: Refinar `/connected/lobby` existente. Layout ya es grid de 2 cols, pero falta dashboard feel. Trabajo:
  - **QueueCard**: Refinar existente — ya tiene fondo de mapa Data Dragon. Mejorar estado "Searching..." con animación pulse más prominente. Timer más grande. Botón cancel con variant `destructive` existente.
  - **ReadyCheckCard**: Refinar existente — ya tiene `ready-check-glow`. Mejorar urgency visual: <5s cambia borde a rojo + pulse acelerado. Botones Accept/Decline más grandes.
  - **LobbyMembersCard**: Refinar existente — ya usa Data Dragon avatars. Mejorar local member highlight (ring gold más prominente). Acciones en dropdown sutil.
  - **RolePreferencesCard**: Agregar selector visual con iconos de rol (emojis o iconos simples) en cards clickeables.
  - **Header**: Refinar info del peer con icono de conexión verde y mejor tipografía.
  - Reference: DraftKings (dashboard), Royal Match (badges).
    **Must NOT do**: No cambiar lógica de lobby, no agregar features nuevos.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: Polish work
  - Skills: [`frontend-ui-ux`, `playwright`] — Reason: Visual QA
  - Omitted: [] — Reason: Full UI work

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T7 | Blocked By: T1,T2

  **References**:
  - Files: `apps/web-next/src/routes/connected/lobby/route.tsx`, `-components/*`
  - Lazyweb: DraftKings, Royal Match
  - Components: Existing `Card`, `Button`

  **Acceptance Criteria**:
  - [ ] QueueCard tiene fondo de mapa + estado prominente
  - [ ] ReadyCheckCard tiene borde glow + urgency <5s
  - [ ] LobbyMembersCard muestra avatars circulares
  - [ ] RolePreferencesCard usa cards clickeables
  - [ ] Layout responsive: 1 col mobile, 2 col tablet+

  **QA Scenarios**:

  ```
  Scenario: Lobby dashboard
    Tool: Playwright
    Steps: Open /connected/lobby with mock data
    Expected: Cards render with new polish, no layout breaks
    Evidence: .sisyphus/evidence/web-next-redesign/t5-lobby.png
  ```

  **Commit**: YES | Message: `feat(web-next): polish lobby screen with dashboard feel` | Files: `apps/web-next/src/routes/connected/lobby/**`

- [x] 6. Invites Polish + Testing Infra

  **What to do**: Dos trabajos en paralelo dentro de esta tarea:
  **A) Invites polish**:
  - Lista de invites: cada item con avatar circular (Data Dragon profile icon o fallback con iniciales), nombre, tipo, timestamp, acciones inline (Accept/Decline).
  - Share sheet básico: botón "Invite Friends" en header que abre: (1) copy link (clipboard API), (2) Web Share API (`navigator.share`) si está disponible.
  - Estado vacío: placeholder visual (icono + texto amigable).
  - Reference: Fever, Airbuds, Locket.
    **B) Testing infra**:
  - **Playwright ya está instalado** (`@playwright/test` en devDependencies). Crear `playwright.config.ts` en `apps/web-next/` (NO correr `npm init playwright@latest`).
  - Crear tests visuales: screenshots de cada pantalla (`/`, `/connected/lobby`, `/connected/champ-select`, `/connected/invites`) en 375px y 768px.
  - Tests de interacción básicos: navegación entre tabs, filtro de campeones, click en botones.
    **Must NOT do**: No replicar sistema completo de amigos, no agregar chat, no reinstalar Playwright.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: UI + testing setup
  - Skills: [`frontend-ui-ux`, `playwright`] — Reason: Visual QA + testing
  - Omitted: [] — Reason: Full work

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T7 | Blocked By: T1,T2

  **References**:
  - Files: `apps/web-next/src/routes/connected/invites/route.tsx`
  - Lazyweb: Fever, Airbuds, Locket
  - External: Playwright docs `https://playwright.dev/`

  **Acceptance Criteria**:
  - [ ] Invites lista renderiza con avatars + acciones
  - [ ] Share sheet funciona (copy link + Web Share API)
  - [ ] Estado vacío tiene placeholder
  - [ ] Playwright configurado (`playwright.config.ts` creado, NO reinstalado)
  - [ ] Screenshots generados para todas las pantallas en 375px y 768px
  - [ ] Al menos 3 tests de interacción pasan

  **QA Scenarios**:

  ```
  Scenario: Invites visual
    Tool: Playwright
    Steps: Open /connected/invites with mock data
    Expected: All invites render with avatars and actions
    Evidence: .sisyphus/evidence/web-next-redesign/t6-invites.png

  Scenario: Playwright setup
    Tool: Bash
    Steps: cd apps/web-next && npx playwright test
    Expected: All tests pass, screenshots generated
    Evidence: .sisyphus/evidence/web-next-redesign/t6-playwright.txt
  ```

  **Commit**: YES | Message: `feat(web-next): polish invites + add Playwright testing infra` | Files: `apps/web-next/src/routes/connected/invites/**`, `apps/web-next/playwright.config.ts`

- [x] 7. Performance Audit

  **What to do**: Auditar performance post-redesign. Métricas: LCP < 2.5s, CLS < 0.1, INP < 200ms. Optimizaciones:
  - Lazy loading de imágenes Data Dragon (`loading="lazy"` + `decoding="async"`) — verificar en Champ Select
  - Preconnect a `https://ddragon.leagueoflegends.com` (agregar `<link rel="preconnect">` en `index.html`)
  - `font-display: swap` para Google Fonts (ya debería estar, verificar)
  - Code-splitting por ruta (verificar que TanStack Router lazy-loads)
  - Audit de CSS no usado (verificar que Tailwind v4 purge funciona)
  - Verificar 60fps en scroll de Champ Select grid
    **Must NOT do**: No service workers, no caching complejo.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: Performance work
  - Skills: [`frontend-ui-ux`] — Reason: Web vitals
  - Omitted: [`playwright`] — Reason: Lighthouse better

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: F1-F4 | Blocked By: T3-T6

  **References**:
  - External: `https://web.dev/vitals/`
  - File: `apps/web-next/index.html` — add preconnect
  - Tool: Lighthouse CI, Chrome DevTools Performance

  **Acceptance Criteria**:
  - [ ] Lighthouse mobile score ≥ 80
  - [ ] LCP < 2.5s
  - [ ] CLS < 0.1
  - [ ] INP < 200ms
  - [ ] Champ Select scroll a 60fps en throttled CPU (4x slowdown)
  - [ ] No más de 10 imágenes Data Dragon cargadas en initial load de champ select

  **QA Scenarios**:

  ```
  Scenario: Lighthouse audit
    Tool: Bash
    Steps: bun run build && npx lighthouse http://localhost:5173 --output=json
    Expected: Score ≥ 80, LCP < 2.5s, CLS < 0.1
    Evidence: .sisyphus/evidence/web-next-redesign/t7-lighthouse.json
  ```

  **Commit**: YES | Message: `perf(web-next): performance audit and optimizations` | Files: `apps/web-next/index.html`, multiple

## Final Verification Wave (MANDATORY)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [x] F1. Plan Compliance Audit — oracle [APPROVED]
- [x] F2. Code Quality Review — unspecified-high [APPROVED]
- [x] F3. Real Manual QA — unspecified-high (+ playwright) [APPROVED]
- [x] F4. Scope Fidelity Check — deep [APPROVED]

## Commit Strategy

- Atomic commits por tarea (T1-T7)
- Format: `design(web-next):`, `feat(web-next):`, `fix(web-next):`, `perf(web-next):`
- Polish commits pueden agruparse por pantalla

## Success Criteria

1. Champ Select tiene grid con lazy loading, filtros por rol, búsqueda, tabs
2. Layout soporta safe areas y landscape warning
3. Connect y Lobby se ven significativamente mejor que antes
4. Invites tiene avatars y share sheet
5. `bun run --filter @mimic/web-next test` pasa
6. `bun run --filter @mimic/web-next build` compila
7. Lighthouse mobile score ≥ 80
8. Playwright screenshots de todas las pantallas sin regresiones
9. Sin regresiones funcionales (conexión, queue, champ select funcionan)
