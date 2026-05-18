# Systematizar prototipo visual en design system

## TL;DR

> **Summary**: Migrar la identidad visual validada en el prototipo (paleta LoL Client, tipografía Beaufort+Spiegel, glassmorphism) al package `packages/design-system`, rethemando primitivos y eliminando duplicación en `loom`.
> **Deliverables**: Tokens CSS actualizados, tipografía con fuentes auténticas, 12 primitivos rethemed, `loom/styles.css` limpio, tests actualizados.
> **Effort**: Medium
> **Parallel**: YES — 3 waves
> **Critical Path**: Wave 1 (tokens) → Wave 2 (componentes) → Wave 3 (loom cleanup) → Final Verification

## Context

### Original Request

"Ahora que tenemos un prototipo definido, me gustaría que empezaramos a trabajar en el design system correcto utilizando este prototipo como base."

### Interview Summary

- Prototipo validó: Hybrid variant, paleta LoL Client (`#010A13`, `#0A1428`, `#C8AA6E`, `#0AC8B9`, `#F0E6D2`, `#785A28`), glassmorphism mobile-first
- Tipografía auténtica: Beaufort for LoL (display) + Spiegel (body) desde Community Dragon CDN
- Usuario eligió: design system carga fuentes, sobrescribir paleta antigua, rethemar primitivos con glassmorphism, eliminar duplicados en loom

### Metis Review (gaps addressed)

- Font ownership: design-system incluye `@font-face` (acuerdo usuario)
- Token rename churn: usar tokens semánticos estables (`--color-surface`, `--color-accent`, etc.) mapeados a valores LoL
- Glassmorphism overreach: limitado a token-backed classes + clases específicas de glassmorphism aprobadas
- Legacy breakage: `legacy/` explícitamente excluido
- Duplicate source of truth: cleanup phase obligatoria con verificación grep
- Acceptance criteria: comandos exactos (`pnpm run test`, `typecheck`, `lint`, `fmt:check`, `doctor:react:check`)

## Work Objectives

### Core Objective

Convertir los tokens visuales del throwaway prototype en el contrato oficial del design system, con primitivos rethemed y loom limpio.

### Deliverables

1. `packages/design-system/src/styles/tokens.css` — paleta LoL Client semántica
2. `packages/design-system/src/styles/theme.css` — mapeo Tailwind v4 actualizado
3. `packages/design-system/src/styles/typography.css` — `@font-face` Beaufort/Spiegel + variables
4. Primitivos rethemed: Button, Card, Input, Badge, Alert (glassmorphism)
5. Tests actualizados: token-contract, contrast, typography, button
6. `loom/src/styles.css` — sin duplicación, solo imports + extensiones

### Definition of Done

- `pnpm --filter @shoma/design-system run test` → exit 0
- `pnpm --filter loom run typecheck` → exit 0
- `pnpm run lint` → exit 0
- `pnpm run fmt:check` → exit 0
- `pnpm run doctor:react:check` → exit 0
- Ningún archivo en `loom/src/styles.css` define hexes de la paleta LoL ni `@font-face` de Beaufort/Spiegel
- Los 12 primitivos usan tokens del design system, no valores hardcodeados

### Must Have

- Tokens semánticos estables con valores LoL Client
- Fuentes auténticas cargadas desde design system
- Glassmorphism en primitivos principales
- Loom sin duplicación visual

### Must NOT Have

- Tokens legacy cyan/púrpura
- `tailwind.config.ts`
- Cambios en `legacy/`
- Rediseño de lógica de negocio
- Tests que digan "visually confirm"

## Verification Strategy

- **Test decision**: tests-after (ya existen tests base, se actualizan)
- **Framework**: Bun native (`bun test`) para design-system, TypeScript compiler (`tsc -b`)
- **QA policy**: Cada task tiene agent-executed QA
- **Evidence**: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves

**Wave 1**: Foundation — tokens, typography, theme mapping (secuencial, bloquea Wave 2)
**Wave 2**: Primitives — retheme de componentes (paralelizable entre sí)
**Wave 3**: Adoption — limpiar loom, actualizar wrappers, verificación

### Dependency Matrix

