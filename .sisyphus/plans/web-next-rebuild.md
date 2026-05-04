# web-next Complete Rebuild

## TL;DR
> **Summary**: Rebuild completo de `apps/web-next/` desde cero, manteniendo el stack actual (React 19, TanStack Router, Tailwind v4, Zustand). Prioridad: conexión estable a Rift primero, luego flujos de juego (lobby, queue, ready-check, invites, champ-select). Diseño ultra-básico funcional, iteración visual posterior.
> **Deliverables**: Código fuente completamente nuevo, tests funcionales, Data Dragon integrado, PWA funcional.
> **Effort**: Large
> **Parallel**: YES - 5 waves
> **Critical Path**: Wave 1 (Protocol Foundation) → Wave 2 (Connection + Core State) → Wave 3 (Gameplay Flows) → Wave 4 (Integration + Polish) → Wave 5 (Final Verification)

## Context
### Original Request
El usuario reporta que la versión actual de web-next "no funciona nada" y el diseño es "horrible". Quiere un rebuild completo desde cero manteniendo el stack tecnológico actual, enfocándose primero en que todo funcione correctamente y luego iterando en el diseño visual.

### Interview Summary
- **Scope**: Borrar todo `src/` y reconstruir. Mantener config de build (vite, tsconfig, package.json).
- **Prioridad**: Core connection primero (Rift WebSocket + HTTP), luego gameplay flows.
- **Diseño**: Ultra-básico funcional primero, iterar después.
- **Target**: Móvil primero, desktop básico responsive.
- **Timeline**: Sin prisa, calidad sobre velocidad.
- **Tests**: Evaluar existentes durante rebuild, decidir per-test.
- **Assets**: Data Dragon (assets reales de Riot) desde el inicio.
- **Backend**: Frontend principalmente, fixes menores en backend solo si bloquean.

### Metis Review (gaps addressed)
- **Guardrail**: Preservar contratos de protocolo Rift/LCU como invariantes — no cambiar semántica de handshake, opcodes, o session storage.
- **Guardrail**: Evitar scope creep visual — congelar diseño a básico hasta que core + flujos pasen QA.
- **Guardrail**: Definir ownership de estado — Router maneja URL state, React Query maneja remote async state, Zustand maneja client-only shared state, WebSocket es transport only.
- **Risk mitigado**: No descartar tests útiles que codifican comportamiento real del protocolo.
- **Risk mitigado**: No introducir nuevas capas de estado/cache más allá de Router + React Query + Zustand + local component state.

## Work Objectives
### Core Objective
Reconstruir completamente el frontend de Mimic (web-next) desde cero con un enfoque en funcionalidad correcta primero y diseño visual segundo, manteniendo compatibilidad con el protocolo Rift ya migrado.

### Deliverables
1. Código fuente completamente nuevo en `apps/web-next/src/`
2. Conexión estable a Rift con handshake, encriptación, y reconexión automática
3. Flujos de juego funcionales: lobby, queue, ready-check, invites, champ-select
4. Integración con Data Dragon para assets reales de LoL
5. Tests unitarios, de integración, y E2E funcionales
6. PWA funcional con service worker
7. i18n configurado y funcionando
8. Diseño ultra-básico pero funcional en móvil y desktop básico

### Definition of Done (verifiable conditions with commands)
- [ ] `bun --cwd apps/web-next run build` pasa sin errores (exit code 0)
- [ ] `bun --cwd apps/web-next run test` pasa sin errores (exit code 0)
- [ ] `bun --cwd apps/web-next run test:e2e` pasa sin errores (exit code 0)
- [ ] Conexión a Rift funciona end-to-end en entorno local
- [ ] Lobby muestra datos correctos y permite acciones básicas
- [ ] Queue inicia/cancela correctamente
- [ ] Ready-check acepta/rechaza correctamente
- [ ] Invites muestran y permiten aceptar/rechazar
- [ ] Champ-select permite pick/ban con Data Dragon assets
- [ ] App es usable en móvil (viewport 375x812) y no rota en desktop (viewport 1280x720)

### Must Have
- Conexión estable a Rift vía WebSocket con handshake encriptado
- Flujo de conexión con código de 6 dígitos
- Reconexión automática con session persistence
- Lobby con datos de LCU en tiempo real
- Queue (iniciar, cancelar, mostrar estado)
- Ready-check (aceptar, rechazar, timer)
- Invites (listar, aceptar, rechazar)
- Champ-select (pick, ban, reroll, bench, spells, skins, runes)
- Data Dragon integration para icons, splashes, spells, runes, skins
- i18n con al menos inglés y español
- PWA funcional (manifest, service worker, installable)
- Tests unitarios para stores y lógica
- Tests de integración para protocolo y transporte
- Tests E2E con Playwright para flujos críticos
- Diseño responsive móvil primero, desktop básico

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)
- **NO** rediseño visual sofisticado en la primera iteración (ultra-básico funcional primero)
- **NO** cambios al protocolo Rift/LCU o a `@mimic/protocol-contract`
- **NO** cambios mayores a Rift-next o Conduit backend (solo fixes menores si bloquean)
- **NO** nuevas capas de estado/cache más allá de Router + React Query + Zustand + local state
- **NO** animaciones complejas o efectos visuales en MVP
- **NO** soporte para navegadores antiguos (solo latest Vite-supported)
- **NO** feature flags o A/B testing en MVP
- **NO** analytics/tracking en MVP
- **NO** modo oscuro/claro toggle (solo modo oscuro por defecto)
- **NO** AI-generated comments o docstrings vacíos
- **NO** any types (Oxlint enforce `no-explicit-any`)
- **NO** exports no-componentes desde `routes/**` (react-refresh rule)

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- **Test decision**: Tests-after para features nuevas, evaluar y adaptar tests existentes
- **Test framework**: Bun nativo para unit/integration, Playwright para E2E
- **QA policy**: Cada tarea tiene escenarios de QA ejecutados por agente
- **Evidence**: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves
> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.

**Wave 1: Foundation & Protocol**
- T1: Limpiar src/ existente y preparar estructura nueva
- T2: Reconstruir core Rift (WebSocket client, handshake, encryption)
- T3: Reconstruir HTTP client y Data Dragon client
- T4: Configurar stores base (connection, gameflow) con Zustand

