# Rediseño Estético Completo - Mimic

## TL;DR
> **Summary**: Rediseño visual completo de la app Mimic (compañera de League of Legends), modernizando el estilo LoL con glassmorphism, jerarquía tipográfica mejorada, fondos inmersivos, animaciones fluidas, y layouts reorganizados. Manteniendo la esencia dorado/azul marino pero con un enfoque contemporáneo.
> **Deliverables**: Sistema de tokens extendido, componentes UI rediseñados, layouts de todas las pantallas mejorados, animaciones nuevas, iconografía custom de LoL, fondos por pantalla
> **Effort**: Large
> **Parallel**: YES - 7 waves
> **Critical Path**: Wave 1 (Tokens + Primitivas) → Wave 2 (Layout + Iconografía) → Waves 3-6 (Páginas específicas) → Wave 7 (Verificación)

## Context

### Original Request
El usuario quiere mejorar el diseño estético de la app Mimic, tomando referencias del diseño de League of Legends pero sin que se vea anticuado. Enfoque puramente estético, sin cambiar lógica de negocio. Preguntó mucho para definir el scope y las preferencias.

### Interview Summary
- **Scope**: Toda la app (connect, lobby, champ-select, social, queue, ready-check, clash, arena, custom, swiftplay, invites)
- **Problemas actuales**: Falta personalidad/detalles + layouts deficientes en todas las páginas
- **Dirección**: Modernizar estilo LoL manteniendo la esencia (no copiar exactamente)
- **Fondos**: Mixto - imágenes de mapas LoL en lobby/champ-select, abstractos en connect/social
- **Iconografía**: Mezcla de lucide-react (UI general) + iconos custom SVG de LoL (roles/gameplay)
- **Plataforma**: Responsive desktop + mobile por igual
- **Animaciones**: Estética estática + animaciones juntas
- **Modo color**: Oscuro principal, estructura lista para modo claro futuro
- **Assets**: Reutilizar fondos e iconos de roles existentes en `legacy/web/src/static/`

### Metis Review (gaps addressed)
- **Riesgo de scope explosion**: Mitigado con waves definidas y límites claros
- **Regresión de layout**: Aclarado - solo cambios visuales, preservar DOM order/focus/keyboard
- **Fragmentación de tokens**: Unificar en `design-tokens.css` con variables CSS, mapear a Tailwind v4 `@theme`
- **Glassmorphism**: Usar con cuidado, siempre con fallback sólido y verificación de contraste
- **Assets/licensing**: Usar solo assets locales existentes (`legacy/web/src/static/`)
- **Accesibilidad**: Preservar focus states, usar `aria-label` en icon-only buttons, respetar `prefers-reduced-motion`
- **shadcn customization**: Solo estilo vía CSS variables y variantes, no modificar comportamiento
- **Nuevas librerías**: NO agregar Framer Motion u otras - usar CSS/Tailwind existentes

## Work Objectives

### Core Objective
Transformar la estética de Mimic de un diseño plano y genérico a una experiencia visual inmersiva, moderna, y con personalidad propia inspirada en League of Legends, manteniendo la funcionalidad intacta.

### Deliverables
1. Sistema de design tokens extendido (colores, espaciado, sombras, bordes, radii)
2. Tipografía mejorada con jerarquía clara (Cinzel display + sans-serif UI)
3. Componentes UI primitivos rediseñados (Button, Card, Input, Badge, Avatar, Alert, Skeleton, Spinner)
4. Layout base rediseñado (AppShell, SafeArea, con fondos y espaciado moderno)
5. Iconografía custom de LoL integrada (roles: top, jungle, mid, bot, support, fill)
6. Fondos por pantalla (mapas LoL para lobby/champ-select, gradientes abstractos para connect/social)
7. Animaciones y transiciones fluidas (hover effects, page transitions, micro-interacciones)
8. Layouts reorganizados para todas las páginas principales
9. Estados vacíos/error/loading con mejor estética
10. Responsive design verificado en mobile, tablet, desktop

### Definition of Done (verifiable conditions)
- [ ] Todos los tokens de diseño están en `design-tokens.css` y mapeados en `styles.css`
- [ ] Ningún color hardcodeado en componentes - todo usa tokens
- [ ] Screenshots before/after capturados para cada página principal
- [ ] No regressions funcionales (todos los clicks, formularios, navegación funcionan)
- [ ] Responsive verificado en 390x844, 768x1024, 1440x900
- [ ] Contraste verificado sobre fondos con imágenes
- [ ] `prefers-reduced-motion` respeta configuración del usuario
- [ ] Todos los focus states visibles y accesibles por teclado
- [ ] Build sin errores (`bun run build` o script equivalente)

### Must Have
- [ ] Paleta oscura como tema principal con estructura para modo claro futuro
- [ ] Glassmorphism sutil en cards/paneles (con fallback sólido)
- [ ] Bordes dorados sutiles con gradientes en elementos clave
- [ ] Fondos de mapas LoL en lobby y champ-select con overlay oscuro
- [ ] Iconos de roles de LoL en el lobby y champ-select
- [ ] Animaciones de hover en botones y cards
- [ ] Transiciones suaves entre páginas/estados
- [ ] Jerarquía tipográfica clara (tamaños, pesos, espaciado)
- [ ] Layout mobile-first que escala a desktop
- [ ] Reutilización de assets existentes en `legacy/web/src/static/`

### Must NOT Have (guardrails)
- [ ] NO cambiar lógica de negocio, APIs, rutas, handlers, stores
- [ ] NO agregar nuevas dependencias de animación (Framer Motion, etc.)
- [ ] NO usar assets externos/CDN sin aprobación
- [ ] NO hardcodear colores hex en componentes
- [ ] NO modificar comportamiento de shadcn primitives
- [ ] NO usar `transition: all` - especificar propiedades animadas
- [ ] NO romper accesibilidad (focus, aria-labels, reduced-motion)
- [ ] NO agregar nuevas features o settings panels
- [ ] NO rediseñar arquitectura de datos/estado
- [ ] NO agregar efectos de sonido o partículas pesadas

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- **Test decision**: No tests unitarios nuevos (es puramente visual), pero verificación visual con Playwright
- **QA policy**: Cada página tiene screenshots before/after + verificación de interacciones
- **Evidence**: `.sisyphus/evidence/task-{N}-{slug}.png` para screenshots
- **Herramientas**: Playwright para screenshots y verificación de interacciones, Bash para build/lint

## Execution Strategy

### Parallel Execution Waves
> Target: 4-6 tasks per wave. Shared dependencies in Wave 1 for max parallelism.

**Wave 1: Foundation (Tokens + Primitivas + Layout Base)**
- Extender design tokens con nuevos colores, sombras, espaciado
- Rediseñar primitivas UI (Button, Card, Input, Badge)
- Rediseñar AppShell y SafeArea con fondos
- Agregar iconografía custom de LoL (roles)
- Verificar build pasa