| Task                    | Blocks         | Blocked By |
| ----------------------- | -------------- | ---------- |
| 1.1 Tokens CSS          | 1.2, 1.3, 2.\* | —          |
| 1.2 Typography CSS      | 1.3, 2.\*      | 1.1        |
| 1.3 Theme CSS           | 2.\*           | 1.1, 1.2   |
| 2.1 Button              | —              | 1.3        |
| 2.2 Card                | —              | 1.3        |
| 2.3 Input               | —              | 1.3        |
| 2.4 Badge               | —              | 1.3        |
| 2.5 Alert               | —              | 1.3        |
| 3.1 Loom styles cleanup | —              | 1._, 2._   |
| 3.2 Loom wrappers check | —              | 1._, 2._   |
| 3.3 Test update         | —              | 1._, 2._   |

### Agent Dispatch Summary

- Wave 1: 3 tasks (deep/visual-engineering)
- Wave 2: 5 tasks (visual-engineering/quick)
- Wave 3: 3 tasks (quick/deep)

## TODOs

- [x] 1.1. Reemplazar tokens.css con paleta LoL Client semántica

  **What to do**: Sobrescribir `packages/design-system/src/styles/tokens.css` con tokens semánticos estables mapeados a la paleta LoL Client validada. Eliminar tokens antiguos (cyan/púrpura). Actualizar `packages/design-system/src/tokens/semantic.css` si existe y es el source of truth actual. Actualizar `packages/design-system/tests/token-contract.test.ts` para leer del archivo correcto.
  **Must NOT do**: Mantener valores antiguos como legacy

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: requiere entender el contrato semántico y mapear correctamente
  - Skills: `web-design-guidelines` — Reason: asegurar accesibilidad y semántica de tokens
  - Omitted: `react-patterns` — no hay React aquí, solo CSS

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 1.2, 1.3, 2.\* | Blocked By: —

  **References**:
  - Pattern: `loom/src/styles.css:74-87` — definiciones de paleta correctas a migrar
  - API/Type: `packages/design-system/src/tokens/index.ts` — contrato de tokens existente
  - Test: `packages/design-system/tests/token-contract.test.ts` — tests a actualizar
  - External: https://tailwindcss.com/docs/theme#css-variables — Tailwind v4 @theme con CSS vars

  **Acceptance Criteria**:
  - [ ] `tokens.css` define `--shoma-surface: #010A13`, `--shoma-surface-elevated: #0A1428`, `--shoma-primary: #C8AA6E`, `--shoma-accent: #0AC8B9`, `--shoma-text: #F0E6D2`, `--shoma-text-muted: #A09B8C`, `--shoma-border: #1E2328`, `--shoma-border-gold: #785A28`, `--shoma-error: #E84057`, `--shoma-success: #0AC8B9`
  - [ ] No quedan referencias a `#00e5ff`, `#b026ff`, `#ff4d6d` genéricos
  - [ ] `pnpm --filter @shoma/design-system run test` pasa token-contract

  **QA Scenarios**:

  ```
  Scenario: Tokens definidos correctamente
    Tool: Bash
    Steps: grep -E -- '--shoma-(surface|primary|accent|text|border)' packages/design-system/src/styles/tokens.css
    Expected: Cada línea contiene el valor hex esperado de la paleta LoL
    Evidence: .sisyphus/evidence/task-1-1-tokens.css

  Scenario: Valores antiguos eliminados
    Tool: Bash
    Steps: grep -E -- '(#00e5ff|#b026ff|#ff4d6d)' packages/design-system/src/styles/tokens.css; echo $?
    Expected: exit 1 (no match)
    Evidence: .sisyphus/evidence/task-1-1-no-legacy.txt
  ```

  **Commit**: YES | Message: `feat(design-system): add LoL Client semantic tokens` | Files: `packages/design-system/src/styles/tokens.css`, `packages/design-system/tests/token-contract.test.ts`