**Wave 2: Connection Flow & State**
- T5: Reconstruir página de conexión (/)
- T6: Reconstruir root layout con reconexión automática
- T7: Reconstruir connected layout y navegación
- T8: Implementar i18n config y traducciones base

**Wave 3: Gameplay Flows**
- T9: Reconstruir Lobby (/connected/lobby)
- T10: Reconstruir Queue (/connected/queue)
- T11: Reconstruir Ready Check (/connected/ready-check)
- T12: Reconstruir Invites (/connected/invites)
- T13: Reconstruir Champ Select (/connected/champ-select)

**Wave 4: UI Primitives, Tests & Polish**
- T14: Reconstruir componentes UI base (shadcn primitives)
- T15: Reconstruir AppShell, SafeArea, LandscapeWarning
- T16: Migrar/adaptar tests unitarios e integración
- T17: Migrar/adaptar tests E2E con Playwright
- T18: Implementar PWA (manifest, service worker)

**Wave 5: Final Verification**
- F1: Plan Compliance Audit
- F2: Code Quality Review
- F3: Real Manual QA
- F4: Scope Fidelity Check

### Dependency Matrix (full, all tasks)
| Task | Blocks | Blocked By |
|------|--------|------------|
| T1 | T2, T3, T4, T5, T14, T15 | - |
| T2 | T5, T6, T9, T10, T11, T12, T13 | T1 |
| T3 | T9, T10, T13 | T1 |
| T4 | T5, T6, T7, T9, T10, T11, T12, T13 | T1 |
| T5 | T6 | T2, T4 |
| T6 | T7 | T5 |
| T7 | T9, T10, T11, T12, T13 | T6 |
| T8 | T5, T9, T10, T11, T12, T13 | T1 |
| T9 | - | T3, T7, T8 |
| T10 | - | T3, T7, T8 |
| T11 | - | T7, T8 |
| T12 | - | T7, T8 |
| T13 | - | T3, T7, T8 |
| T14 | T5, T9, T10, T11, T12, T13 | T1 |
| T15 | T5, T9, T10, T11, T12, T13 | T1 |
| T16 | - | T2, T3, T4 |
| T17 | - | T5, T9, T10, T11, T12, T13 |
| T18 | - | T1 |

### Agent Dispatch Summary (wave → task count → categories)
| Wave | Tasks | Categories |
|------|-------|------------|
| Wave 1 | 4 | deep, quick |
| Wave 2 | 4 | visual-engineering, quick |
| Wave 3 | 5 | visual-engineering, deep |
| Wave 4 | 5 | quick, unspecified-high |
| Wave 5 | 4 | oracle, unspecified-high, deep |

## TODOs

- [x] T1. Limpiar src/ existente y preparar estructura nueva

  **What to do**: 
  1. Hacer backup del src/ actual (mover a `src-old/` o commit)
  2. Crear nueva estructura de directorios:
     - `src/components/` (layout + ui)
     - `src/core/` (rift, http, query, state, platform)
     - `src/features/` (connect, lobby, queue, ready-check, invites, champ-select)
     - `src/i18n/` (config + translations)
     - `src/routes/` (__root, index, connected/lobby, connected/queue, connected/ready-check, connected/invites, connected/champ-select)
     - `src/lib/` (utils)
  3. Configurar aliases de imports (`~/*`, `@/`)
  4. Asegurar que `vite.config.ts`, `tsconfig.json`, y `package.json` siguen funcionando
  5. Crear `src/styles.css` base ultra-simple (fondo oscuro, texto claro, sin gradientes complejos)
  6. Crear `src/main.tsx` básico con RouterProvider + QueryClientProvider

  **Must NOT do**: 
  - NO copiar código del src/ viejo
  - NO modificar config de build salvo aliases necesarios
  - NO agregar diseño visual complejo todavía

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: Estructura básica y configuración
  - Skills: [] - No skills adicionales necesarias

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T2, T3, T4, T5, T14, T15 | Blocked By: -

  **References**:
  - Config: `apps/web-next/vite.config.ts` - Mantener plugins actuales (tanstackRouter, react, tailwindcss, i18n, PWA)
  - Config: `apps/web-next/tsconfig.json` - Mantener aliases y JSX config
  - Config: `apps/web-next/components.json` - Mantener config shadcn
  - Pattern: `apps/web-next/src/main.tsx` (viejo) - Referencia de bootstrap básico

  **Acceptance Criteria**:
  - [ ] `bun --cwd apps/web-next run build` pasa sin errores (exit code 0)
  - [ ] Estructura de directorios creada según especificación
  - [ ] `src/main.tsx` renderiza `<div>Hello Mimic</div>` sin errores
  - [ ] Aliases `~/*` y `@/*` funcionan correctamente

  **QA Scenarios**:
  ```
  Scenario: Build básico
    Tool: Bash
    Steps: cd apps/web-next && bun run build
    Expected: exit code 0, sin errores de TypeScript
    Evidence: .sisyphus/evidence/task-1-build.log

  Scenario: Dev server arranca
    Tool: Bash
    Steps: cd apps/web-next && timeout 10s bun run dev || true
    Expected: No crash, puerto disponible
    Evidence: .sisyphus/evidence/task-1-dev.log
  ```

  **Commit**: YES | Message: `chore(web-next): reset src/ and scaffold new structure` | Files: `apps/web-next/src/**`, `apps/web-next/tsconfig.json` (si cambia)