**Wave 2: Shared Components + Animations**
- Rediseñar componentes restantes (Avatar, Alert, Skeleton, Spinner, Dropdown)
- Implementar sistema de animaciones (keyframes, transitions, hover effects)
- Crear componentes de layout compartidos (Section, Panel, Header)
- Verificar responsive base

**Wave 3: Connect + Social Pages**
- Rediseñar connect-screen y connect-entry-form
- Rediseñar SocialPanel
- Rediseñar connected/route.tsx (header, layout)
- Fondos abstractos para connect/social

**Wave 4: Lobby + Queue**
- Rediseñar lobby route y componentes (lobby-member, role-picker, invite-overlay)
- Rediseñar queue route
- Integrar fondos de mapas LoL
- Integrar iconos de roles

**Wave 5: Champ-Select + Ready-Check**
- Rediseñar champ-select route y componentes (champion-picker, skin-picker, summoner-picker, bench, members, timer, rune-editor, player-settings)
- Rediseñar ready-check route
- Fondos de mapas con overlay

**Wave 6: Remaining Pages + Polish**
- Rediseñar arena, clash, custom, swiftplay, create-lobby, invites routes
- Rediseñar estados vacíos/error/loading
- Rediseñar LandscapeWarning
- Polish final (consistencia, espaciado, contrastes)

**Wave 7: Final Verification**
- Screenshots de todas las páginas en 3 viewports
- Verificación de interacciones (clicks, forms, keyboard)
- Verificación de accesibilidad (contrast, focus, reduced-motion)
- Verificación de build

### Dependency Matrix (full, all tasks)
| Task | Wave | Blocks | Blocked By |
|------|------|--------|------------|
| Tokens | 1 | All | - |
| Button/Card/Input | 1 | Wave 2-6 | Tokens |
| AppShell | 1 | Wave 2-6 | Tokens |
| LoL Icons | 1 | Wave 4-5 | - |
| Avatar/Alert/etc | 2 | Wave 3-6 | Wave 1 |
| Animations | 2 | Wave 3-6 | Wave 1 |
| Layout comps | 2 | Wave 3-6 | Wave 1 |
| Connect | 3 | - | Wave 1-2 |
| Social | 3 | - | Wave 1-2 |
| Lobby | 4 | - | Wave 1-2, LoL Icons |
| Queue | 4 | - | Wave 1-2 |
| Champ-Select | 5 | - | Wave 1-2, LoL Icons |
| Ready-Check | 5 | - | Wave 1-2 |
| Other pages | 6 | - | Wave 1-2 |
| Polish | 6 | - | Wave 3-5 |
| Verification | 7 | - | Wave 1-6 |

### Agent Dispatch Summary
| Wave | Tasks | Categories |
|------|-------|------------|
| 1 | 5 | visual-engineering |
| 2 | 4 | visual-engineering |
| 3 | 3 | visual-engineering |
| 4 | 3 | visual-engineering |
| 5 | 3 | visual-engineering |
| 6 | 3 | visual-engineering |
| 7 | 4 | oracle, unspecified-high, deep |

## TODOs

> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 1. Extender Design Tokens y Tailwind Theme

  **What to do**:
  1. Leer `src/styles/design-tokens.css` y `src/styles.css` actuales
  2. Extender tokens con: colores adicionales (grises, acentos), espaciado (xs-3xl), sombras (glassmorphism, glow), bordes (gold gradient), radii consistentes
  3. Agregar variables para modo claro (estructura, no implementación)
  4. Mapear todos los tokens a Tailwind v4 `@theme` en `styles.css`
  5. Verificar que no haya conflictos con shadcn variables

  **Must NOT do**:
  - No hardcodear colores hex en lugar de tokens
  - No eliminar tokens existentes usados por shadcn
  - No implementar toggle de modo claro todavía

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: CSS/Tailwind token system design
  - Skills: [`typescript-advanced-types`] - Reason: Type safety for theme extensions if needed
  - Omitted: [`react-patterns`] - Reason: No React components yet, pure styling

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 2-20 | Blocked By: -

  **References**:
  - Pattern: `src/styles/design-tokens.css` - Extender tokens existentes de LoL
  - Pattern: `src/styles.css` - Mapear a Tailwind v4 `@theme`
  - External: https://tailwindcss.com/docs/theme - Tailwind v4 theme docs
  - External: https://www.radix-ui.com/themes/docs/theme/dark-mode - shadcn dark mode strategy

  **Acceptance Criteria**:
  - [ ] `design-tokens.css` contiene al menos 50 tokens organizados (colors, spacing, shadows, borders, radii, typography)
  - [ ] `styles.css` mapea todos los tokens a Tailwind `@theme`
  - [ ] No hay colores hardcodeados en ningún archivo de estilos
  - [ ] Build pasa: `cd apps/web-next && bun run build` (o script equivalente)

  **QA Scenarios**:
  ```
  Scenario: Tokens compile correctly
    Tool: Bash
    Steps: cd apps/web-next && bun run build
    Expected: Build completes with 0 errors
    Evidence: .sisyphus/evidence/task-1-tokens-build.txt

  Scenario: Tokens accessible in components
    Tool: Bash
    Steps: grep -r "bg-lol-gold\|text-lol-gold" src/components/ | wc -l
    Expected: At least 5 usages of theme tokens
    Evidence: .sisyphus/evidence/task-1-tokens-usage.txt
  ```

  **Commit**: YES | Message: `design(tokens): extend design system with modern LoL tokens` | Files: `src/styles/design-tokens.css`, `src/styles.css`