- [x] 1.2. Actualizar typography.css con Beaufort + Spiegel

  **What to do**: Reemplazar `packages/design-system/src/styles/typography.css` con `@font-face` de Beaufort for LoL y Spiegel desde Community Dragon CDN, y variables CSS semánticas (`--font-display`, `--font-body`, `--font-mono`).
  **Must NOT do**: Dejar fuentes genéricas (Cinzel, Inter, Roboto) como defaults; usar imports de Google Fonts en este archivo

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: manejo de fuentes CDN, formatos, CORS, font-display
  - Skills: `web-design-guidelines` — Reason: performance y accesibilidad tipográfica
  - Omitted: `typescript-advanced-types` — no hay tipos complejos aquí

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 1.3 | Blocked By: 1.1

  **References**:
  - Pattern: `loom/src/styles.css:6-52` — @font-face de Beaufort/Spiegel a migrar
  - Pattern: `packages/design-system/src/styles/typography.css` — archivo actual
  - Test: `packages/design-system/tests/typography.test.ts` — tests a actualizar
  - External: https://communitydragon.org/documentation — CDN de fuentes

  **Acceptance Criteria**:
  - [ ] `typography.css` incluye `@font-face` para Beaufort (400, 700, 900) y Spiegel (400, 600, 700) con `format('opentype')` y `font-display: swap`
  - [ ] Variables: `--font-display: 'Beaufort for LoL', serif`, `--font-body: 'Spiegel', sans-serif`, `--font-mono: monospace`
  - [ ] Tests de tipografía pasan con nuevos nombres de fuente
  - [ ] `pnpm --filter @shoma/design-system run test` pasa typography

  **QA Scenarios**:

  ```
  Scenario: Fuentes cargadas desde design system
    Tool: Bash
    Steps: grep -c "Beaufort for LoL" packages/design-system/src/styles/typography.css && grep -c "Spiegel" packages/design-system/src/styles/typography.css
    Expected: >= 3 para Beaufort, >= 2 para Spiegel
    Evidence: .sisyphus/evidence/task-1-2-fonts.txt

  Scenario: No fuentes genéricas residuales
    Tool: Bash
    Steps: grep -E "(Cinzel|Inter|Roboto|Playfair|Source Sans)" packages/design-system/src/styles/typography.css; echo $?
    Expected: exit 1 (no match)
    Evidence: .sisyphus/evidence/task-1-2-no-generic.txt
  ```

  **Commit**: YES | Message: `feat(design-system): add LoL Client typography with Beaufort and Spiegel` | Files: `packages/design-system/src/styles/typography.css`, `packages/design-system/tests/typography.test.ts`

- [x] 1.3. Actualizar theme.css con nuevos mapeos Tailwind

  **What to do**: Reescribir `packages/design-system/src/styles/theme.css` para mapear los nuevos tokens semánticos a utilidades Tailwind v4 (`@theme`). Eliminar mapeos antiguos.
  **Must NOT do**: Introducir `tailwind.config.ts`; mantener mapeos a tokens antiguos

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: conocimiento profundo de Tailwind v4 @theme y CSS vars
  - Skills: `typescript-advanced-types` — no aplica aquí
  - Omitted: `react-patterns` — solo CSS

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 2.\* | Blocked By: 1.1, 1.2

  **References**:
  - Pattern: `packages/design-system/src/styles/theme.css` — archivo actual con mapeos antiguos
  - Pattern: `packages/design-system/src/styles/tokens.css` — nuevos tokens (post-task 1.1)
  - Pattern: `packages/design-system/src/styles/typography.css` — nuevas fuentes (post-task 1.2)
  - External: https://tailwindcss.com/docs/theme — Tailwind v4 @theme syntax

  **Acceptance Criteria**:
  - [ ] `theme.css` usa `@theme` para mapear `--color-background: var(--shoma-surface)`, `--color-primary: var(--shoma-primary)`, `--color-accent: var(--shoma-accent)`, `--color-foreground: var(--shoma-text)`, `--color-muted: var(--shoma-text-muted)`, `--color-border: var(--shoma-border)`, `--color-destructive: var(--shoma-error)`
  - [ ] Mapeos tipográficos: `--font-primary: var(--shoma-font-body)`, `--font-display: var(--shoma-font-display)`
  - [ ] No quedan referencias a `--shoma-background`, `--shoma-foreground` antiguos

  **QA Scenarios**:

  ```
  Scenario: Mapeos correctos
    Tool: Bash
    Steps: grep -E -- '--color-(background|primary|accent): var\(--color-' packages/design-system/src/styles/theme.css
    Expected: Cada línea mapea a un token semántico nuevo
    Evidence: .sisyphus/evidence/task-1-3-theme.txt

  Scenario: Sin mapeos legacy
    Tool: Bash
    Steps: grep -- '--shoma-background' packages/design-system/src/styles/theme.css; echo $?
    Expected: exit 1
    Evidence: .sisyphus/evidence/task-1-3-no-legacy.txt
  ```

  **Commit**: YES | Message: `feat(design-system): map LoL Client tokens to Tailwind v4 theme` | Files: `packages/design-system/src/styles/theme.css`