- [x] T2. Reconstruir core Rift (WebSocket client, handshake, encryption)

  **What to do**:
  1. Crear `src/core/rift/rift-client.ts` nuevo desde cero
  2. Implementar WebSocket connection a `ws://localhost:51001/mobile` (o `VITE_RIFT_WS_BASE_URL`)
  3. Implementar handshake protocol: CONNECT -> pubkey exchange -> OPEN/MSG/CLOSE opcodes
  4. Implementar encriptación end-to-end (preservar semántica actual del protocolo)
  5. Implementar reconexión automática con backoff exponencial
  6. Implementar heartbeat/keepalive
  7. Crear `src/core/rift/lcu-transport.ts` para request/observe sobre el WebSocket
  8. Crear hooks: `useRiftClient`, `useLCURequest`, `useLCUObserver`
  9. Exportar tipos y contratos desde `@mimic/protocol-contract`

  **Must NOT do**:
  - NO cambiar semántica de opcodes o mensajes del protocolo
  - NO cambiar lógica de encriptación
  - NO olvidar manejo de errores y disconnect

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Protocolo complejo, requiere entender handshake y encriptación
  - Skills: [] - Necesita entender protocolo actual

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: T5, T6, T9, T10, T11, T12, T13 | Blocked By: T1

  **References**:
  - Protocol: `apps/web-next/src/core/rift/rift-client.ts` (viejo) - Referencia de handshake
  - Protocol: `apps/web-next/src/core/rift/lcu-transport.ts` (viejo) - Referencia de transporte LCU
  - Types: `packages/protocol-contract/` - Tipos y opcodes del protocolo
  - Test: `apps/web-next/tests/integration/rift-handshake.test.ts` (viejo) - Contrato a preservar

  **Acceptance Criteria**:
  - [ ] WebSocket se conecta a Rift sin errores
  - [ ] Handshake completa exitosamente (CONNECT -> OPEN)
  - [ ] Mensajes encriptados se envían y reciben correctamente
  - [ ] Reconexión automática funciona tras disconnect
  - [ ] Tests de integración pasan: `bun test apps/web-next/tests/integration/rift-handshake.test.ts`

  **QA Scenarios**:
  ```
  Scenario: Handshake exitoso
    Tool: Bash
    Steps: Conectar a Rift local, enviar CONNECT con pubkey válida, esperar OPEN
    Expected: Estado 'connected' en store, sin errores de handshake
    Evidence: .sisyphus/evidence/task-2-handshake.log

  Scenario: Reconexión automática
    Tool: Bash
    Steps: Forzar disconnect, esperar reconexión automática
    Expected: Reconecta en < 5 segundos, re-hace handshake
    Evidence: .sisyphus/evidence/task-2-reconnect.log

  Scenario: LCU request/response
    Tool: Bash
    Steps: Enviar request LCU vía transport, esperar respuesta
    Expected: Respuesta válida con datos del LCU
    Evidence: .sisyphus/evidence/task-2-lcu-request.log
  ```

  **Commit**: YES | Message: `feat(rift): rebuild websocket client, handshake, and lcu transport` | Files: `apps/web-next/src/core/rift/**`

- [x] T3. Reconstruir HTTP client y Data Dragon client

  **What to do**:
  1. Crear `src/core/http/http-client.ts` con `ky` para requests a Rift HTTP
  2. Endpoints: `registerConduit`, `checkToken`, `getProtocolHealth`
  3. Base URL desde `VITE_RIFT_HTTP_BASE_URL` (default: `http://localhost:51001`)
  4. Crear `src/core/http/ddragon-client.ts` para Data Dragon
  5. Implementar fetching de: profile icons, champion splashes, spells, runes, skins
  6. Configurar caché eficiente para assets (localStorage o memory cache)
  7. Crear hooks React Query para data fetching
  8. Manejar errores de red y retries

  **Must NOT do**:
  - NO hardcodear URLs de Data Dragon (usar latest version endpoint)
  - NO olvidar manejo de errores 404 para assets faltantes

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: HTTP clients relativamente straight-forward
  - Skills: [] - No skills adicionales necesarias

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T9, T10, T13 | Blocked By: T1

  **References**:
  - Client: `apps/web-next/src/core/http/http-client.ts` (viejo) - Referencia de API
  - Client: `apps/web-next/src/core/http/ddragon-client.ts` (viejo) - Referencia de Data Dragon
  - Config: `apps/web-next/src/vite-env.d.ts` - Tipos de env vars

  **Acceptance Criteria**:
  - [ ] HTTP client puede registrar/check token con Rift
  - [ ] Data Dragon client carga lista de campeones
  - [ ] Data Dragon client carga assets de un campeón específico
  - [ ] Tests de integración pasan: `bun test apps/web-next/tests/integration/lcu-transport.test.ts`
  - [ ] React Query devtools funcionan (opcional pero útil)

  **QA Scenarios**:
  ```
  Scenario: Registro exitoso
    Tool: Bash
    Steps: Llamar registerConduit con código válido
    Expected: Respuesta 200 con token JWT
    Evidence: .sisyphus/evidence/task-3-register.log

  Scenario: Data Dragon fetch
    Tool: Bash
    Steps: Cargar lista de campeones y assets de "Ahri"
    Expected: Datos JSON válidos, URLs de imágenes accesibles
    Evidence: .sisyphus/evidence/task-3-ddragon.log
  ```

  **Commit**: YES | Message: `feat(http): rebuild rift http client and ddragon integration` | Files: `apps/web-next/src/core/http/**`

- [x] T4. Configurar stores base (connection, gameflow) con Zustand

  **What to do**:
  1. Crear `src/core/state/rift-store.ts` - Estado de conexión (connected, disconnected, connecting, error)
  2. Crear `src/core/state/gameflow-store.ts` - Estado del juego (lobby, queue, readyCheck, champSelect, etc.)
  3. Definir acciones y transiciones de estado
  4. Implementar persistencia de session code en localStorage/sessionStorage
  5. Integrar con Rift client para actualizaciones en tiempo real
  6. Asegurar que stores son testeables (exportar estado inicial y reducers)

  **Must NOT do**:
  - NO duplicar estado que ya maneja React Query (server state)
  - NO usar Zustand para estado que puede ser local de componente

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: Zustand stores son relativamente simples
  - Skills: [] - No skills adicionales necesarias

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T5, T6, T7, T9, T10, T11, T12, T13 | Blocked By: T1

  **References**:
  - Store: `apps/web-next/src/core/state/gameflow-store.ts` (viejo) - Referencia de gameflow
  - Store: `apps/web-next/src/core/rift/rift-store.ts` (viejo) - Referencia de connection state
  - Test: `apps/web-next/tests/unit/gameflow-store.test.ts` (viejo) - Contrato a preservar

  **Acceptance Criteria**:
  - [ ] Store de conexión maneja estados: idle, connecting, connected, disconnected, error
  - [ ] Store de gameflow maneja fases: None, Lobby, Matchmaking, ReadyCheck, ChampSelect, InProgress
  - [ ] Transiciones de estado son válidas y no permiten saltos inválidos
  - [ ] Persistencia de código funciona (localStorage/sessionStorage)
  - [ ] Tests unitarios pasan: `bun test apps/web-next/tests/unit/gameflow-store.test.ts`

  **QA Scenarios**:
  ```
  Scenario: Transiciones de gameflow válidas
    Tool: Bash
    Steps: Ejecutar tests unitarios de gameflow store
    Expected: Todos los tests pasan, transiciones válidas
    Evidence: .sisyphus/evidence/task-4-gameflow.log

  Scenario: Persistencia de sesión
    Tool: Bash
    Steps: Guardar código en localStorage, recargar store
    Expected: Código recuperado correctamente
    Evidence: .sisyphus/evidence/task-4-persistence.log
  ```

  **Commit**: YES | Message: `feat(state): rebuild rift and gameflow stores with zustand` | Files: `apps/web-next/src/core/state/**`

