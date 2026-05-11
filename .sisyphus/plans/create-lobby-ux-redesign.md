# Create Lobby UX Redesign: Visual Grid + Bottom Sheet

## TL;DR
> **Summary**: Rediseñar la pantalla `/connected/create-lobby` para eliminar scroll obligatorio usando un grid visual de modos de juego (2×2/2×3) y un Bottom Sheet que muestra las colas específicas de cada modo.
> **Deliverables**: Route refactorizado, nuevas keys i18n (en/es), QA con agent-browser en viewports móviles.
> **Effort**: Short
> **Parallel**: NO - secuencial por dependencias de UI
> **Critical Path**: T1 (estructura de datos) → T2 (grid de modos) → T3 (bottom sheet + mutación) → T4 (traducciones + QA)

## Context
### Original Request
El usuario solicita mejoras de UX para la pantalla de creación de lobby, enfocadas en evitar scroll y centralizar información en un mismo punto de vista.

### Interview Summary
- Se analizó la UI actual con agent-browser: lista vertical de cards de ~130px, 10+ colas en 4 secciones, scroll obligatorio.
- Se identificaron problemas: baja densidad de información, CTA dispersos, IDs técnicos visibles, espaciado excesivo.
- Se propusieron 3 opciones; el usuario eligió **Opción 2: Grid visual + Bottom Sheet**.