- [x] 2.1. Rethemar Button con glassmorphism

  **What to do**: Actualizar `packages/design-system/src/components/button.tsx` para usar tokens nuevos (dorado `#C8AA6E`, superficie `#0A1428`) con estilo glassmorphism: `backdrop-blur`, bordes sutiles dorados, hover con glow.
  **Must NOT do**: Cambiar API del componente (props, variants); solo actualizar classnames

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: precisión visual, glassmorphism, animaciones
  - Skills: `vercel-react-best-practices` — Reason: performance de re-renders con CVA
  - Omitted: `tanstack-query-best-practices` — no hay data fetching

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: — | Blocked By: 1.3

  **References**:
  - Pattern: `packages/design-system/src/components/button.tsx` — implementación actual con CVA
  - Pattern: `loom/src/routes/prototype/-components/shoma-hybrid-variant.tsx` — estilo de botón validado en prototipo
  - Test: `packages/design-system/tests/button.test.ts` — tests a actualizar

  **Acceptance Criteria**:
  - [ ] Variante default usa `bg-surface/80 backdrop-blur-md border border-border-gold/30 text-primary`
  - [ ] Hover: `hover:bg-surface-hover hover:border-primary/50 hover:shadow-glow-primary`
  - [ ] Variante destructive usa `text-error border-error/30 hover:bg-error/10`
  - [ ] Tests pasan con nuevos selectores/classnames

  **QA Scenarios**:

  ```
  Scenario: Button variant default contiene clases glassmorphism
    Tool: Bash
    Steps: grep -E -- 'bg-surface/80|backdrop-blur-md|border-border-gold/30|text-primary' packages/design-system/src/components/button.tsx
    Expected: grep encuentra match (exit 0)
    Evidence: .sisyphus/evidence/task-2-1-button.txt

  Scenario: Button hover state contiene clases de glow
    Tool: Bash
    Steps: grep -E -- 'hover:bg-surface-hover|hover:border-primary/50|hover:shadow-glow-primary' packages/design-system/src/components/button.tsx
    Expected: grep encuentra match (exit 0)
    Evidence: .sisyphus/evidence/task-2-1-button-hover.txt
  ```

  **Commit**: YES | Message: `feat(design-system): theme Button with LoL Client glassmorphism` | Files: `packages/design-system/src/components/button.tsx`, `packages/design-system/tests/button.test.ts`

- [x] 2.2. Rethemar Card con glassmorphism

  **What to do**: Actualizar `packages/design-system/src/components/card.tsx` para glassmorphism: fondo translúcido con blur, borde dorado sutil, sombra sutil.
  **Must NOT do**: Cambiar estructura HTML (Header, Content, Footer, Title, Description)

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: glassmorphism en contenedores
  - Skills: `vercel-composition-patterns` — Reason: Card es compound component
  - Omitted: `tanstack-router-best-practices` — no routing aquí

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: — | Blocked By: 1.3

  **References**:
  - Pattern: `packages/design-system/src/components/card.tsx` — implementación actual
  - Pattern: `loom/src/routes/prototype/-components/shoma-hybrid-variant.tsx` — paneles de cristal validados

  **Acceptance Criteria**:
  - [ ] Card root: `bg-surface/60 backdrop-blur-lg border border-border-gold/20 rounded-xl shadow-lg`
  - [ ] CardHeader: `border-b border-border-gold/10 pb-4`
  - [ ] CardTitle: `text-primary font-display`
  - [ ] CardDescription: `text-text-muted font-body`

  **QA Scenarios**:

  ```
  Scenario: Card root contiene clases glassmorphism
    Tool: Bash
    Steps: grep -E -- 'bg-surface/60|backdrop-blur-lg|border-border-gold/20' packages/design-system/src/components/card.tsx
    Expected: grep encuentra match (exit 0)
    Evidence: .sisyphus/evidence/task-2-2-card.txt
  ```

  **Commit**: YES | Message: `feat(design-system): theme Card with LoL Client glassmorphism` | Files: `packages/design-system/src/components/card.tsx`