- [x] T5. Reconstruir página de conexión (/)

  **What to do**:
  1. Crear `src/routes/index/route.tsx` - Página de entrada/conexión
  2. Implementar formulario de código de 6 dígitos
  3. Mostrar estados: idle, checking, connecting, connected, error, denied
  4. Integrar con `useRiftStore` y `useConnectionFlow`
  5. Implementar auto-connect desde query params o localStorage
  6. Crear componentes: `ConnectEntryForm`, `ConnectionStatus`, `StatusCard`
  7. Diseño ultra-básico: centrado, input grande, botón claro, mensajes de estado

  **Must NOT do**:
  - NO diseño complejo (sin gradientes, animaciones elaboradas)
  - NO olvidar manejo de errores de red o código inválido

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Primera página visible, necesita ser funcional y clara
  - Skills: [] - No skills adicionales necesarias

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T6 | Blocked By: T2, T4

  **References**:
  - Route: `apps/web-next/src/routes/index/route.tsx` (viejo) - Referencia de flujo
  - Hook: `apps/web-next/src/features/connect/hooks/use-connect-page-controller.ts` (viejo) - Lógica de página
  - Hook: `apps/web-next/src/features/connect/hooks/use-connection-flow.ts` (viejo) - Flujo de conexión
  - Component: `apps/web-next/src/features/connect/components/connect-screen.tsx` (viejo) - UI de conexión

  **Acceptance Criteria**:
  - [ ] Página muestra formulario de código de 6 dígitos
  - [ ] Al enviar, intenta conectar a Rift y muestra estado de progreso
  - [ ] Estados de error muestran mensaje claro (código inválido, Rift offline, etc.)
  - [ ] Conexión exitosa redirige a `/connected/lobby`
  - [ ] Auto-connect funciona si hay código persistido
  - [ ] Tests E2E pasan para flujo de conexión

  **QA Scenarios**:
  ```
  Scenario: Conexión exitosa
    Tool: Playwright
    Steps: 
      1. Navegar a /
      2. Ingresar código válido de 6 dígitos
      3. Click "Connect"
      4. Esperar redirección a /connected/lobby
    Expected: Redirige en < 10 segundos, muestra lobby
    Evidence: .sisyphus/evidence/task-5-connect-success.png

  Scenario: Código inválido
    Tool: Playwright
    Steps:
      1. Navegar a /
      2. Ingresar código "000000"
      3. Click "Connect"
    Expected: Muestra error "Invalid or expired code" sin crash
    Evidence: .sisyphus/evidence/task-5-connect-invalid.png

  Scenario: Auto-reconnect
    Tool: Playwright
    Steps:
      1. Conectar con código válido
      2. Cerrar pestaña
      3. Abrir / de nuevo
    Expected: Auto-intenta reconectar con código persistido
    Evidence: .sisyphus/evidence/task-5-auto-reconnect.png
  ```

  **Commit**: YES | Message: `feat(connect): rebuild connection page with basic functional design` | Files: `apps/web-next/src/routes/index/**`, `apps/web-next/src/features/connect/**`

- [x] T6. Reconstruir root layout con reconexión automática

  **What to do**:
  1. Crear `src/routes/__root/route.tsx` - Root layout
  2. Implementar `useGlobalSessionReconnect` hook
  3. Verificar session storage al cargar, redirigir si es necesario
  4. Manejar return URLs después de reconexión
  5. Integrar con Rift store para estado global de conexión

  **Must NOT do**:
  - NO agregar lógica de negocio en root (solo orchestration de conexión)

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: Root layout relativamente simple
  - Skills: [] - No skills adicionales necesarias

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T7 | Blocked By: T5

  **References**:
  - Route: `apps/web-next/src/routes/__root/route.tsx` (viejo)
  - Hook: `apps/web-next/src/routes/__root/-root-reconnect-utils.ts` (viejo)
  - Hook: `apps/web-next/src/routes/__root/-root-session-utils.ts` (viejo)

  **Acceptance Criteria**:
  - [ ] Root route maneja reconexión global
  - [ ] Redirección a return URL funciona después de reconexión
  - [ ] Session code se recupera de storage correctamente

  **QA Scenarios**:
  ```
  Scenario: Reconexión global
    Tool: Playwright
    Steps:
      1. Conectar, navegar a /connected/queue
      2. Forzar refresh
    Expected: Reconecta automáticamente y vuelve a /connected/queue
    Evidence: .sisyphus/evidence/task-6-reconnect.png
  ```

  **Commit**: YES | Message: `feat(root): rebuild root layout with session reconnect` | Files: `apps/web-next/src/routes/__root/**`