### Metis Review (gaps addressed)
- **Guardrail**: Scope restringido a `create-lobby/route.tsx` + i18n. No redesign de shell, navegación ni otros routes.
- **Accesibilidad**: Las mode cards deben ser `<button>` semánticos, no `<div>` clickeables.
- **Viewport**: "Sin scroll" significa que en 390×844 (iPhone 14) y 360×640 (viewport pequeño) todas las opciones principales son visibles sin scroll.
- **Estados**: Se requiere estado de carga y error para la mutación de creación de lobby.
- **Prevención de duplicados**: Deshabilitar acciones mientras `createLobbyMutation.isPending`.
- **Queue IDs**: Ocultar completamente del UI; mantener solo en data layer.
- **Sheet scroll**: El contenido del Bottom Sheet SÍ puede hacer scroll si hay muchas colas en un modo (e.g., Summoner's Rift tiene ~3 colas).

## Work Objectives
### Core Objective
Transformar la pantalla de creación de lobby de un patrón "lista vertical de acciones" a un patrón "categorización visual + selección detallada", eliminando scroll obligatorio en viewport móvil estándar.

### Deliverables
1. `apps/web-next/src/routes/connected/create-lobby/route.tsx` refactorizado
2. Nuevas keys de i18n en `src/i18n/translations/en.ts` y `es.ts`
3. Screenshots de QA antes/después con agent-browser

### Definition of Done
- [x] En viewport 390×844, todas las mode cards son visibles sin scroll vertical de página
- [x] En viewport 360×640, todas las mode cards son visibles sin scroll vertical de página
- [x] Tapping una mode card abre el Bottom Sheet con las colas de ese modo
- [x] Las colas muestran nombres localizados, NO IDs técnicos (400, 420, etc.)
- [x] Tapping una cola dispara exactamente una solicitud de creación
- [x] Mientras está pending, las acciones están deshabilitadas (previene duplicados)
- [x] Escape, backdrop click, o swipe-down cierran el sheet y retornan focus
- [x] Traducciones en inglés y español están actualizadas
- [x] `typecheck` y `lint` pasan sin errores

### Must Have
- Grid visual de modos con iconos/labels localizados
- Bottom Sheet reutilizando el componente existente `BottomSheet`
- Estados loading/error para la mutación
- Accesibilidad: semantic buttons, focus trap, aria labels
- Ocultar queue IDs del UI

### Must NOT Have
- No introducir nueva librería de animación o sheet
- No modificar AppShell, header, layout general, ni otros routes
- No agregar búsqueda/filtro de colas
- No modificar la API o data fetching (las queries existentes se mantienen)
- No agregar nuevos assets/imágenes (usar gradientes, iconos existentes o letras)

## Verification Strategy
- **Test decision**: tests-after (no hay tests unitarios específicos para esta route; se agregarán si el usuario lo solicita posteriormente)
- **QA policy**: Agent-executed QA con agent-browser. Screenshots en viewports móviles.
- **Evidence**: `.sisyphus/evidence/task-{N}-{slug}.png`

## Execution Strategy
### Parallel Execution Waves
Wave 1: Refactor del route + componente grid de modos + bottom sheet
Wave 2: Traducciones i18n + QA con agent-browser

### Dependency Matrix
| Task | Depends On | Blocks |
|------|-----------|--------|
| T1 | - | T2, T3 |
| T2 | T1 | T3 |
| T3 | T1, T2 | T4 |
| T4 | T3 | F1-F4 |
| F1-F4 | T4 | - |

### Agent Dispatch Summary
| Wave | Tasks | Category | Skills |
|------|-------|----------|--------|
| 1 | T1, T2, T3 | visual-engineering | frontend-ui-ux, vercel-react-best-practices, web-design-guidelines |
| 2 | T4 | quick | agent-browser-automation |
| Final | F1-F4 | deep / oracle / unspecified-high | review-work |

## TODOs

- [x] T1. Estructurar datos de modos y colas

  **What to do**: 
  - En `create-lobby/route.tsx`, reemplazar la lógica de `sections` + `availableQueues` por una estructura que agrupe colas por **modo visual** (no por mapId-gameMode crudo).
  - Definir los modos principales: `Summoner's Rift`, `ARAM`, `TFT`, `Arena/Rotating` (CHERRY, RGM).
  - Mapear cada `queue.id` a su modo visual correspondiente.
  - Ordenar los modos: SR primero (por ser el default), luego ARAM, TFT, luego rotativos.
  - Remover `queue.id` de cualquier renderizado visible.

  **Must NOT do**: 
  - No modificar las queries (`queuesQuery`, `enabledQueuesQuery`, etc.); solo transformar su output.
  - No hardcodear queue IDs en el componente; usar la data de la API pero clasificarla.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: UI refactor con data transformation
  - Skills: `frontend-ui-ux`, `typescript-advanced-types` - Reason: tipado estricto de la nueva estructura
  - Omitted: `agent-browser-automation` - Reason: no se necesita aún

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: T2, T3 | Blocked By: -

  **References**:
  - Pattern: `src/routes/connected/create-lobby/route.tsx:42-96` - lógica actual de filtrado y sorting
  - API/Type: `src/core/lcu/parsers/game-queues.ts` - tipo `GameQueue`
  - Component: `src/components/ui/bottom-sheet.tsx` - componente existente a reutilizar
  - External: https://tailwindcss.com/docs/grid-template-columns - grid layout

  **Acceptance Criteria**:
  - [ ] `typecheck` pasa sin errores en el route modificado
  - [ ] El tipo de la nueva estructura de modos está definido y usado

  **QA Scenarios**:
  ```
  Scenario: Data structure correctness
    Tool: Bash
    Steps: grep -n "type ModeGroup\|interface ModeGroup\|type ModeCard" src/routes/connected/create-lobby/route.tsx
    Expected: Se define un tipo/interface para agrupar modos
    Evidence: .sisyphus/evidence/task-1-data-structure.txt
  ```

  **Commit**: YES | Message: `refactor(create-lobby): group queues by visual mode` | Files: `src/routes/connected/create-lobby/route.tsx`

- [x] T2. Implementar grid visual de modos

  **What to do**: 
  - Renderizar un grid CSS (`grid grid-cols-2 gap-3` o `gap-4`) con cards rectangulares para cada modo.
  - Cada card debe ser un `<button>` semántico (NO un div con onClick).
  - Card content: icono/identificador visual (letras SR, HA, TFT, Arena con fondo gradiente o sólido), nombre del modo localizado, y posiblemente una descripción corta.
  - Estilos: usar tokens del tema (`lol-navy-950`, `lol-border-gold`, `lol-gold`, `bg-lol-bg-glass`).
  - Agregar estado hover/active con `hover:border-lol-border-gold hover:shadow-lol-glow-gold active:scale-[0.98]`.
  - **Card sizing (CRITICAL)**: Usar `aspect-[4/3]` o `h-28` (112px) max, NO `aspect-square`. En un viewport 360×640, un grid 2×3 con cards de 112px + gaps (~8px) + header (~120px) = ~520px total, dejando margen cómodo sin scroll.
  - Centrar verticalmente el grid dentro del viewport disponible (`items-center justify-center min-h-0` o padding top generoso) para que las cards caigan en la zona natural del pulgar (thumb zone).
  - **Filtrar modos vacíos**: Si un modo (ej. Arena/RGM) tiene `queues.length === 0`, no renderizar su card en el grid. Esto previene cards vacías o sheets sin contenido.

  **Must NOT do**: 
  - No usar imágenes externas o assets nuevos.
  - No hacer las cards más altas que ~140px en móvil.
  - No usar `<div onClick={...}>` — accesibilidad obligatoria.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: implementación de grid responsive y estilos
  - Skills: `frontend-ui-ux`, `web-design-guidelines` - Reason: accesibilidad y diseño mobile
  - Omitted: `agent-browser-automation` - Reason: no se necesita aún

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: T3 | Blocked By: T1

  **References**:
  - Pattern: `src/components/ui/card.tsx:1-17` - Card base con glassmorphism
  - Pattern: `src/components/ui/button.tsx:1-54` - Button variants y estados
  - Pattern: `src/routes/connected/create-lobby/route.tsx:132-163` - estructura actual de cards
  - External: https://www.w3.org/WAI/ARIA/apg/patterns/button/ - botones semánticos

  **Acceptance Criteria**:
  - [ ] Las mode cards son `<button>` con `aria-label` que contiene el nombre completo del modo (ej. `aria-label="Summoner's Rift"`), no solo la abreviatura visual
  - [ ] El grid usa `grid-cols-2` con `gap-3` o `gap-4`
  - [ ] Las cards usan `aspect-[4/3]` o `h-28` max (NO `aspect-square`)
  - [ ] `lint` pasa sin errores (`oxlint` + `eslint`)

  **QA Scenarios**:
  ```
  Scenario: Mode grid visibility on mobile
    Tool: agent-browser
    Steps: 
      1. set viewport 375 812 2
      2. open http://localhost:5173/connected/create-lobby
      3. screenshot /tmp/task-2-grid-375x812.png
    Expected: Todas las mode cards son visibles sin hacer scroll. La scrollbar no está presente o el thumb cubre casi todo el track.
    Evidence: .sisyphus/evidence/task-2-grid-375x812.png

  Scenario: Mode grid visibility on small mobile
    Tool: agent-browser
    Steps: 
      1. set viewport 360 640 2
      2. open http://localhost:5173/connected/create-lobby
      3. screenshot /tmp/task-2-grid-360x640.png
    Expected: Todas las mode cards son visibles sin hacer scroll.
    Evidence: .sisyphus/evidence/task-2-grid-360x640.png
  ```

  **Commit**: YES | Message: `feat(create-lobby): add visual mode selection grid` | Files: `src/routes/connected/create-lobby/route.tsx`

- [x] T3. Integrar Bottom Sheet con lista de colas

  **What to do**: 
  - Agregar estado local `selectedMode: string | null` y `isSheetOpen: boolean`.
  - Al hacer click en una mode card, setear `selectedMode` y abrir el Bottom Sheet.
  - Dentro del Bottom Sheet, renderizar las colas del modo seleccionado como una lista de `<Button>` compactos (`h-12` o `h-14`, `variant="outline"` o `"secondary"`).
  - Cada botón de cola muestra el nombre localizado (`queue.description`). NO mostrar `queue.id`.
  - Al hacer click en una cola, ejecutar `handleCreateLobby(queue.id)`.
  - Mientras `createLobbyMutation.isPending`, deshabilitar todos los botones de cola en el sheet.
  - **Loading feedback**: En el botón de cola específico que fue clickeado, renderizar un `<Spinner>` (componente existente `src/components/ui/spinner.tsx`) además de deshabilitarlo. Deshabilitar solo puede parecer UI congelada.
  - Cerrar el Bottom Sheet después de que la mutación sea exitosa.
  - Agregar estado de error: si `createLobbyMutation.isError`, mostrar un mensaje de error dentro del sheet o en un toast/alert (usar el componente `Alert` existente si aplica).
  - Asegurar que el Bottom Sheet reutiliza el componente existente: `import { BottomSheet } from '@/components/ui'`.
  - Verificar que el focus se devuelve a la mode card que abrió el sheet cuando se cierra (el componente BottomSheet ya maneja `previousFocusRef`, pero verificar que funciona con las nuevas cards).

  **Must NOT do**: 
  - No crear un nuevo componente de sheet/drawer.
  - No modificar el BottomSheet existente a menos que sea absolutamente necesario (si se necesita un cambio mínimo, documentarlo).
  - No mostrar queue IDs en el UI.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: integración de componentes existentes con estado
  - Skills: `frontend-ui-ux`, `zustand` (si aplica para estado global, aunque aquí es local) - Reason: manejo de estado
  - Omitted: `agent-browser-automation` - Reason: QA viene después

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: T4 | Blocked By: T1, T2

  **References**:
  - Pattern: `src/components/ui/bottom-sheet.tsx:11-189` - Props: `isOpen`, `onClose`, `title`, `children`
  - Pattern: `src/components/ui/button.tsx:1-54` - Button variants, disabled state
  - Pattern: `src/components/ui/spinner.tsx` - Spinner para feedback de loading en botón activo
  - Pattern: `src/routes/connected/create-lobby/route.tsx:33-40` - `handleCreateLobby` existente
  - Pattern: `src/components/ui/alert.tsx` - Para mensajes de error si se usa

  **Acceptance Criteria**:
  - [ ] Tapping una mode card abre el Bottom Sheet
  - [ ] El sheet muestra el título incluyendo el modo seleccionado (ej. "Summoner's Rift — Select Queue")
  - [ ] Las colas se muestran como botones con nombres localizados, sin IDs
  - [ ] `createLobbyMutation.isPending` deshabilita los botones de cola Y muestra `<Spinner>` en el botón activo
  - [ ] `createLobbyMutation.isError` muestra mensaje de error
  - [ ] Escape, backdrop click, y swipe-down cierran el sheet

  **QA Scenarios**:
  ```
  Scenario: Bottom sheet opens with correct queues
    Tool: agent-browser
    Steps:
      1. set viewport 375 812 2
      2. open http://localhost:5173/connected/create-lobby
      3. snapshot -i (identificar ref de la primera mode card)
      4. click @e{X} (mode card ref)
      5. wait 500
      6. snapshot -i
      7. get text @e{Y} (título del sheet)
    Expected: El sheet está abierto, el título coincide con el modo seleccionado, y hay botones de cola visibles.
    Evidence: .sisyphus/evidence/task-3-sheet-open.png

  Scenario: Queue creation triggers mutation
    Tool: agent-browser
    Steps:
      1. open http://localhost:5173/connected/create-lobby
      2. click @e{X} (mode card)
      3. wait 300
      4. click @e{Y} (primera cola en sheet)
      5. wait 1000
    Expected: Navega a `/connected/lobby` (si la mutación tiene éxito) o muestra error.
    Evidence: .sisyphus/evidence/task-3-create-lobby.png

  Scenario: Dismiss bottom sheet
    Tool: agent-browser
    Steps:
      1. open http://localhost:5173/connected/create-lobby
      2. click @e{X} (mode card)
      3. wait 300
      4. press Escape
      5. wait 300
      6. is visible @e{Z} (sheet content ref)
    Expected: Sheet no está visible (false)
    Evidence: .sisyphus/evidence/task-3-sheet-dismiss.txt
  ```

  **Commit**: YES | Message: `feat(create-lobby): add bottom sheet with queue selection and mutation states` | Files: `src/routes/connected/create-lobby/route.tsx`

- [x] T4. Traducciones i18n y QA final con agent-browser

  **What to do**: 
  - Agregar nuevas keys de traducción en `src/i18n/translations/en.ts` bajo `createLobby`:
    - `selectMode`: "Select a game mode"
    - `modes.sr`: "Summoner's Rift"
    - `modes.aram`: "ARAM"
    - `modes.tft`: "Teamfight Tactics"
    - `modes.arena`: "Arena"
    - `modes.rgm`: "Rotating Game Mode"
    - `modeDescriptions.sr`: "Classic 5v5"
    - `modeDescriptions.aram`: "All Random All Mid"
    - `modeDescriptions.tft`: "Auto-battler strategy"
    - `modeDescriptions.arena`: "Temporary modes"
    - `sheetTitle`: "Select Queue"
    - `createError`: "Failed to create lobby. Please try again."
  - Agregar las mismas keys en `src/i18n/translations/es.ts`.
  - Revisar que los textos en español no causen overflow en las cards o en los botones del sheet (especialmente "Clasificatoria Solo/Dúo" que ya trunca actualmente).
  - Ejecutar QA con agent-browser: screenshots en 375×812 y 360×640, verificar que no hay scroll, verificar que el sheet funciona, verificar que no se ven IDs.
  - Ejecutar `bun run typecheck` y `bun run lint` en `apps/web-next`.

  **Must NOT do**: 
  - No modificar keys de traducción existentes usadas por otros componentes.
  - No dejar keys sin traducir en ningún idioma.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: tareas de texto + QA
  - Skills: `agent-browser-automation` - Reason: capturas de pantalla y verificación visual
  - Omitted: `frontend-ui-ux` - Reason: el diseño ya está definido en T2/T3

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: F1-F4 | Blocked By: T3

  **References**:
  - Pattern: `src/i18n/translations/en.ts:51-57` - estructura actual de `createLobby`
  - Pattern: `src/i18n/translations/es.ts:51-57` - estructura en español

  **Acceptance Criteria**:
  - [ ] Todas las nuevas keys existen en `en.ts` y `es.ts`
  - [ ] `typecheck` pasa sin errores
  - [ ] `lint` pasa sin errores
  - [ ] Screenshots de QA confirman grid sin scroll y sheet funcional

  **QA Scenarios**:
  ```
  Scenario: Spanish locale layout check
    Tool: agent-browser
    Steps:
      1. set viewport 375 812 2
      2. open http://localhost:5173/connected/create-lobby?lng=es
      3. screenshot /tmp/task-4-spanish.png
    Expected: Las cards no se desbordan, los textos se truncan correctamente con ellipsis si es necesario.
    Evidence: .sisyphus/evidence/task-4-spanish.png

  Scenario: No queue IDs visible
    Tool: Bash
    Steps: grep -n "queue.id\|queueId\|ID:" src/routes/connected/create-lobby/route.tsx
    Expected: Ningún match (o solo en lógica de data layer, no en JSX)
    Evidence: .sisyphus/evidence/task-4-no-ids.txt
  ```

  **Commit**: YES | Message: `feat(i18n): add create-lobby mode and queue translations` | Files: `src/i18n/translations/en.ts`, `src/i18n/translations/es.ts`

## Final Verification Wave
- [x] F1. Plan Compliance Audit — oracle
  Verificar que el código implementado coincide con el plan: grid de modos, bottom sheet, ocultamiento de IDs, traducciones, y accesibilidad.
  
- [x] F2. Code Quality Review — unspecified-high
  Revisar que no hay anti-patterns: no divs clickeables, no inline styles, no any types, tokens de Tailwind consistentes.
  
- [x] F3. Real Manual QA — unspecified-high (+ agent-browser)
  Screenshots en viewports 375×812, 360×640, 414×896. Verificar sin scroll, sheet funcional, traducciones correctas.
  
- [x] F4. Scope Fidelity Check — deep
  Confirmar que solo se modificaron los archivos planificados y no hay cambios en AppShell, header, ni otros routes.

## Commit Strategy
- T1: `refactor(create-lobby): group queues by visual mode`
- T2: `feat(create-lobby): add visual mode selection grid`
- T3: `feat(create-lobby): add bottom sheet with queue selection and mutation states`
- T4: `feat(i18n): add create-lobby mode and queue translations`
- Final: `feat(create-lobby): complete UX redesign with grid and bottom sheet`

## Success Criteria
1. La pantalla `/connected/create-lobby` muestra un grid de modos sin scroll vertical en viewports móviles estándar (≥360px de ancho).
2. Tapping un modo abre un Bottom Sheet con las colas disponibles de ese modo.
3. Las colas muestran nombres localizados; los IDs técnicos están ocultos.
4. La creación de lobby funciona correctamente con estados de carga y error.
5. Todas las traducciones están actualizadas en inglés y español.
6. `typecheck` y `lint` pasan sin errores.
7. Los 4 agentes de verificación final aprueban.