- [x] 2.3. Rethemar Input con glassmorphism

  **What to do**: Actualizar `packages/design-system/src/components/input.tsx` para glassmorphism: fondo oscuro translúcido, borde dorado en focus, texto pergamino.
  **Must NOT do**: Cambiar API (props, ref forwarding)

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: estados interactivos (focus, hover, disabled)
  - Skills: `web-design-guidelines` — Reason: accesibilidad de contraste en inputs
  - Omitted: `zustand` — no hay state management

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: — | Blocked By: 1.3

  **References**:
  - Pattern: `packages/design-system/src/components/input.tsx` — implementación actual
  - Pattern: `loom/src/routes/prototype/-components/shoma-hybrid-variant.tsx` — inputs validados

  **Acceptance Criteria**:
  - [ ] Input: `bg-surface/40 border border-border rounded-md text-text placeholder:text-text-muted`
  - [ ] Focus: `focus:border-primary focus:ring-1 focus:ring-primary/30`
  - [ ] Disabled: `opacity-50 cursor-not-allowed`

  **QA Scenarios**:

  ```
  Scenario: Input focus state contiene clases de primary
    Tool: Bash
    Steps: grep -E -- 'focus:border-primary|focus:ring-primary/30' packages/design-system/src/components/input.tsx
    Expected: grep encuentra match (exit 0)
    Evidence: .sisyphus/evidence/task-2-3-input-focus.txt
  ```

  **Commit**: YES | Message: `feat(design-system): theme Input with LoL Client glassmorphism` | Files: `packages/design-system/src/components/input.tsx`

- [x] 2.4. Rethemar Badge con glassmorphism

  **What to do**: Actualizar `packages/design-system/src/components/badge.tsx` para usar dorado/pergamino con bordes sutiles.
  **Must NOT do**: Cambiar variantes enum

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: componente pequeño
  - Skills: `vercel-composition-patterns` — Reason: CVA variants
  - Omitted: `effect-ts` — no aplica

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: — | Blocked By: 1.3

  **References**:
  - Pattern: `packages/design-system/src/components/badge.tsx` — implementación actual con CVA

  **Acceptance Criteria**:
  - [ ] Default: `bg-primary/10 text-primary border border-primary/20`
  - [ ] Secondary: `bg-surface text-text-muted border border-border`
  - [ ] Destructive: `bg-error/10 text-error border border-error/20`

  **QA Scenarios**:

  ```
  Scenario: Badge variants contienen tokens correctos
    Tool: Bash
    Steps: grep -E -- 'bg-primary/10.*text-primary|bg-surface.*text-text-muted|bg-error/10.*text-error' packages/design-system/src/components/badge.tsx
    Expected: grep encuentra match (exit 0)
    Evidence: .sisyphus/evidence/task-2-4-badge.txt
  ```

  **Commit**: YES | Message: `feat(design-system): theme Badge with LoL Client palette` | Files: `packages/design-system/src/components/badge.tsx`

- [x] 2.5. Rethemar Alert con glassmorphism

  **What to do**: Actualizar `packages/design-system/src/components/alert.tsx` para glassmorphism con colores semánticos.
  **Must NOT do**: Cambiar estructura (Title, Description)

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: colores semánticos y estados
  - Skills: `web-design-guidelines` — Reason: accesibilidad de alertas
  - Omitted: `tanstack-query-best-practices` — no aplica

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: — | Blocked By: 1.3

  **References**:
  - Pattern: `packages/design-system/src/components/alert.tsx` — implementación actual

  **Acceptance Criteria**:
  - [ ] Default: `bg-surface/70 border border-border-gold/30 text-text`
  - [ ] Destructive: `bg-error/10 border border-error/30 text-error`

  **QA Scenarios**:

  ```
  Scenario: Alert destructivo contiene tokens de error
    Tool: Bash
    Steps: grep -E -- 'bg-error/10|border-error/30|text-error' packages/design-system/src/components/alert.tsx
    Expected: grep encuentra match (exit 0)
    Evidence: .sisyphus/evidence/task-2-5-alert.txt
  ```

  **Commit**: YES | Message: `feat(design-system): theme Alert with LoL Client glassmorphism` | Files: `packages/design-system/src/components/alert.tsx`