- [x] 2. Rediseñar Primitivas UI - Button, Card, Input, Badge

  **What to do**:
  1. Leer componentes actuales en `src/components/ui/`
  2. Rediseñar Button: variantes (default, outline, ghost, gold-accent), hover effects con glow dorado, estados (loading, disabled), tamaños (sm, md, lg)
  3. Rediseñar Card: glassmorphism sutil (backdrop-blur, bg-opacity), borde dorado con gradiente, sombra, padding consistente
  4. Rediseñar Input: estilo LoL con borde sutil, focus ring dorado, estados (error, disabled), iconos internos
  5. Rediseñar Badge: variantes por contexto (default, gold, success, warning), bordes redondeados consistentes
  6. Usar solo tokens del design system

  **Must NOT do**:
  - No cambiar APIs/props de los componentes
  - No eliminar variantes existentes usadas por otros componentes
  - No hardcodear estilos

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: shadcn component customization
  - Skills: [`react-patterns`] - Reason: React 19 component patterns
  - Omitted: [`zustand`] - Reason: No state management needed

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 3-20 | Blocked By: 1

  **References**:
  - Pattern: `src/components/ui/button.tsx` - Seguir estructura de variantes con class-variance-authority
  - Pattern: `src/components/ui/card.tsx` - Mantener composición (Card, CardHeader, etc.)
  - Pattern: `src/styles/design-tokens.css` - Usar tokens extendidos del task 1

  **Acceptance Criteria**:
  - [ ] Button tiene al menos 4 variantes visuales distintas con hover effects
  - [ ] Card tiene glassmorphism (backdrop-blur) con fallback sólido
  - [ ] Input tiene focus ring dorado visible y accesible
  - [ ] Badge tiene variantes contextuales
  - [ ] Todos los componentes usan tokens CSS, no hardcode

  **QA Scenarios**:
  ```
  Scenario: Button hover effects work
    Tool: Playwright
    Steps: 
      1. Navigate to any page with buttons
      2. Hover over primary button
      3. Take screenshot
    Expected: Button shows glow/gold effect on hover
    Evidence: .sisyphus/evidence/task-2-button-hover.png

  Scenario: Card glassmorphism renders
    Tool: Playwright
    Steps:
      1. Navigate to lobby or champ-select
      2. Take screenshot of card components
    Expected: Cards show subtle transparency/blur without breaking readability
    Evidence: .sisyphus/evidence/task-2-card-glass.png

  Scenario: Input focus state visible
    Tool: Playwright
    Steps:
      1. Navigate to connect page
      2. Click on input field
      3. Take screenshot
    Expected: Input shows gold focus ring
    Evidence: .sisyphus/evidence/task-2-input-focus.png
  ```

  **Commit**: YES | Message: `design(ui): redesign Button, Card, Input, Badge primitives` | Files: `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, `src/components/ui/input.tsx`, `src/components/ui/badge.tsx`

- [x] 3. Rediseñar AppShell, SafeArea y Layout Base

  **What to do**:
  1. Leer `src/components/layout/AppShell.tsx` y `SafeArea.tsx`
  2. Rediseñar AppShell con fondo base oscuro (gradiente sutil o patrón abstracto)
  3. Agregar capa de overlay sutil para profundidad
  4. Rediseñar SafeArea con padding responsive consistente
  5. Crear componente `BackgroundLayer` para manejar fondos por página (gradiente abstracto vs imagen de mapa)
  6. Asegurar que el layout funcione en mobile (safe areas, notch) y desktop
  7. No cambiar la estructura de rutas o outlets

  **Must NOT do**:
  - No cambiar el outlet de rutas
  - No modificar el router
  - No romper mobile safe areas existentes

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Layout and responsive design
  - Skills: [`react-patterns`] - Reason: Layout components
  - Omitted: [`tanstack-router-best-practices`] - Reason: No routing changes

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4-20 | Blocked By: 1

  **References**:
  - Pattern: `src/components/layout/AppShell.tsx` - Layout base actual
  - Pattern: `src/components/layout/SafeArea.tsx` - Mobile safe areas
  - Pattern: `src/routes/connected/route.tsx` - Shell con header y contenido

  **Acceptance Criteria**:
  - [ ] AppShell tiene fondo oscuro con gradiente o patrón sutil
  - [ ] SafeArea respeta safe areas en iOS/Android
  - [ ] Layout no tiene overflow horizontal en ningún viewport
  - [ ] BackgroundLayer permite cambiar fondo por página

  **QA Scenarios**:
  ```
  Scenario: Layout responsive
    Tool: Playwright
    Steps:
      1. Navigate to connected page
      2. Set viewport to 390x844 (mobile)
      3. Take screenshot
      4. Set viewport to 1440x900 (desktop)
      5. Take screenshot
    Expected: No horizontal overflow, content fits properly in both
    Evidence: .sisyphus/evidence/task-3-layout-mobile.png, .sisyphus/evidence/task-3-layout-desktop.png

  Scenario: Background changes by page
    Tool: Playwright
    Steps:
      1. Navigate to lobby (should have map background)
      2. Navigate to connect (should have abstract background)
      3. Take screenshots of both
    Expected: Different backgrounds visible
    Evidence: .sisyphus/evidence/task-3-backgrounds.png
  ```

  **Commit**: YES | Message: `design(layout): redesign AppShell, SafeArea, add BackgroundLayer` | Files: `src/components/layout/AppShell.tsx`, `src/components/layout/SafeArea.tsx`, `src/components/layout/BackgroundLayer.tsx`

- [x] 4. Integrar Iconografía Custom de LoL

  **What to do**:
  1. Copiar iconos de roles desde `legacy/web/src/static/roles/` a `apps/web-next/public/icons/roles/`
  2. Crear componente `RoleIcon` que reciba `role` (top, jungle, mid, bot, support, fill, unselected) y renderice el SVG/PNG correspondiente
  3. Asegurar que los iconos se vean bien en diferentes tamaños (sm, md, lg)
  4. Crear variantes: default (blanco/gris), active (dorado), disabled (opaco)
  5. Integrar en `role-picker.tsx` y otros componentes que usan roles
  6. Optimizar imágenes si es necesario (convertir PNG a SVG si es posible, o usar WebP)

  **Must NOT do**:
  - No descargar iconos externos
  - No modificar la lógica de selección de roles

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Icon system and image assets
  - Skills: [`react-patterns`] - Reason: Icon component design
  - Omitted: [`tanstack-query-best-practices`] - Reason: No data fetching

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 5-20 | Blocked By: -

  **References**:
  - Source: `legacy/web/src/static/roles/role-*.png` - Iconos originales de roles
  - Pattern: `src/features/lobby/components/role-picker.tsx` - Donde integrar
  - External: https://lucide.dev/icons/ - Referencia de sizing/stroke para consistencia

  **Acceptance Criteria**:
  - [ ] Todos los roles (top, jungle, mid, bot, support, fill, unselected) tienen icono
  - [ ] RoleIcon soporta tamaños sm/md/lg
  - [ ] RoleIcon soporta variantes default/active/disabled
  - [ ] Integrado en role-picker.tsx

  **QA Scenarios**:
  ```
  Scenario: Role icons render correctly
    Tool: Playwright
    Steps:
      1. Navigate to lobby
      2. Open role picker
      3. Take screenshot
    Expected: All role icons visible with gold highlight on active
    Evidence: .sisyphus/evidence/task-4-role-icons.png

  Scenario: Role icon sizes
    Tool: Bash
    Steps: Check that RoleIcon component accepts size prop and renders correctly
    Expected: Component renders sm (16px), md (24px), lg (32px) variants
    Evidence: .sisyphus/evidence/task-4-role-sizes.txt
  ```

  **Commit**: YES | Message: `design(icons): add LoL role icons and RoleIcon component` | Files: `public/icons/roles/*`, `src/components/icons/RoleIcon.tsx`, `src/features/lobby/components/role-picker.tsx`

- [x] 5. Implementar Sistema de Animaciones

  **What to do**:
  1. Leer `src/styles/animations.css` actual
  2. Extender con nuevas animaciones:
     - `fade-in`: entrada suave para páginas/modales
     - `slide-up`: entrada desde abajo para cards/paneles
     - `scale-in`: para modales y overlays
     - `pulse-gold`: para elementos destacados (queue ready, notifications)
     - `shimmer`: para estados de loading
     - `float`: para elementos decorativos sutiles
  3. Crear utilidades Tailwind para transiciones:
     - `transition-gold`: transición suave para colores dorados
     - `transition-transform`: para hover effects
     - `transition-opacity`: para fade in/out
  4. Implementar hover effects:
     - Botones: glow dorado + scale sutil
     - Cards: elevación + borde dorado más visible
     - Links: underline animado
     - Iconos: scale + color dorado
  5. Agregar `@media (prefers-reduced-motion: reduce)` para todas las animaciones
  6. Verificar que las animaciones no afecten rendimiento en mobile

  **Must NOT do**:
  - No usar `transition: all` - especificar propiedades
  - No agregar librerías de animación externas
  - No crear animaciones que bloqueen el thread principal

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: CSS animations and performance
  - Skills: [`react-patterns`] - Reason: React animation patterns
  - Omitted: [`tanstack-query-best-practices`] - Reason: No data fetching

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 6-20 | Blocked By: 1

  **References**:
  - Pattern: `src/styles/animations.css` - Animaciones existentes
  - Pattern: `src/components/ui/button.tsx` - Donde aplicar hover effects
  - External: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations - CSS animations best practices

  **Acceptance Criteria**:
  - [ ] Al menos 6 animaciones nuevas definidas en animations.css
  - [ ] Todas las animaciones tienen versión `prefers-reduced-motion`
  - [ ] Hover effects implementados en Button, Card, Link
  - [ ] Ninguna animación usa `transition: all`

  **QA Scenarios**:
  ```
  Scenario: Animations work with reduced motion
    Tool: Playwright
    Steps:
      1. Emulate prefers-reduced-motion: reduce
      2. Navigate to lobby
      3. Take screenshot
    Expected: No animations playing, all content static and accessible
    Evidence: .sisyphus/evidence/task-5-reduced-motion.png

  Scenario: Button hover animation
    Tool: Playwright
    Steps:
      1. Navigate to any page with buttons
      2. Hover over primary button
      3. Record video or take screenshot
    Expected: Button shows smooth glow/scale effect
    Evidence: .sisyphus/evidence/task-5-button-hover.gif
  ```

  **Commit**: YES | Message: `design(animations): add animation system with hover effects and reduced-motion support` | Files: `src/styles/animations.css`, `src/components/ui/button.tsx`, `src/components/ui/card.tsx`

- [x] 6. Rediseñar Componentes UI Restantes (Avatar, Alert, Skeleton, Spinner, Dropdown)

  **What to do**:
  1. Rediseñar Avatar: borde dorado cuando está activo/online, borde gris cuando offline, placeholder con iniciales, tamaños consistentes
  2. Rediseñar Alert: variantes (info, success, warning, error) con iconos de lucide y colores del token system, bordes sutiles, animación de entrada
  3. Rediseñar Skeleton: shimmer effect dorado sobre fondo oscuro, formas que imitan contenido real
  4. Rediseñar Spinner: estilo LoL (circular dorado, posiblemente con glow)
  5. Rediseñar Dropdown Menu: glassmorphism, bordes dorados, items con hover sutil, separadores elegantes
  6. Usar tokens del sistema y animaciones del task 5

  **Must NOT do**:
  - No cambiar APIs de los componentes
  - No eliminar funcionalidad existente

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Component styling
  - Skills: [`react-patterns`] - Reason: shadcn component patterns
  - Omitted: [`zustand`] - Reason: No state changes

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 7-20 | Blocked By: 1, 5

  **References**:
  - Pattern: `src/components/ui/avatar.tsx` - Componente actual
  - Pattern: `src/components/ui/alert.tsx` - Alert actual
  - Pattern: `src/components/ui/skeleton.tsx` - Skeleton actual
  - Pattern: `src/components/ui/spinner.tsx` - Spinner actual
  - Pattern: `src/components/ui/dropdown-menu.tsx` - Dropdown actual

  **Acceptance Criteria**:
  - [ ] Avatar tiene bordes de estado (online/offline/away)
  - [ ] Alert tiene 4 variantes visuales con iconos
  - [ ] Skeleton tiene shimmer effect dorado
  - [ ] Spinner tiene estilo circular dorado
  - [ ] Dropdown tiene glassmorphism y hover effects

  **QA Scenarios**:
  ```
  Scenario: Avatar states render correctly
    Tool: Playwright
    Steps:
      1. Navigate to social panel or lobby
      2. Take screenshot showing avatars
    Expected: Avatars show gold border for online, gray for offline
    Evidence: .sisyphus/evidence/task-6-avatar-states.png

  Scenario: Dropdown menu styled
    Tool: Playwright
    Steps:
      1. Navigate to page with dropdown
      2. Click dropdown trigger
      3. Take screenshot
    Expected: Dropdown shows glassmorphism with gold borders and subtle hover
    Evidence: .sisyphus/evidence/task-6-dropdown.png
  ```

  **Commit**: YES | Message: `design(ui): redesign Avatar, Alert, Skeleton, Spinner, Dropdown` | Files: `src/components/ui/avatar.tsx`, `src/components/ui/alert.tsx`, `src/components/ui/skeleton.tsx`, `src/components/ui/spinner.tsx`, `src/components/ui/dropdown-menu.tsx`

- [x] 7. Crear Componentes de Layout Compartidos

  **What to do**:
  1. Crear `Section`: contenedor con título estilizado (Cinzel), borde inferior dorado sutil, padding consistente
  2. Crear `Panel`: card especializada para contenido principal con glassmorphism, header opcional, footer opcional
  3. Crear `PageHeader`: título de página con breadcrumbs si aplica, icono decorativo, línea divisoria dorada
  4. Crear `Divider`: línea divisoria con gradiente dorado o sutil
  5. Crear `EmptyState`: ilustración/icono + mensaje + acción CTA para estados vacíos
  6. Crear `LoadingState`: spinner + mensaje para estados de carga
  7. Usar tokens y animaciones existentes

  **Must NOT do**:
  - No crear componentes que dupliquen funcionalidad de shadcn
  - No hardcodear estilos

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Shared layout components
  - Skills: [`react-patterns`, `vercel-composition-patterns`] - Reason: Composition patterns for flexible layouts
  - Omitted: [`zustand`] - Reason: No state needed

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 8-20 | Blocked By: 1, 2, 5

  **References**:
  - Pattern: `src/components/ui/card.tsx` - Base para Panel
  - Pattern: `src/styles/design-tokens.css` - Tokens para estilos
  - External: https://tailwindcss.com/docs/flex - Layout utilities

  **Acceptance Criteria**:
  - [ ] Section tiene título estilizado con Cinzel y borde dorado
  - [ ] Panel tiene glassmorphism, header/footer opcionales
  - [ ] PageHeader tiene icono + título + línea divisoria
  - [ ] EmptyState tiene icono, mensaje, y CTA
  - [ ] LoadingState integra Spinner rediseñado

  **QA Scenarios**:
  ```
  Scenario: Section component renders
    Tool: Bash
    Steps: Check Section component source for proper styling
    Expected: Uses font-display, has gold border, consistent padding
    Evidence: .sisyphus/evidence/task-7-section-code.txt

  Scenario: Empty state in lobby
    Tool: Playwright
    Steps:
      1. Navigate to lobby with no data
      2. Take screenshot
    Expected: Shows EmptyState with icon and message
    Evidence: .sisyphus/evidence/task-7-emptystate.png
  ```

  **Commit**: YES | Message: `design(layout): add shared layout components (Section, Panel, PageHeader, EmptyState, LoadingState)` | Files: `src/components/layout/Section.tsx`, `src/components/layout/Panel.tsx`, `src/components/layout/PageHeader.tsx`, `src/components/layout/EmptyState.tsx`, `src/components/layout/LoadingState.tsx`

- [x] 8. Rediseñar Connect Screen

  **What to do**:
  1. Leer `src/features/connect/components/connect-screen.tsx` y `connect-entry-form.tsx`
  2. Rediseñar connect-screen:
     - Fondo abstracto oscuro con gradiente sutil (no imagen de mapa)
     - Logo/título más prominente con Cinzel y letter-spacing
     - Card central con glassmorphism para el formulario
     - Estado de conexión visual mejorado (indicador con pulse)
     - Footer minimalista
  3. Rediseñar connect-entry-form:
     - Input estilizado con focus ring dorado
     - Botón principal con glow dorado
     - Mensajes de error/éxito con Alert rediseñado
     - Layout centrado y responsive
  4. Agregar animaciones de entrada (fade-in, slide-up)

  **Must NOT do**:
  - No cambiar lógica de conexión o validación
  - No modificar rutas

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Page-level redesign
  - Skills: [`react-patterns`] - Reason: Component composition
  - Omitted: [`tanstack-router-best-practices`] - Reason: No routing changes

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: - | Blocked By: 1, 2, 5, 7

  **References**:
  - Pattern: `src/features/connect/components/connect-screen.tsx` - Pantalla actual
  - Pattern: `src/features/connect/components/connect-entry-form.tsx` - Formulario actual
  - Pattern: `src/components/layout/BackgroundLayer.tsx` - Fondo abstracto (task 3)

  **Acceptance Criteria**:
  - [ ] Connect screen tiene fondo abstracto oscuro con gradiente
  - [ ] Formulario centrado en card con glassmorphism
  - [ ] Input tiene focus ring dorado visible
  - [ ] Estado de conexión visible con indicador animado
  - [ ] Animaciones de entrada funcionan
  - [ ] Responsive en mobile y desktop

  **QA Scenarios**:
  ```
  Scenario: Connect screen visual
    Tool: Playwright
    Steps:
      1. Navigate to home/connect page
      2. Take screenshot at 1440x900
      3. Take screenshot at 390x844
    Expected: Centered card with glassmorphism, gold accents, proper spacing
    Evidence: .sisyphus/evidence/task-8-connect-desktop.png, task-8-connect-mobile.png

  Scenario: Connect form interaction
    Tool: Playwright
    Steps:
      1. Navigate to connect page
      2. Click input field
      3. Type invalid code
      4. Submit
      5. Take screenshot
    Expected: Error state shows with Alert component styled correctly
    Evidence: .sisyphus/evidence/task-8-connect-error.png
  ```

  **Commit**: YES | Message: `design(connect): redesign connect screen with glassmorphism and abstract background` | Files: `src/features/connect/components/connect-screen.tsx`, `src/features/connect/components/connect-entry-form.tsx`

- [x] 9. Rediseñar Social Panel y Header

  **What to do**:
  1. Leer `src/features/social/components/SocialPanel.tsx` y `src/routes/connected/route.tsx`
  2. Rediseñar SocialPanel:
     - Panel lateral con glassmorphism
     - Header con título y controles estilizados
     - Lista de amigos con avatares rediseñados, nombres, estado
     - Acciones (invitar, mensaje) con iconos lucide estilizados
     - Estados vacíos con EmptyState
     - Layout responsive (sidebar en desktop, drawer/bottom sheet en mobile)
  3. Rediseñar Header de connected route:
     - Logo/título con Cinzel
     - Controles (social toggle, debug) con iconos estilizados
     - Fondo con blur/glassmorphism
     - Altura consistente
  4. Integrar animaciones para apertura/cierre del panel

  **Must NOT do**:
  - No cambiar lógica de amigos/mensajes
  - No modificar rutas

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Complex panel redesign
  - Skills: [`react-patterns`] - Reason: Panel and list components
  - Omitted: [`zustand`] - Reason: Social state unchanged

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: - | Blocked By: 1, 2, 5, 6, 7

  **References**:
  - Pattern: `src/features/social/components/SocialPanel.tsx` - Panel actual
  - Pattern: `src/routes/connected/route.tsx` - Header y layout
  - Pattern: `src/components/ui/avatar.tsx` - Avatar rediseñado
  - Pattern: `src/components/layout/Panel.tsx` - Panel compartido

  **Acceptance Criteria**:
  - [ ] SocialPanel tiene glassmorphism y bordes dorados
  - [ ] Lista de amigos muestra avatares con bordes de estado
  - [ ] Header tiene logo Cinzel y controles estilizados
  - [ ] Panel se abre/cierra con animación suave
  - [ ] Mobile: panel funciona como drawer/bottom sheet

  **QA Scenarios**:
  ```
  Scenario: Social panel visual
    Tool: Playwright
    Steps:
      1. Navigate to connected page
      2. Open social panel
      3. Take screenshot
    Expected: Panel shows with glassmorphism, friend list with styled avatars
    Evidence: .sisyphus/evidence/task-9-social-panel.png

  Scenario: Social panel mobile
    Tool: Playwright
    Steps:
      1. Set viewport to 390x844
      2. Navigate to connected page
      3. Open social panel
      4. Take screenshot
    Expected: Panel takes full width or bottom sheet, no overflow
    Evidence: .sisyphus/evidence/task-9-social-mobile.png
  ```

  **Commit**: YES | Message: `design(social): redesign SocialPanel and connected header` | Files: `src/features/social/components/SocialPanel.tsx`, `src/routes/connected/route.tsx`

- [x] 10. Rediseñar Lobby Page y Componentes

  **What to do**:
  1. Leer `src/routes/connected/lobby/route.tsx`, `lobby-member.tsx`, `role-picker.tsx`, `invite-overlay.tsx`
  2. Rediseñar lobby page:
     - Fondo con imagen de Summoner's Rift (de `legacy/web/src/static/backgrounds/`) con overlay oscuro
     - Layout de grid moderno para miembros
     - Header del lobby con modo de juego y controles
     - Sección de miembros con cards individuales
  3. Rediseñar lobby-member:
     - Card con avatar, nombre, rol (con icono LoL), estado
     - Acciones (kick, promote) con iconos estilizados
     - Indicador de "owner" con badge dorado
  4. Rediseñar role-picker:
     - Grid de roles con iconos LoL rediseñados
     - Estados: unselected (gris), selected (dorado), disabled (opaco)
     - Animación al seleccionar
  5. Rediseñar invite-overlay:
     - Modal con glassmorphism
     - Formulario de invitación estilizado
     - Lista de invitaciones pendientes

  **Must NOT do**:
  - No cambiar lógica de lobby (crear, unirse, roles, etc.)
  - No modificar API calls

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Complex page with multiple components
  - Skills: [`react-patterns`] - Reason: Multiple component coordination
  - Omitted: [`tanstack-query-best-practices`] - Reason: No data fetching changes

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: - | Blocked By: 1, 2, 3, 4, 5, 6, 7

  **References**:
  - Pattern: `src/routes/connected/lobby/route.tsx` - Lobby route
  - Pattern: `src/features/lobby/components/lobby-member.tsx` - Miembro
  - Pattern: `src/features/lobby/components/role-picker.tsx` - Selector de roles
  - Pattern: `src/features/lobby/components/invite-overlay.tsx` - Overlay
  - Asset: `legacy/web/src/static/backgrounds/bg-sr.jpg` - Fondo de SR
  - Pattern: `src/components/icons/RoleIcon.tsx` - Iconos de roles

  **Acceptance Criteria**:
  - [ ] Lobby tiene fondo de Summoner's Rift con overlay
  - [ ] Miembros muestran en grid con cards estilizadas
  - [ ] Role picker muestra iconos LoL con estados dorado/gris
  - [ ] Invite overlay tiene glassmorphism
  - [ ] Layout responsive en mobile (stack) y desktop (grid)

  **QA Scenarios**:
  ```
  Scenario: Lobby with members
    Tool: Playwright
    Steps:
      1. Navigate to lobby with members
      2. Take screenshot at 1440x900
      3. Take screenshot at 390x844
    Expected: Grid of member cards with avatars, role icons, gold accents
    Evidence: .sisyphus/evidence/task-10-lobby-desktop.png, task-10-lobby-mobile.png

  Scenario: Role picker interaction
    Tool: Playwright
    Steps:
      1. Navigate to lobby
      2. Click role picker
      3. Select a role
      4. Take screenshot
    Expected: Selected role highlighted in gold, others in gray
    Evidence: .sisyphus/evidence/task-10-role-picker.png
  ```

  **Commit**: YES | Message: `design(lobby): redesign lobby page with map background and role icons` | Files: `src/routes/connected/lobby/route.tsx`, `src/features/lobby/components/lobby-member.tsx`, `src/features/lobby/components/role-picker.tsx`, `src/features/lobby/components/invite-overlay.tsx`

- [x] 11. Rediseñar Queue Page

  **What to do**:
  1. Leer `src/routes/connected/queue/route.tsx`
  2. Rediseñar queue page:
     - Fondo con imagen del modo de juego actual (SR, ARAM, TFT)
     - Card central grande con información de queue
     - Estado visual claro: "Buscando...", "En cola", "Listo"
     - Timer animado con estilo LoL
     - Botones "Find match" y "Leave queue" con estilos distintivos
     - Indicador de tipo de queue con icono
  3. Agregar animación de pulse dorado cuando está buscando
  4. Estado vacío cuando no está en queue

  **Must NOT do**:
  - No cambiar lógica de queue o matchmaking

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: State-based page redesign
  - Skills: [`react-patterns`] - Reason: State-dependent styling
  - Omitted: [`zustand`] - Reason: Queue state unchanged

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: - | Blocked By: 1, 2, 5, 7

  **References**:
  - Pattern: `src/routes/connected/queue/route.tsx` - Queue actual
  - Pattern: `src/components/layout/EmptyState.tsx` - Estado vacío
  - Asset: `legacy/web/src/static/backgrounds/` - Fondos por modo

  **Acceptance Criteria**:
  - [ ] Queue muestra fondo según modo de juego
  - [ ] Estados visuales distintivos (searching, in-queue, ready)
  - [ ] Timer con estilo LoL
  - [ ] Botones con estilos distintivos y hover effects
  - [ ] Responsive en mobile y desktop

  **QA Scenarios**:
  ```
  Scenario: Queue searching state
    Tool: Playwright
    Steps:
      1. Navigate to queue
      2. Click "Find match"
      3. Take screenshot
    Expected: Shows searching state with animated pulse, timer running
    Evidence: .sisyphus/evidence/task-11-queue-searching.png

  Scenario: Queue not in queue state
    Tool: Playwright
    Steps:
      1. Navigate to queue when not in queue
      2. Take screenshot
    Expected: Shows EmptyState or "You are not in a queue" with styling
    Evidence: .sisyphus/evidence/task-11-queue-empty.png
  ```

  **Commit**: YES | Message: `design(queue): redesign queue page with game mode backgrounds` | Files: `src/routes/connected/queue/route.tsx`

- [x] 12. Rediseñar Champ-Select Page y Componentes

  **What to do**:
  1. Leer todos los componentes de champ-select:
     - `champion-picker.tsx`, `skin-picker.tsx`, `summoner-picker.tsx`
     - `bench.tsx`, `members.tsx`, `timer.tsx`, `rune-editor.tsx`, `player-settings.tsx`
  2. Rediseñar champ-select route:
     - Fondo con imagen del modo de juego con overlay oscuro
     - Layout de 3 columnas en desktop: picker | configuración | miembros
     - Layout apilado en mobile
  3. Rediseñar champion-picker:
     - Grid de campeones con imágenes de Data Dragon
     - Cards con hover (scale + glow dorado)
     - Búsqueda con input estilizado
     - Filtros por rol con iconos LoL
     - Estado seleccionado con borde dorado brillante
  4. Rediseñar skin-picker:
     - Carrusel de skins con navegación estilizada
     - Skin seleccionada destacada
  5. Rediseñar summoner-picker:
     - Grid de hechizos con imágenes de Data Dragon
     - Hover effects
     - Estado seleccionado
  6. Rediseñar bench (ARAM):
     - Lista horizontal de campeones en banco
     - Scroll suave con indicadores
  7. Rediseñar members:
     - Lista de invocadores con avatares, nombres, campeones seleccionados
     - Indicador de turno con animación
  8. Rediseñar timer:
     - Barra de progreso o círculo con color dorado
     - Animación de pulse cuando queda poco tiempo
  9. Rediseñar rune-editor:
     - Grid de runas con imágenes de Data Dragon
     - Selección estilizada con borde dorado
  10. Rediseñar player-settings:
      - Panel con tabs o secciones
      - Configuraciones estilizadas

  **Must NOT do**:
  - No cambiar lógica de selección de campeones
  - No modificar APIs de Data Dragon
  - No cambiar el flujo de pick/ban

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Most complex page with many components
  - Skills: [`react-patterns`] - Reason: Many coordinated components
  - Omitted: [`tanstack-query-best-practices`] - Reason: No data fetching changes

  **Parallelization**: Can Parallel: YES | Wave 5 | Blocks: - | Blocked By: 1, 2, 3, 4, 5, 6, 7

  **References**:
  - Pattern: `src/routes/connected/champ-select/route.tsx` - Route actual
  - Pattern: `src/features/champ-select/components/champion-picker.tsx` - Picker
  - Pattern: `src/features/champ-select/components/skin-picker.tsx` - Skins
  - Pattern: `src/features/champ-select/components/summoner-picker.tsx` - Hechizos
  - Pattern: `src/features/champ-select/components/bench.tsx` - Banco ARAM
  - Pattern: `src/features/champ-select/components/members.tsx` - Miembros
  - Pattern: `src/features/champ-select/components/timer.tsx` - Timer
  - Pattern: `src/features/champ-select/components/rune-editor.tsx` - Runas
  - Pattern: `src/features/champ-select/components/player-settings.tsx` - Settings

  **Acceptance Criteria**:
  - [ ] Champ-select tiene layout de 3 columnas en desktop
  - [ ] Champion picker muestra grid con hover effects dorados
  - [ ] Skin picker tiene carrusel estilizado
  - [ ] Summoner picker muestra hechizos con estados
  - [ ] Timer tiene animación de pulse cuando queda poco tiempo
  - [ ] Members muestra turno actual con indicador animado
  - [ ] Responsive en mobile (layout apilado)

  **QA Scenarios**:
  ```
  Scenario: Champ select desktop layout
    Tool: Playwright
    Steps:
      1. Navigate to champ-select
      2. Take screenshot at 1440x900
    Expected: 3-column layout with picker, settings, members. Gold accents visible.
    Evidence: .sisyphus/evidence/task-12-champselect-desktop.png

  Scenario: Champ select mobile layout
    Tool: Playwright
    Steps:
      1. Navigate to champ-select
      2. Take screenshot at 390x844
    Expected: Stacked layout, no overflow, touch-friendly elements
    Evidence: .sisyphus/evidence/task-12-champselect-mobile.png

  Scenario: Champion hover effect
    Tool: Playwright
    Steps:
      1. Navigate to champ-select
      2. Hover over a champion card
      3. Take screenshot
    Expected: Card shows scale + gold glow effect
    Evidence: .sisyphus/evidence/task-12-champion-hover.png
  ```

  **Commit**: YES | Message: `design(champ-select): redesign champ-select with 3-column layout and gold hover effects` | Files: `src/routes/connected/champ-select/route.tsx`, `src/features/champ-select/components/*.tsx`

- [x] 13. Rediseñar Ready-Check Page

  **What to do**:
  1. Leer `src/routes/connected/ready-check/route.tsx`
  2. Rediseñar ready-check:
     - Pantalla modal/overlay a pantalla completa
     - Fondo oscuro con blur (backdrop-filter)
     - "MATCH FOUND" en grande con Cinzel
     - Información del modo de juego
     - Timer grande y prominente con animación de pulse
     - Botones "ACCEPT" y "DECLINE" estilizados:
       - Accept: fondo dorado con glow, texto oscuro
       - Decline: fondo oscuro con borde dorado, texto dorado
     - Animación de entrada dramática (scale-in + fade)
     - Estado de expiración con alerta visual
  3. Asegurar que sea la pantalla más prominente e inmersiva

  **Must NOT do**:
  - No cambiar lógica de aceptar/declinar
  - No modificar timers

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: High-impact modal screen
  - Skills: [`react-patterns`] - Reason: Modal/overlay patterns
  - Omitted: [`zustand`] - Reason: No state changes

  **Parallelization**: Can Parallel: YES | Wave 5 | Blocks: - | Blocked By: 1, 2, 5, 7

  **References**:
  - Pattern: `src/routes/connected/ready-check/route.tsx` - Ready check actual
  - Pattern: `src/styles/animations.css` - Animaciones para entrada
  - Pattern: `src/components/ui/button.tsx` - Botones rediseñados

  **Acceptance Criteria**:
  - [ ] Ready-check es pantalla completa con backdrop blur
  - [ ] "MATCH FOUND" en Cinzel grande y prominente
  - [ ] Timer con animación de pulse
  - [ ] Botón Accept dorado con glow, Decline con borde dorado
  - [ ] Animación de entrada dramática

  **QA Scenarios**:
  ```
  Scenario: Ready check visual
    Tool: Playwright
    Steps:
      1. Navigate to ready-check (or trigger state)
      2. Take screenshot
    Expected: Full screen overlay with "MATCH FOUND", prominent timer, styled buttons
    Evidence: .sisyphus/evidence/task-13-ready-check.png

  Scenario: Ready check buttons hover
    Tool: Playwright
    Steps:
      1. Navigate to ready-check
      2. Hover over Accept button
      3. Take screenshot
      4. Hover over Decline button
      5. Take screenshot
    Expected: Accept shows stronger gold glow, Decline shows subtle hover
    Evidence: .sisyphus/evidence/task-13-ready-check-hover.png
  ```

  **Commit**: YES | Message: `design(ready-check): redesign ready-check with dramatic entrance and gold accents` | Files: `src/routes/connected/ready-check/route.tsx`

- [x] 14. Rediseñar Páginas Restantes (Arena, Clash, Custom, Swiftplay, Create-Lobby, Invites)

  **What to do**:
  1. Leer cada route:
     - `src/routes/connected/arena/route.tsx`
     - `src/routes/connected/clash/route.tsx`
     - `src/routes/connected/custom/route.tsx`
     - `src/routes/connected/swiftplay/route.tsx`
     - `src/routes/connected/create-lobby/route.tsx`
     - `src/routes/connected/invites/route.tsx`
  2. Aplicar rediseño consistente a cada página:
     - Fondo abstracto o de mapa según contexto
     - Layout con PageHeader y Section
     - Cards con glassmorphism
     - Botones y inputs con estilos rediseñados
     - Estados vacíos con EmptyState
     - Estados de carga con LoadingState
  3. Asegurar consistencia visual entre todas las páginas
  4. Mobile responsive para todas

  **Must NOT do**:
  - No cambiar lógica de ninguna página

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Multiple page redesigns
  - Skills: [`react-patterns`] - Reason: Page components
  - Omitted: [`tanstack-router-best-practices`] - Reason: No routing changes

  **Parallelization**: Can Parallel: YES | Wave 6 | Blocks: - | Blocked By: 1, 2, 5, 7

  **References**:
  - Pattern: `src/routes/connected/*/route.tsx` - Cada route
  - Pattern: `src/components/layout/PageHeader.tsx` - Header compartido
  - Pattern: `src/components/layout/Section.tsx` - Section compartido
  - Pattern: `src/components/layout/EmptyState.tsx` - Empty state
  - Pattern: `src/components/layout/LoadingState.tsx` - Loading state

  **Acceptance Criteria**:
  - [ ] Todas las páginas tienen fondo consistente
  - [ ] Todas las páginas usan PageHeader y Section
  - [ ] Estados vacíos usan EmptyState
  - [ ] Estados de carga usan LoadingState
  - [ ] Responsive en mobile y desktop

  **QA Scenarios**:
  ```
  Scenario: Remaining pages visual check
    Tool: Playwright
    Steps:
      1. Navigate to each page: arena, clash, custom, swiftplay, create-lobby, invites
      2. Take screenshot of each at 1440x900
    Expected: Consistent styling with glassmorphism, gold accents, proper spacing
    Evidence: .sisyphus/evidence/task-14-arena.png, task-14-clash.png, etc.
  ```

  **Commit**: YES | Message: `design(pages): redesign remaining pages (arena, clash, custom, swiftplay, create-lobby, invites)` | Files: `src/routes/connected/arena/route.tsx`, `src/routes/connected/clash/route.tsx`, `src/routes/connected/custom/route.tsx`, `src/routes/connected/swiftplay/route.tsx`, `src/routes/connected/create-lobby/route.tsx`, `src/routes/connected/invites/route.tsx`

- [x] 15. Rediseñar Estados y Componentes Misceláneos

  **What to do**:
  1. Rediseñar LandscapeWarning:
     - Overlay con glassmorphism
     - Icono de rotación con animación
     - Mensaje estilizado
  2. Rediseñar debug-toggle:
     - Toggle switch estilizado con dorado
     - Integración sutil en header
  3. Rediseñar estados de loading en todas las páginas:
     - Skeleton screens con shimmer dorado
     - Spinner con estilo LoL
  4. Rediseñar estados de error:
     - Alert con icono y mensaje claro
     - Botón de retry estilizado
  5. Rediseñar estados vacíos:
     - Icono decorativo (poro o similar)
     - Mensaje amigable
     - CTA si aplica
  6. Polish final:
     - Revisar consistencia de espaciado en todas las páginas
     - Verificar que todos los bordes radii sean consistentes
     - Verificar que todos los colores usen tokens
     - Verificar que las sombras sean consistentes
     - Ajustar cualquier detalle visual que falte

  **Must NOT do**:
  - No cambiar lógica de debug o estado

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Polish and miscellaneous
  - Skills: [`react-patterns`] - Reason: Various components
  - Omitted: [`zustand`] - Reason: No state changes

  **Parallelization**: Can Parallel: YES | Wave 6 | Blocks: - | Blocked By: 1, 2, 5, 6, 7

  **References**:
  - Pattern: `src/components/layout/LandscapeWarning.tsx` - Warning actual
  - Pattern: `src/components/debug-toggle.tsx` - Debug toggle
  - Pattern: `src/components/ui/skeleton.tsx` - Skeleton rediseñado
  - Pattern: `src/components/ui/spinner.tsx` - Spinner rediseñado
  - Pattern: `src/components/layout/EmptyState.tsx` - Empty state

  **Acceptance Criteria**:
  - [ ] LandscapeWarning tiene glassmorphism y animación
  - [ ] Debug toggle estilizado sutilmente
  - [ ] Estados de loading muestran skeleton/spinner correctamente
  - [ ] Estados de error muestran Alert estilizado
  - [ ] Polish: consistencia verificada en todas las páginas

  **QA Scenarios**:
  ```
  Scenario: Landscape warning
    Tool: Playwright
    Steps:
      1. Emulate landscape orientation on mobile
      2. Take screenshot
    Expected: Overlay with glassmorphism, rotation icon, styled message
    Evidence: .sisyphus/evidence/task-15-landscape.png

  Scenario: Loading state
    Tool: Playwright
    Steps:
      1. Navigate to any page
      2. Trigger loading state
      3. Take screenshot
    Expected: Shows skeleton with gold shimmer or spinner
    Evidence: .sisyphus/evidence/task-15-loading.png
  ```

  **Commit**: YES | Message: `design(polish): redesign misc states and final polish` | Files: `src/components/layout/LandscapeWarning.tsx`, `src/components/debug-toggle.tsx`, various pages with loading/error states

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [x] F1. Plan Compliance Audit — oracle
  - Verificar que todas las tareas del plan fueron completadas
  - Verificar que no se cambió lógica de negocio
  - Verificar que se usaron tokens en lugar de hardcode
  - Verificar que no se agregaron dependencias no aprobadas

- [x] F2. Code Quality Review — unspecified-high
  - Verificar consistencia de estilos entre componentes
  - Verificar que no hay código duplicado
  - Verificar que los componentes siguen principios de React 19
  - Verificar accesibilidad (aria-labels, focus, contrast)

- [x] F3. Real Manual QA — unspecified-high + playwright
  - Screenshots de TODAS las páginas en 3 viewports (390x844, 768x1024, 1440x900)
  - Verificación de interacciones: clicks, forms, keyboard navigation
  - Verificación de responsive: no overflow horizontal
  - Verificación de animaciones: hover effects, transitions
  - Verificación de reduced-motion

- [x] F4. Scope Fidelity Check — deep
  - Verificar que el scope se mantuvo (solo cambios visuales)
  - Verificar que no se agregaron features nuevas
  - Verificar que no se modificaron rutas o lógica
  - Verificar que los assets son locales existentes

## Commit Strategy
- Commits atómicos por task (uno por task)
- Mensajes en inglés, formato: `design(scope): description`
- Ejemplos:
  - `design(tokens): extend design system with modern LoL tokens`
  - `design(ui): redesign Button, Card, Input, Badge primitives`
  - `design(lobby): redesign lobby page with map background`
- No commits de "WIP" o "fix"
- Cada commit debe dejar la app en estado funcional

## Success Criteria
- [ ] Toda la app tiene estética moderna y consistente
- [ ] La app mantiene toda la funcionalidad existente
- [ ] Responsive en mobile, tablet, desktop
- [ ] Animaciones fluidas con soporte para reduced-motion
- [ ] Accesibilidad preservada (focus, contrast, aria)
- [ ] Build exitoso sin errores
- [ ] Screenshots before/after muestran mejora visual clara
- [ ] Usuario aprueba el resultado final