- [ ] T7. Reconstruir connected layout y navegación

  **What to do**:
  1. Crear `src/routes/connected/route.tsx` - Layout para área autenticada
  2. Implementar navegación: Lobby, Queue, Ready Check, Invites, Champ Select
  3. Mostrar estado de conexión (online/offline)
  4. Implementar redirect de `/connected` a `/connected/lobby`
  5. Diseño básico: header con nav, área de contenido, footer mínimo

  **Must NOT do**:
  - NO navegación compleja (tabs simples o links)
  - NO diseño elaborado del header

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Navegación visible, necesita ser clara en móvil
  - Skills: [] - No skills adicionales necesarias

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T9, T10, T11, T12, T13 | Blocked By: T6

  **References**:
  - Route: `apps/web-next/src/routes/connected/route.tsx` (viejo)
  - Utils: `apps/web-next/src/routes/connected/-connected-layout-utils.ts` (viejo)

  **Acceptance Criteria**:
  - [ ] Navegación visible en todas las páginas /connected/*
  - [ ] Links funcionan y cambian de ruta correctamente
  - [ ] Estado de conexión visible (online/offline)
  - [ ] Redirect de /connected a /connected/lobby funciona
  - [ ] Layout es usable en viewport móvil (375px)

  **QA Scenarios**:
  ```
  Scenario: Navegación entre páginas
    Tool: Playwright
    Steps:
      1. Conectar y estar en /connected/lobby
      2. Click en "Queue"
      3. Click en "Ready Check"
      4. Click en "Lobby"
    Expected: Cada navegación carga la página correcta sin errores
    Evidence: .sisyphus/evidence/task-7-navigation.png
  ```

  **Commit**: YES | Message: `feat(connected): rebuild connected layout and navigation` | Files: `apps/web-next/src/routes/connected/route.tsx`, `apps/web-next/src/routes/connected/-connected-layout-utils.ts`

- [x] T8. Implementar i18n config y traducciones base

  **What to do**:
  1. Configurar `src/i18n/config.ts` con i18next + react-i18next
  2. Crear archivos de traducción: `en.json`, `es.json`
  3. Traducir keys básicas: conexión, lobby, queue, ready-check, invites, champ-select
  4. Integrar plugin de Vite para i18n (`@i18next-selector/vite-plugin`)
  5. Configurar detección de idioma y persistencia
  6. Crear hook `useTranslation` wrapper si es necesario

  **Must NOT do**:
  - NO traducir todo en la primera pasada (MVP básico)
  - NO olvidar que el plugin de Vite ya está configurado

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: Configuración de i18n straight-forward
  - Skills: [] - No skills adicionales necesarias

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T5, T9, T10, T11, T12, T13 | Blocked By: T1

  **References**:
  - Config: `apps/web-next/src/i18n/config.ts` (viejo)
  - Plugin: `apps/web-next/vite.config.ts` (config de i18nextVitePlugin)
  - Traducciones: `apps/web-next/src/i18n/` (directorio viejo)

  **Acceptance Criteria**:
  - [ ] i18n config carga sin errores
  - [ ] Al menos 2 idiomas configurados (en, es)
  - [ ] Textos básicos traducidos y mostrándose correctamente
  - [ ] Cambio de idioma funciona y persiste

  **QA Scenarios**:
  ```
  Scenario: Traducción funciona
    Tool: Playwright
    Steps:
      1. Navegar a /
      2. Verificar que texto está en inglés
      3. Cambiar a español
    Expected: Texto cambia a español sin reload
    Evidence: .sisyphus/evidence/task-8-i18n.png
  ```

  **Commit**: YES | Message: `feat(i18n): setup i18n with en/es translations` | Files: `apps/web-next/src/i18n/**`

- [ ] T9. Reconstruir Lobby (/connected/lobby)

  **What to do**:
  1. Crear `src/routes/connected/lobby/route.tsx`
  2. Implementar hook `useConnectedLcuInitialization` para suscribirse a estado de lobby
  3. Mostrar: miembros del lobby, estado de queue, invitaciones pendientes, preferencias de rol
  4. Acciones: crear/join/leave queue, invitar, kick, promover, cambiar roles
  5. Integrar con Data Dragon para icons de invocador
  6. Diseño básico: lista de miembros, botones de acción, estado actual

  **Must NOT do**:
  - NO diseño complejo de cards o animaciones
  - NO olvidar manejo de errores en acciones (ej. kick sin permisos)

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Lógica de lobby compleja, muchas acciones y estados
  - Skills: [] - Necesita entender LCU lobby API

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: - | Blocked By: T3, T7, T8

  **References**:
  - Route: `apps/web-next/src/routes/connected/lobby/route.tsx` (viejo)
  - Hook: `apps/web-next/src/features/connect/hooks/use-connected-lcu-initialization.ts` (viejo)
  - Utils: `apps/web-next/src/features/connect/hooks/use-connected-lcu-initialization-utils.ts` (viejo)

  **Acceptance Criteria**:
  - [ ] Lobby muestra lista de miembros con nombres e icons
  - [ ] Estado de queue visible (not in queue, in queue, etc.)
  - [ ] Botones de acción funcionan (join queue, invite, etc.)
  - [ ] Datos se actualizan en tiempo real vía LCU observer
  - [ ] Tests de integración pasan para lobby initialization

  **QA Scenarios**:
  ```
  Scenario: Lobby muestra datos
    Tool: Playwright
    Steps:
      1. Conectar y estar en lobby
      2. Verificar que muestra miembros y estado
    Expected: Lista de miembros visible, estado correcto
    Evidence: .sisyphus/evidence/task-9-lobby-data.png

  Scenario: Join queue desde lobby
    Tool: Playwright
    Steps:
      1. En lobby, click "Join Queue"
    Expected: Estado cambia a "In Queue", redirige a /connected/queue
    Evidence: .sisyphus/evidence/task-9-lobby-queue.png
  ```

  **Commit**: YES | Message: `feat(lobby): rebuild lobby page with lcu integration` | Files: `apps/web-next/src/routes/connected/lobby/**`, `apps/web-next/src/features/connect/hooks/use-connected-lcu-initialization.ts`

- [ ] T10. Reconstruir Queue (/connected/queue)

  **What to do**:
  1. Crear `src/routes/connected/queue/route.tsx`
  2. Implementar store `src/features/queue/queue-store.ts`
  3. Mostrar: tiempo en cola, tipo de queue, dodge penalty si aplica
  4. Acciones: cancelar queue
  5. Integrar con LCU observer para updates de queue
  6. Diseño básico: timer grande, botón cancelar, info de queue

  **Must NOT do**:
  - NO diseño elaborado de animaciones para timer
  - NO olvidar manejo de dodge penalty

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: Queue es relativamente simple comparado con lobby/champ-select
  - Skills: [] - No skills adicionales necesarias

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: - | Blocked By: T3, T7, T8

  **References**:
  - Store: `apps/web-next/src/features/queue/queue-store.ts` (viejo)
  - Component: `apps/web-next/src/features/queue/components/queue-screen.tsx` (viejo)

  **Acceptance Criteria**:
  - [ ] Queue muestra tiempo transcurrido correctamente
  - [ ] Botón "Cancel Queue" funciona y redirige a lobby
  - [ ] Dodge penalty se muestra si aplica
  - [ ] Datos se actualizan en tiempo real

  **QA Scenarios**:
  ```
  Scenario: Queue timer funciona
    Tool: Playwright
    Steps:
      1. Join queue desde lobby
      2. Verificar que timer incrementa
    Expected: Timer incrementa cada segundo, formato MM:SS
    Evidence: .sisyphus/evidence/task-10-queue-timer.png

  Scenario: Cancel queue
    Tool: Playwright
    Steps:
      1. En queue, click "Cancel"
    Expected: Queue cancelado, redirige a lobby
    Evidence: .sisyphus/evidence/task-10-queue-cancel.png
  ```

  **Commit**: YES | Message: `feat(queue): rebuild queue page with timer and cancel` | Files: `apps/web-next/src/routes/connected/queue/**`, `apps/web-next/src/features/queue/**`

- [ ] T11. Reconstruir Ready Check (/connected/ready-check)

  **What to do**:
  1. Crear `src/routes/connected/ready-check/route.tsx`
  2. Implementar store `src/features/ready-check/ready-check-store.ts`
  3. Mostrar: timer de cuenta regresiva, botones Accept/Decline
  4. Integrar con LCU observer para estado de ready-check
  5. Diseño básico: timer grande centrado, 2 botones grandes

  **Must NOT do**:
  - NO animaciones elaboradas (timer simple es suficiente)

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: Ready-check es la página más simple
  - Skills: [] - No skills adicionales necesarias

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: - | Blocked By: T7, T8

  **References**:
  - Store: `apps/web-next/src/features/ready-check/ready-check-store.ts` (viejo)
  - Component: `apps/web-next/src/features/ready-check/components/ready-check-modal.tsx` (viejo)

  **Acceptance Criteria**:
  - [ ] Ready-check muestra timer de cuenta regresiva
  - [ ] Botones Accept/Decline funcionan
  - [ ] Al expirar, muestra estado expirado
  - [ ] Datos se actualizan en tiempo real

  **QA Scenarios**:
  ```
  Scenario: Accept ready check
    Tool: Playwright
    Steps:
      1. Esperar ready-check
      2. Click "Accept"
    Expected: Acción enviada al LCU, estado actualizado
    Evidence: .sisyphus/evidence/task-11-accept.png

  Scenario: Timer expira
    Tool: Playwright
    Steps:
      1. Esperar ready-check sin clickear
    Expected: Timer llega a 0, muestra "Expired"
    Evidence: .sisyphus/evidence/task-11-expire.png
  ```

  **Commit**: YES | Message: `feat(ready-check): rebuild ready-check page with accept/decline` | Files: `apps/web-next/src/routes/connected/ready-check/**`, `apps/web-next/src/features/ready-check/**`

- [ ] T12. Reconstruir Invites (/connected/invites)

  **What to do**:
  1. Crear `src/routes/connected/invites/route.tsx`
  2. Implementar store `src/features/invites/invites-store.ts`
  3. Mostrar: lista de invitaciones pendientes con info del invitador
  4. Acciones: accept, decline
  5. Integrar con LCU observer para nuevas invitaciones
  6. Diseño básico: lista simple con botones por item

  **Must NOT do**:
  - NO notificaciones toast complejas (lista simple es suficiente)

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: Invites es relativamente simple
  - Skills: [] - No skills adicionales necesarias

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: - | Blocked By: T7, T8

  **References**:
  - Store: `apps/web-next/src/features/invites/invites-store.ts` (viejo)
  - Component: `apps/web-next/src/features/invites/components/invites-toast.tsx` (viejo)

  **Acceptance Criteria**:
  - [ ] Invites muestra lista de invitaciones pendientes
  - [ ] Accept/Decline funcionan por invitación
  - [ ] Nueva invitación aparece en tiempo real
  - [ ] Invitación aceptada desaparece de la lista

  **QA Scenarios**:
  ```
  Scenario: Accept invite
    Tool: Playwright
    Steps:
      1. Recibir invitación
      2. Click "Accept"
    Expected: Invitación desaparece, usuario entra al lobby
    Evidence: .sisyphus/evidence/task-12-accept.png
  ```

  **Commit**: YES | Message: `feat(invites): rebuild invites page with accept/decline` | Files: `apps/web-next/src/routes/connected/invites/**`, `apps/web-next/src/features/invites/**`

- [ ] T13. Reconstruir Champ Select (/connected/champ-select)

  **What to do**:
  1. Crear `src/routes/connected/champ-select/route.tsx`
  2. Implementar store `src/features/champ-select/champ-select-store.ts`
  3. Implementar store ARAM `src/features/champ-select/aram-store.ts` si aplica
  4. Mostrar: grid de campeones, timer de pick/ban, equipo aliado/enemigo, bench (ARAM)
  5. Acciones: pick, ban, reroll, bench swap, cambiar spells, skins, runes
  6. Integrar con Data Dragon para splashes, icons, spells, runes, skins
  7. Diseño básico: grid simple de campeones, panel lateral de info, botones de acción

  **Must NOT do**:
  - NO carousel de skins complejo (selector simple)
  - NO animaciones de pick/ban elaboradas
  - NO olvidar manejo de estados: pick turn, ban turn, waiting, done

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Champ select es la página más compleja con muchas interacciones
  - Skills: [] - Necesita entender LCU champ-select API

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: - | Blocked By: T3, T7, T8

  **References**:
  - Store: `apps/web-next/src/features/champ-select/champ-select-store.ts` (viejo)
  - Store: `apps/web-next/src/features/champ-select/aram-store.ts` (viejo)
  - Component: `apps/web-next/src/features/champ-select/components/champ-select-screen.tsx` (viejo)

  **Acceptance Criteria**:
  - [ ] Grid de campeños carga con Data Dragon assets
  - [ ] Pick/ban funciona en turno correspondiente
  - [ ] Timer de pick/ban visible y cuenta correctamente
  - [ ] ARAM: bench visible, reroll funciona
  - [ ] Spells y runes seleccionables
  - [ ] Skins muestran con Data Dragon
  - [ ] Tests de integración pasan para champ-select

  **QA Scenarios**:
  ```
  Scenario: Pick champion
    Tool: Playwright
    Steps:
      1. Entrar a champ-select
      2. Click en campeón disponible
      3. Click "Lock In"
    Expected: Campeón seleccionado, estado actualizado
    Evidence: .sisyphus/evidence/task-13-pick.png

  Scenario: Ban champion
    Tool: Playwright
    Steps:
      1. Entrar a champ-select en fase de ban
      2. Click en campeón enemigo
      3. Click "Ban"
    Expected: Campeón baneado, estado actualizado
    Evidence: .sisyphus/evidence/task-13-ban.png

  Scenario: ARAM reroll
    Tool: Playwright
    Steps:
      1. Entrar a champ-select ARAM
      2. Click "Reroll"
    Expected: Nuevo campeón asignado, bench actualizado
    Evidence: .sisyphus/evidence/task-13-reroll.png
  ```

  **Commit**: YES | Message: `feat(champ-select): rebuild champ-select with pick/ban/aram` | Files: `apps/web-next/src/routes/connected/champ-select/**`, `apps/web-next/src/features/champ-select/**`

- [x] T14. Reconstruir componentes UI base (shadcn primitives)

  **What to do**:
  1. Reconstruir `src/components/ui/button.tsx` - Botón básico con variants
  2. Reconstruir `src/components/ui/card.tsx` - Card container simple
  3. Reconstruir `src/components/ui/input.tsx` - Input text
  4. Reconstruir `src/components/ui/dropdown-menu.tsx` - Menú desplegable
  5. Reconstruir `src/components/ui/alert.tsx` - Alerta/error message
  6. Reconstruir `src/components/ui/skeleton.tsx` - Loading skeleton
  7. Reconstruir `src/components/ui/spinner.tsx` - Spinner de carga
  8. Usar `class-variance-authority` + `tailwind-merge` para variants
  9. Diseño ultra-básico: colores planos, bordes simples, sin gradientes

  **Must NOT do**:
  - NO componentes complejos no usados (mantener mínimo viable)
  - NO estilos elaborados (funcional primero)

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Componentes UI base necesitan ser consistentes
  - Skills: [] - No skills adicionales necesarias

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: T5, T9, T10, T11, T12, T13 | Blocked By: T1

  **References**:
  - Components: `apps/web-next/src/components/ui/` (viejo) - Referencia de API
  - Config: `apps/web-next/components.json` - Config de shadcn

  **Acceptance Criteria**:
  - [ ] Todos los componentes UI renderizan sin errores
  - [ ] Variants funcionan (primary, secondary, destructive, etc.)
  - [ ] Componentes son accesibles (keyboard navigation, aria labels)
  - [ ] Storybook o documentación mínima (opcional)

  **QA Scenarios**:
  ```
  Scenario: Componentes renderizan
    Tool: Playwright
    Steps: Renderizar página de demo con todos los componentes UI
    Expected: Todos los componentes visibles y funcionales
    Evidence: .sisyphus/evidence/task-14-components.png
  ```

  **Commit**: YES | Message: `feat(ui): rebuild base shadcn components with minimal styling` | Files: `apps/web-next/src/components/ui/**`

- [x] T15. Reconstruir AppShell, SafeArea, LandscapeWarning

  **What to do**:
  1. Reconstruir `src/components/layout/AppShell.tsx` - Shell principal de la app
  2. Reconstruir `src/components/layout/SafeArea.tsx` - Manejo de safe areas en móvil
  3. Reconstruir `src/components/layout/LandscapeWarning.tsx` - Advertencia en landscape
  4. Integrar en root layout
  5. Asegurar que funciona en móvil (safe areas, viewport)

  **Must NOT do**:
  - NO diseño elaborado del shell

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Layout crítico para móvil
  - Skills: [] - No skills adicionales necesarias

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: T5, T9, T10, T11, T12, T13 | Blocked By: T1

  **References**:
  - Components: `apps/web-next/src/components/layout/` (viejo)

  **Acceptance Criteria**:
  - [ ] AppShell envuelve toda la app correctamente
  - [ ] SafeArea respeta notch/areas seguras en móvil
  - [ ] LandscapeWarning muestra en orientación landscape
  - [ ] Layout es usable en viewport móvil (375x812)

  **QA Scenarios**:
  ```
  Scenario: Safe area en móvil
    Tool: Playwright
    Steps: Emular iPhone 12 (390x844) con notch
    Expected: Contenido respeta safe areas, no tapado por notch
    Evidence: .sisyphus/evidence/task-15-safearea.png
  ```

  **Commit**: YES | Message: `feat(layout): rebuild AppShell, SafeArea, and LandscapeWarning` | Files: `apps/web-next/src/components/layout/**`

- [x] T16. Migrar/adaptar tests unitarios e integración

  **What to do**:
  1. Evaluar cada test existente en `tests/unit/` y `tests/integration/`
  2. Decidir: keep, adapt, discard para cada uno
  3. Adaptar tests de protocolo (rift-handshake, lcu-transport) al nuevo código
  4. Adaptar tests de stores (gameflow-store, etc.) al nuevo código
  5. Adaptar tests de parsers/utils si aplica
  6. Escribir nuevos tests para código nuevo
  7. Asegurar que `bun test` pasa

  **Must NOT do**:
  - NO descartar tests que codifican comportamiento real del protocolo
  - NO escribir tests vacíos o con `it.skip`

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Evaluación de tests requiere juicio
  - Skills: [] - No skills adicionales necesarias

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: - | Blocked By: T2, T3, T4

  **References**:
  - Tests: `apps/web-next/tests/unit/` (viejo)
  - Tests: `apps/web-next/tests/integration/` (viejo)

  **Acceptance Criteria**:
  - [ ] Todos los tests unitarios pasan
  - [ ] Todos los tests de integración pasan
  - [ ] Cobertura de tests para nuevo código > 70%
  - [ ] Tests de protocolo preservan contratos

  **QA Scenarios**:
  ```
  Scenario: Tests unitarios pasan
    Tool: Bash
    Steps: cd apps/web-next && bun test tests/unit/
    Expected: exit code 0, todos los tests pasan
    Evidence: .sisyphus/evidence/task-16-unit.log

  Scenario: Tests de integración pasan
    Tool: Bash
    Steps: cd apps/web-next && bun test tests/integration/
    Expected: exit code 0, todos los tests pasan
    Evidence: .sisyphus/evidence/task-16-integration.log
  ```

  **Commit**: YES | Message: `test(unit+integration): migrate and adapt tests` | Files: `apps/web-next/tests/unit/**`, `apps/web-next/tests/integration/**`

- [ ] T17. Migrar/adaptar tests E2E con Playwright

  **What to do**:
  1. Evaluar cada test E2E existente en `tests/e2e/`
  2. Decidir: keep, adapt, discard para cada uno
  3. Adaptar tests de navegación y flujos críticos
  4. Escribir nuevos tests E2E para flujos nuevos
  5. Configurar projects de Playwright para móvil y desktop
  6. Asegurar que `bun run test:e2e` pasa

  **Must NOT do**:
  - NO tests E2E que dependen de estado externo no controlado

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: E2E tests requieren setup complejo
  - Skills: [] - No skills adicionales necesarias

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: - | Blocked By: T5, T9, T10, T11, T12, T13

  **References**:
  - Tests: `apps/web-next/tests/e2e/` (viejo)
  - Config: `apps/web-next/playwright.config.ts`

  **Acceptance Criteria**:
  - [ ] Tests E2E de navegación pasan
  - [ ] Tests E2E de flujo de conexión pasan
  - [ ] Tests E2E de lobby pasan
  - [ ] Tests E2E corren en viewport móvil (375x812)
  - [ ] Tests E2E corren en viewport desktop (1280x720)

  **QA Scenarios**:
  ```
  Scenario: E2E navigation
    Tool: Bash
    Steps: cd apps/web-next && bun run test:e2e
    Expected: exit code 0, todos los tests pasan
    Evidence: .sisyphus/evidence/task-17-e2e.log
  ```

  **Commit**: YES | Message: `test(e2e): migrate and adapt playwright tests` | Files: `apps/web-next/tests/e2e/**`

- [x] T18. Implementar PWA (manifest, service worker)

  **What to do**:
  1. Verificar que `vite-plugin-pwa` está configurado en `vite.config.ts`
  2. Crear/actualizar `public/manifest.webmanifest`
  3. Configurar iconos en `public/`
  4. Verificar que service worker se registra correctamente
  5. Testear instalación en móvil (o emulador)
  6. Verificar que `registerType: 'autoUpdate'` funciona

  **Must NOT do**:
  - NO modificar config de PWA en vite.config.ts (ya está configurado)

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: Configuración PWA straight-forward
  - Skills: [] - No skills adicionales necesarias

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: - | Blocked By: T1

  **References**:
  - Config: `apps/web-next/vite.config.ts` (config VitePWA)
  - Manifest: `apps/web-next/public/manifest.webmanifest` (viejo)
  - PWA: `apps/web-next/public/sw.js` (viejo)

  **Acceptance Criteria**:
  - [ ] Manifest válido y accesible en `/manifest.webmanifest`
  - [ ] Service worker se registra sin errores
  - [ ] App es instalable en móvil (Chrome/ Safari)
  - [ ] App funciona offline (al menos shell)

  **QA Scenarios**:
  ```
  Scenario: PWA manifest válido
    Tool: Bash
    Steps: curl http://localhost:5173/manifest.webmanifest
    Expected: JSON válido, iconos referenciados existen
    Evidence: .sisyphus/evidence/task-18-manifest.json

  Scenario: Service Worker registrado
    Tool: Playwright
    Steps:
      1. Navegar a /
      2. Abrir DevTools -> Application -> Service Workers
    Expected: SW registrado y activo
    Evidence: .sisyphus/evidence/task-18-sw.png
  ```

  **Commit**: YES | Message: `feat(pwa): configure PWA manifest and service worker` | Files: `apps/web-next/public/**`

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [ ] F1. Plan Compliance Audit — oracle
  - Verificar que todas las tareas del plan fueron implementadas
  - Verificar que no hay código copiado del src/ viejo
  - Verificar que el stack se mantuvo (React 19, TanStack Router, etc.)
  - Verificar que no hay cambios mayores al protocolo
  - Comando: `find apps/web-next/src -type f | wc -l` (debe haber archivos nuevos)
  - Comando: `git log --oneline --all -- apps/web-next/src | head -20`

- [ ] F2. Code Quality Review — unspecified-high
  - Ejecutar linter: `bun run lint` (debe pasar sin errores)
  - Verificar TypeScript strict: `bun --cwd apps/web-next run build` (sin errores TS)
  - Revisar que no hay `any` explícitos (Oxlint rule)
  - Revisar que no hay exports no-componentes desde routes
  - Revisar cobertura de tests > 70%

- [ ] F3. Real Manual QA — unspecified-high (+ playwright if UI)
  - Ejecutar todos los tests: `bun --cwd apps/web-next run test` (debe pasar)
  - Ejecutar tests E2E: `bun --cwd apps/web-next run test:e2e` (debe pasar)
  - Verificar flujo end-to-end: conexión -> lobby -> queue -> ready-check -> champ-select
  - Verificar responsive en móvil (375x812) y desktop (1280x720)
  - Verificar que PWA es instalable

- [ ] F4. Scope Fidelity Check — deep
  - Verificar que todas las funcionalidades "Must Have" están implementadas
  - Verificar que no se implementaron funcionalidades "Must NOT Have"
  - Verificar que diseño es ultra-básico (no hay rediseño sofisticado)
  - Verificar que Data Dragon está integrado
  - Verificar que i18n funciona

## Commit Strategy
- Cada tarea (T1-T18) tiene su propio commit con mensaje convencional (`type(scope): description`)
- Commits atómicos: un cambio lógico por commit
- No commit de archivos generados (`routeTree.gen.ts`, `dist/`, `node_modules/`)
- Final verification wave no genera commits (solo review)

## Success Criteria
- [ ] `bun --cwd apps/web-next run build` pasa sin errores
- [ ] `bun --cwd apps/web-next run test` pasa sin errores
- [ ] `bun --cwd apps/web-next run test:e2e` pasa sin errores
- [ ] Conexión a Rift funciona end-to-end en entorno local
- [ ] Lobby, Queue, Ready Check, Invites, Champ Select funcionan correctamente
- [ ] App es usable en móvil (375x812) y no rota en desktop (1280x720)
- [ ] PWA es instalable y funcional
- [ ] i18n funciona con al menos inglés y español
- [ ] Data Dragon assets se cargan correctamente
- [ ] El usuario aprueba explícitamente la versión final