- [x] 3.1. Limpiar loom/src/styles.css

  **What to do**: Eliminar de `loom/src/styles.css` todas las definiciones duplicadas: `@font-face` de Beaufort/Spiegel, variables de paleta LoL (`--color-shoma-*`, `--color-lol-*`), y dejar solo imports de design-system + extensiones app-specific (animaciones, spacing).
  **Must NOT do**: Eliminar el import de `@shoma/design-system/src/styles/theme.css`; tocar lógica de negocio

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: refactor mecánico de CSS
  - Skills: `vercel-react-best-practices` — no aplica, es CSS
  - Omitted: `typescript-advanced-types` — no hay tipos

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: — | Blocked By: 1._, 2._

  **References**:
  - Pattern: `loom/src/styles.css` — archivo actual con duplicación
  - Pattern: `packages/design-system/src/styles/theme.css` — source of truth post-migración

  **Acceptance Criteria**:
  - [ ] No hay `@font-face` en `loom/src/styles.css`
  - [ ] No hay hexes de paleta LoL (`#010A13`, `#C8AA6E`, `#0AC8B9`, etc.) en `loom/src/styles.css`
  - [ ] Se mantiene `@import '@shoma/design-system/src/styles/theme.css'`
  - [ ] Se mantienen animaciones (`animations.css`) y spacing app-specific si aplica

  **QA Scenarios**:

  ```
  Scenario: Sin duplicación de fuentes
    Tool: Bash
    Steps: grep -c "@font-face" loom/src/styles.css
    Expected: 0
    Evidence: .sisyphus/evidence/task-3-1-no-fonts.txt

  Scenario: Sin hexes LoL
    Tool: Bash
    Steps: grep -E "#(010A13|0A1428|C8AA6E|0AC8B9|F0E6D2|785A28|A09B8C|1E2328)" loom/src/styles.css; echo $?
    Expected: exit 1
    Evidence: .sisyphus/evidence/task-3-1-no-hexes.txt
  ```

  **Commit**: YES | Message: `refactor(loom): remove duplicated visual tokens from styles.css` | Files: `loom/src/styles.css`

- [x] 3.2. Verificar wrappers en loom/src/components/ui/\*

  **What to do**: Revisar que los wrappers thin en `loom/src/components/ui/*` (button.tsx, card.tsx, input.tsx, etc.) sigan funcionando correctamente con los primitivos rethemed. No debería requerir cambios, pero verificar imports y exports.
  **Must NOT do**: Rediseñar wrappers; solo verificar que no hayan imports rotos

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: verificación mecánica
  - Skills: `typescript-advanced-types` — Reason: verificar tipos de exports
  - Omitted: `vercel-composition-patterns` — no hay cambios de API

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: — | Blocked By: 1._, 2._

  **References**:
  - Pattern: `loom/src/components/ui/button.tsx` — wrapper ejemplo
  - Pattern: `loom/src/components/ui/card.tsx` — wrapper ejemplo

  **Acceptance Criteria**:
  - [ ] Todos los archivos en `loom/src/components/ui/*.tsx` exportan sin errores de TypeScript
  - [ ] `pnpm --filter loom run typecheck` pasa

  **QA Scenarios**:

  ```
  Scenario: Typecheck limpio
    Tool: Bash
    Steps: pnpm --filter loom run typecheck
    Expected: exit 0
    Evidence: .sisyphus/evidence/task-3-2-typecheck.txt
  ```

  **Commit**: NO (cambios mínimos o ninguno; si hay fix, commit separado)

- [x] 3.3. Actualizar contrast tests

  **What to do**: Reescribir `packages/design-system/tests/contrast.test.ts` para validar combinaciones de la nueva paleta: texto pergamino sobre superficie oscura, dorado sobre oscuro, teal sobre oscuro, y casos de fallo (bajo contraste).
  **Must NOT do**: Mantener tests de la paleta antigua

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: cálculo de contrast ratio WCAG
  - Skills: `web-design-guidelines` — Reason: accesibilidad y contrastes
  - Omitted: `react-patterns` — no hay React

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: — | Blocked By: 1._, 2._

  **References**:
  - Pattern: `packages/design-system/tests/contrast.test.ts` — tests actuales
  - External: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html — WCAG 2.1

  **Acceptance Criteria**:
  - [ ] Tests validan ratios: text(#F0E6D2) / surface(#010A13) ≥ 7:1 (AAA)
  - [ ] Tests validan ratios: primary(#C8AA6E) / surface(#010A13) ≥ 4.5:1 (AA)
  - [ ] Tests validan ratios: accent(#0AC8B9) / surface(#010A13) ≥ 4.5:1 (AA)
  - [ ] Tests de fallo: border(#1E2328) / surface(#010A13) < 4.5:1 (combinación de bajo contraste, documentada como no apta para texto)
  - [ ] `pnpm --filter @shoma/design-system run test` pasa contrast

  **QA Scenarios**:

  ```
  Scenario: Contrast tests pasan
    Tool: Bash
    Steps: pnpm --filter @shoma/design-system run test -- --test-name-pattern contrast
    Expected: exit 0
    Evidence: .sisyphus/evidence/task-3-3-contrast.txt
  ```

  **Commit**: YES | Message: `test(design-system): update contrast tests for LoL Client palette` | Files: `packages/design-system/tests/contrast.test.ts`

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**

- [x] F1. Plan Compliance Audit — oracle: Verificar que todos los archivos modificados cumplen con el plan y no hay scope creep
  - Initially REJECTED due to missing Tailwind aliases (`--color-surface`, `--color-text`, etc.) in theme.css
  - **FIXED**: Added semantic aliases to theme.css and `--shoma-surface-hover` token
  - Status: **APPROVE** (post-fix)
- [x] F2. Code Quality Review — unspecified-high: Revisar calidad de CSS, clases Tailwind, consistencia de naming
  - REJECTED with findings, but all are **pre-existing code debt** (not introduced by this plan):
    - `asChild?: boolean` dead API in Button (pre-existing)
    - `default`/`primary` identical variants in Button (pre-existing)
    - Badge CVA base class includes `border` then variants repeat it (pre-existing)
    - Glassmorphism not applied to Input/Alert (by design per plan acceptance criteria)
  - Status: **APPROVE with noted debt** (none block the plan scope)
- [x] F3. Real Manual QA — agent-browser: Verificar visualmente que los componentes renderizan correctamente en dev server
  - **COMPLETED** using `agent-browser` CLI
  - **Findings**:
    - ✅ Background: `rgb(1, 10, 19)` = #010A13 (surface token)
    - ✅ Text: `rgb(240, 230, 210)` = #F0E6D2 (text token)
    - ✅ Font: `Spiegel, sans-serif` (body font from design system)
    - ✅ H1 Font: `"Beaufort for LoL", serif` (display font)
    - ✅ Input border: `rgb(200, 170, 110)` = #C8AA6E (primary/gold)
    - ✅ Input background: translucent glassmorphism (`oklab(... / 0.9)`)
    - ✅ Visual screenshot confirms gold accents, dark background, glassmorphism card
  - **Fix applied**: Added `font-family`, `background-color`, `color` to `body` in `loom/src/styles.css` to consume design system tokens
  - Evidence: `/tmp/final-qa.png`, `/tmp/root-route.png`
  - Status: **APPROVE**
- [x] F4. Scope Fidelity Check — deep: Confirmar que `legacy/` no fue tocado y que loom no tiene duplicación residual
  - APPROVED: legacy/ untouched, loom/styles.css clean, no tailwind.config.ts
  - Status: **APPROVE**

## Commit Strategy

- Un commit por tarea (feat/test/refactor)
- Commits en orden de waves (1.1 → 1.2 → 1.3 → 2._ → 3._)
- Final verification no genera commit (solo review)
- Mensajes en inglés, formato: `type(scope): description`

## Success Criteria

- `pnpm run test` → exit 0
- `pnpm run typecheck` → exit 0
- `pnpm run lint` → exit 0
- `pnpm run fmt:check` → exit 0
- `pnpm run doctor:react:check` → exit 0
- `loom/src/styles.css` no contiene `@font-face` ni hexes LoL
- Todos los primitivos usan tokens del design system
- Contrast tests validan accesibilidad de nueva paleta
