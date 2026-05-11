# Plan: Zustand State Optimization for Mimic web-next

## TL;DR
> **Summary**: Reestructurar completamente el estado de apps/web-next usando Zustand + persistencia, eliminar prop drilling en 4 rutas clave, centralizar persistencia ad-hoc (localStorage/sessionStorage) bajo `zustand/middleware`, y añadir 2 stores globales nuevos (`settings`, `session`).
> **Deliverables**: 12+ stores refactorizados, 2 stores nuevos, helper de persistencia centralizado, rutas sin prop drilling, tests de migración/hidratación.
> **Effort**: Large (3-4 días de trabajo agente)
> **Parallel**: YES - 4 waves de ejecución
> **Critical Path**: Wave 1 (infra + inventario) → Wave 2 (stores nuevos + persistencia) → Wave 3 (prop drilling + cross-store deps) → Wave 4 (verificación)

## Context
### Original Request
"Qué estados de la aplicación se podrían optimizar utilizando zustand y zustand con persistencia? pregunta todo lo que quieras para realizar un plan que pueda optimizarnos el código, repetición y en general mantenibilidad"

### Interview Summary
- **Prioridad**: Todas por igual (plan integral)
- **Alcance**: Completo (reestructuración total, no gradual)
- **Nuevos stores**: Theme + auth/session
- **Persistencia**: Definir por dominio en el plan
- **Patrón**: Mantener funciones actuales, evaluar class-based para stores grandes

### Metis Review (gaps addressed)
- **Discrepancia resuelta**: 12 stores Zustand propiamente dichos (no 14)
- **Riesgos mitigados**: persistence regression, over-globalizing, auth security, provider removal, store coupling
- **Guardrails**: NO persistir volatile League state, NO monolithic god store, NO globalizar UI state local
- **Migración obligatoria**: version + migrate + partialize para todo store con persistencia
- **RiftClientProvider**: AUDITAR antes de decidir; probablemente MANTENER como inyección de dependencias
- **Tests**: Añadir tests de hidratación, migración, storage corrupto, logout

## Work Objectives
### Core Objective
Reestructurar el estado de apps/web-next para maximizar mantenibilidad, eliminar duplicación y centralizar persistencia usando Zustand best practices.

### Deliverables
1. **Infraestructura de persistencia**: Helper `createPersistedStore` con configuración consistente
2. **Stores nuevos**: `settings-store.ts` (theme, idioma, prefs UI) + `session-store.ts` (auth/connection identity)
3. **Stores refactorizados**: 12 stores existentes con APIs públicas preservadas e internals modernizados
4. **Rutas sin prop drilling**: 4 rutas clave migradas a usar stores directamente
5. **Persistencia centralizada**: Todo ad-hoc localStorage/sessionStorage movido a zustand/persist
6. **Tests de migración**: Cobertura de hidratación, versión, corrupto, logout

### Definition of Done (verifiable conditions with commands)
- [ ] `bun run fmt:check` → exit 0
- [ ] `bun run lint` → exit 0
- [ ] `bun test apps/web-next/src` → 0 fallos
- [ ] `bun run build` → exit 0
- [ ] `bun run doctor:react:check` → exit 0
- [ ] 0 prop drilling en rutas auditadas (`connected`, `lobby`, `custom`, `champ-select`)
- [ ] 0 uso ad-hoc de localStorage/sessionStorage fuera de zustand/persist, EXCEPTO excepciones documentadas en T19 (ddragon-client.ts, debug.ts)
- [ ] Todos los stores con persistencia usan `version`, `migrate`, `partialize`
- [ ] Tests de migración pasan para legacy keys

### Must Have
- 12 stores existentes preservan APIs públicas (compatibilidad backward)
- 2 stores nuevos (settings, session) con persistencia definida
- 4 rutas sin prop drilling
- Helper de persistencia centralizado
- Tests de hidratación/migración/logout
- `RiftClientProvider` auditado y decisión documentada

### Must NOT Have (guardrails)
- NO monolithic god store (mantener dominios separados)
- NO persistir volatile League state (gameflow, ready-check, champ-select, queue, invites)
- NO globalizar UI state puramente local (sheet open/close sin cross-route need)
- NO cambiar keys de persistencia legacy sin migración
- NO remover `RiftClientProvider` sin audit lifecycle primero
- NO modificar backend `rift-next` ni `packages/protocol-contract`
- NO introducir nuevas librerías de estado (Redux, MobX, etc.)

### Scope Clarification
- **IN**: `apps/web-next/src/**`, `apps/web-next/tests/**`, `.sisyphus/evidence/**`
- **OUT**: legacy `web/`, `rift/`, `conduit/`, `apps/rift-next/`, `packages/protocol-contract/`

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- **Test decision**: tests-after + migración de tests existentes
- **Framework**: Bun native test runner
- **QA policy**: Cada tarea tiene escenarios ejecutados por agente
- **Evidence**: `.sisyphus/evidence/task-{N}-{slug}.{ext}`
- **Baseline commands**:
  ```bash
  bun run fmt:check
  bun run lint
  bun test apps/web-next/src
  bun run build
  bun run doctor:react:check
  ```

## Execution Strategy
### Parallel Execution Waves
> Target: 5-8 tasks per wave.

**Wave 1: Foundation & Audit**
- Inventario completo de stores, persistencia y prop drilling
- Auditoría de RiftClientProvider
- Creación del helper de persistencia
- Tests de baseline

**Wave 2: New Stores & Persistence Core**
- Implementar `settings-store.ts`
- Implementar `session-store.ts`
- Migrar persistencia ad-hoc a stores centralizados
- Tests de hidratación/migración

**Wave 3: Refactor & Prop Drilling Elimination**
- Refactorizar stores existentes (internals, no APIs)
- Eliminar prop drilling en 4 rutas
- Mover localStorage ad-hoc a persistencia Zustand

**Wave 4: Integration & Verification**
- Tests end-to-end de stores
- Verificación de build + lint + doctor
- Final verification wave (4 agents paralelos)

### Dependency Matrix
| Task | Blocks | Blocked By |
|------|--------|------------|
| T1 (Inventario) | - | - |
| T2 (Audit Provider) | - | - |
| T3 (Helper persist) | T5, T6, T7 | T1 |
| T4 (Tests baseline) | - | - |
| T5 (Settings store) | T8 | T3 |
| T6 (Session store) | T8 | T3 |
| T7 (Migrar persistencia) | T9-T15 | T3 |
| T8 (Tests hidratación) | - | T5, T6, T7 |
| T9-T15 (Refactor stores) | T16-T19 | T7 |
| T16-T19 (Eliminar prop drilling) | T20 | T9-T15 |
| T20 (Verificación final) | F1-F4 | T16-T19 |

### Agent Dispatch Summary
| Wave | Tasks | Categories |
|------|-------|------------|
| Wave 1 | 4 | deep, explore, quick |
| Wave 2 | 4 | deep, quick |
| Wave 3 | 7 | deep, quick |
| Wave 4 | 4 | unspecified-high, oracle |

## TODOs

- [x] 1. Inventario completo de estado y persistencia

  **What to do**: Auditar exhaustivamente todos los stores existentes, documentar: state shape, actions, persistencia usada, localStorage keys, tests asociados. Usar `lsp_find_references` y `ast_grep_search` para mapear todos los consumidores.
  **Must NOT do**: Modificar código; solo lectura y documentación.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: necesita explorar múltiples archivos y entender dependencias
  - Skills: [] - No skills especiales necesarias

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T3, T5-T7 | Blocked By: -

  **References**:
  - Stores: `src/core/state/rift-store.ts`, `src/core/state/gameflow-store.ts`
  - Features: `src/features/lobby/lobby-store.ts` → `src/features/champ-select/aram-store.ts` (12 archivos)
  - Grep: `localStorage|sessionStorage` en `src/**/*.ts`

  **Acceptance Criteria**:
  - [ ] Documento con tabla: Store | State Fields | Actions | Persistencia | Keys | Tests | Consumidores
  - [ ] Lista de prop drilling hotspots con líneas exactas
  - [ ] Lista de localStorage/sessionStorage ad-hoc con líneas exactas
  - [ ] Evidence: `.sisyphus/evidence/task-1-inventory.md`

  **QA Scenarios**:
  ```
  Scenario: Inventory completeness
    Tool: Bash
    Steps: grep -r "use[A-Z].*Store" src/ | wc -l
    Expected: >= 12 stores encontrados
    Evidence: .sisyphus/evidence/task-1-inventory.md

  Scenario: No mutations during inventory
    Tool: Bash
    Steps: git diff --name-only
    Expected: Empty (no files modified)
    Evidence: .sisyphus/evidence/task-1-inventory-git.diff
  ```

  **Commit**: NO

- [x] 5. Implementar settings-store.ts

  **What to do**: Crear `src/core/state/settings-store.ts` con: `theme` ('light'|'dark'|'system'), `language`, `showOfflineGroup` (migrado desde social-store), y cualquier otra pref UI durable. Usar `createPersistedStore` con `localStorage`, key `mimic:settings`, version 1.
  **Must NOT do**: Persistir estado de sesión o volatile; dejar `showOfflineGroup` en social-store (se elimina en T7).

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: requiere decidir shape del estado y migración desde social-store
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T8 | Blocked By: T3

  **References**:
  - Helper: `src/core/state/create-persisted-store.ts`
  - Social store: `src/features/social/social-store.ts:29-44`
  - Zustand skill: convenciones de acciones

  **Acceptance Criteria**:
  - [ ] Store creado con TypeScript strict
  - [ ] `theme` soporta 'light'|'dark'|'system'
  - [ ] `showOfflineGroup` con valor default `false`
  - [ ] `bun test` incluye test de persistencia
  - [ ] `partialize` solo incluye campos durables

  **QA Scenarios**:
  ```
  Scenario: Settings persist across reload
    Tool: Bash (test script)
    Steps:
      1. useSettingsStore.getState().setTheme('dark')
      2. Simular reload: reinicializar store con localStorage pre-poblado
      3. Assert theme === 'dark'
    Expected: Tema se recupera correctamente
    Evidence: .sisyphus/evidence/task-5-settings-persist.log

  Scenario: ShowOfflineGroup migration
    Tool: Bash (test script)
    Steps:
      1. localStorage.setItem('mimic:social:show-offline-group', 'true')
      2. Inicializar settings store
      3. Assert showOfflineGroup === true
    Expected: Valor legacy migrado correctamente
    Evidence: .sisyphus/evidence/task-5-migration.log
  ```

  **Commit**: YES | Message: `feat(state): add settings store with persistence` | Files: `src/core/state/settings-store.ts`, `tests/unit/settings-store.test.ts`

- [x] 6. Implementar session-store.ts

  **What to do**: Crear `src/core/state/session-store.ts` con: `deviceId` (migrado desde rift-client.ts), `connectionCode` (migrado desde rift-store.ts localStorage), `sessionCode` (migrado desde rift-store.ts sessionStorage), `returnUrl` (migrado desde rift-store.ts). `deviceId` y `connectionCode` en localStorage (`mimic:connection`), `sessionCode` y `returnUrl` en sessionStorage (`mimic:session`).
  **Must NOT do**: Persistir `status`, `error`, o estado de transporte (eso sigue en rift-store como volatile).

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: requiere separar identidad duradera de estado volatile
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T8 | Blocked By: T3

  **References**:
  - rift-store persistencia ad-hoc: `src/core/state/rift-store.ts:59-108`
  - rift-client deviceID: `src/core/rift/rift-client.ts:214-224`
  - Helper: `src/core/state/create-persisted-store.ts`

  **Acceptance Criteria**:
  - [ ] Store creado con campos separados por storage backend
  - [ ] `deviceId` se genera una sola vez si no existe
  - [ ] `connectionCode` migrado desde `CONNECTION_CODE_KEY`
  - [ ] `sessionCode` migrado desde `SESSION_CODE_KEY`
  - [ ] `returnUrl` migrado desde `RETURN_URL_KEY`
  - [ ] Tests de migración desde legacy keys

  **QA Scenarios**:
  ```
  Scenario: Device ID generation and reuse
    Tool: Bash (test script)
    Steps:
      1. Limpiar localStorage
      2. Inicializar session store
      3. Guardar deviceId1
      4. Reinicializar store
      5. Assert deviceId2 === deviceId1
    Expected: Device ID persistente y estable
    Evidence: .sisyphus/evidence/task-6-deviceid.log

  Scenario: Legacy key migration
    Tool: Bash (test script)
    Steps:
      1. localStorage.setItem('deviceID', 'legacy-device')
      2. localStorage.setItem('conduitID', 'legacy-code')
      3. sessionStorage.setItem('mimicSessionCode', '123456')
      4. Inicializar session store
      5. Assert deviceId === 'legacy-device', connectionCode === 'legacy-code', sessionCode === '123456'
    Expected: Migración exitosa desde keys legacy
    Evidence: .sisyphus/evidence/task-6-migration.log

  Scenario: Logout clears session but not settings
    Tool: Bash (test script)
    Steps:
      1. settingsStore.setTheme('dark'); sessionStore.setConnectionCode('abc')
      2. sessionStore.logout()
      3. Assert sessionStore.connectionCode === null
      4. Assert settingsStore.theme === 'dark'
    Expected: Solo session se limpia
    Evidence: .sisyphus/evidence/task-6-logout.log
  ```

  **Commit**: YES | Message: `feat(state): add session store with identity persistence` | Files: `src/core/state/session-store.ts`, `tests/unit/session-store.test.ts`

- [x] 7. Migrar persistencia ad-hoc a stores centralizados

  **What to do**: Eliminar todo uso directo de `localStorage`/`sessionStorage` fuera de Zustand. Migrar: `showOfflineGroup` (social-store → settings-store), `deviceID` (rift-client.ts → session-store), `connectionCode/sessionCode/returnUrl` (rift-store.ts → session-store). Reemplazar lecturas/escrituras en los stores originales por llamadas al nuevo store.
  **Must NOT do**: Borrar keys legacy sin guardar migración; romper funcionalidad durante transición.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: toca múltiples archivos core con alta risk
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T9-T15 | Blocked By: T3, T5, T6

  **References**:
  - social-store: `src/features/social/social-store.ts:29-44`
  - rift-store: `src/core/state/rift-store.ts:39-108`
  - rift-client: `src/core/rift/rift-client.ts:214-224`
  - ddragon-client: `src/core/http/ddragon-client.ts:145,268,277`
  - debug.ts: `src/core/debug.ts:13,23`

  **Acceptance Criteria**:
  - [ ] 0 `localStorage.getItem/setItem/removeItem` fuera de `createPersistedStore`
  - [ ] `social-store.ts` lee `showOfflineGroup` desde `settings-store` (selector)
  - [ ] `rift-store.ts` lee `code` desde `session-store`
  - [ ] `rift-client.ts` lee `deviceID` desde `session-store`
  - [ ] `ddragon-client.ts`: EVALUAR si mover a cache abstraction o dejar como está (documentar decisión)
  - [ ] `debug.ts`: EVALUAR si mover a settings-store o dejar como está
  - [ ] Tests pasan tras migración

  **QA Scenarios**:
  ```
  Scenario: Zero ad-hoc storage
    Tool: Bash
    Steps: grep -r "localStorage\|sessionStorage" src/ --include="*.ts" | grep -v "create-persisted-store" | grep -v "zustand" | grep -v "ddragon-client" | grep -v "debug.ts" | wc -l
    Expected: 0 (excepciones documentadas: ddragon-client.ts y debug.ts)
    Evidence: .sisyphus/evidence/task-7-zero-storage.log

  Scenario: Social store reads from settings
    Tool: Bash (test script)
    Steps:
      1. settingsStore.setShowOfflineGroup(true)
      2. Assert socialStore selector showOfflineGroup === true
    Expected: Integración correcta
    Evidence: .sisyphus/evidence/task-7-social-settings.log
  ```

  **Commit**: YES | Message: `refactor(state): centralize persistence in settings and session stores` | Files: `src/core/state/rift-store.ts`, `src/core/rift/rift-client.ts`, `src/features/social/social-store.ts`, `src/core/http/ddragon-client.ts` (opcional)

- [x] 8. Tests de hidratación, migración y storage corrupto

  **What to do**: Crear suite de tests para: (a) hidratación desde localStorage/sessionStorage, (b) migración desde legacy keys, (c) storage corrupto/malformed JSON no crashea, (d) storage unavailable (private mode), (e) version mismatch con migrate.
  **Must NOT do**: Asumir que localStorage siempre está disponible.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: tests complejos con mocks de storage
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: - | Blocked By: T5, T6, T7

  **References**:
  - Existing test pattern: `tests/unit/gameflow-store.test.ts`
  - Zustand persist testing: docs.pmnd.rs/zustand

  **Acceptance Criteria**:
  - [ ] Tests para cada store persistido: settings, session, lobby (existente)
  - [ ] Test de storage corrupto: assert no crashea, usa defaults
  - [ ] Test de storage unavailable: assert no crashea
  - [ ] Test de version migration: old shape → new shape
  - [ ] Todos los tests pasan

  **QA Scenarios**:
  ```
  Scenario: Corrupted storage recovery
    Tool: Bash (test script)
    Steps:
      1. localStorage.setItem('mimic:settings', 'not-json{{{')
      2. Inicializar settings store
      3. Assert theme === default
    Expected: No crashea, usa defaults
    Evidence: .sisyphus/evidence/task-8-corrupt.log

  Scenario: Version migration
    Tool: Bash (test script)
    Steps:
      1. localStorage.setItem('mimic:settings', JSON.stringify({ state: { theme: 'dark' }, version: 0 }))
      2. Inicializar settings store v1
      3. Assert theme === 'dark' (migrado)
    Expected: Migración exitosa entre versiones
    Evidence: .sisyphus/evidence/task-8-version.log
  ```

  **Commit**: YES | Message: `test(state): add hydration, migration and corruption tests` | Files: `tests/unit/persist-hydration.test.ts`, `tests/unit/persist-migration.test.ts`

- [x] 9. Refactorizar rift-store.ts (internals + integración con session-store)

  **What to do**: Reemplazar persistencia ad-hoc en `rift-store.ts` por lectura desde `session-store`. Separar estado volatile (`status`, `error`, `transport`) de identidad duradera (`code` → session-store). Simplificar actions si hay duplicación.
  **Must NOT do**: Cambiar API pública (export `useRiftStore` y sus selectores deben seguir funcionando); persistir `status`/`error`.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: core store con dependencias en todo el app
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: T16 | Blocked By: T7

  **References**:
  - rift-store: `src/core/state/rift-store.ts`
  - session-store: `src/core/state/session-store.ts`
  - Provider: `src/core/rift/rift-client-provider.tsx`

  **Acceptance Criteria**:
  - [ ] `rift-store.ts` ya no escribe/lee localStorage/sessionStorage directamente
  - [ ] `code` se lee desde `session-store` (selector o hook)
  - [ ] API pública preservada: todos los `useRiftStore` existentes siguen compilando
  - [ ] Tests de rift-store pasan

  **QA Scenarios**:
  ```
  Scenario: rift-store reads code from session
    Tool: Bash (test script)
    Steps:
      1. sessionStore.setConnectionCode('123456')
      2. Assert riftStore selectors que usan code funcionan
    Expected: Integración transparente
    Evidence: .sisyphus/evidence/task-9-rift-session.log
  ```

  **Commit**: YES | Message: `refactor(state): decouple rift-store from ad-hoc persistence` | Files: `src/core/state/rift-store.ts`

- [x] 10. Refactorizar gameflow-store.ts (reducers + selectors)

  **What to do**: Evaluar si `gameflow-store.ts` necesita modernización. Ya usa reducers puros, lo cual es bueno. Asegurar que NO se añade persistencia (gameflow es volatile). Añadir selectores memoizados si no existen.
  **Must NOT do**: Añadir persistencia a gameflow; cambiar API pública.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: ya está bien estructurado, solo validación
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: T16 | Blocked By: T7

  **References**:
  - gameflow-store: `src/core/state/gameflow-store.ts`
  - Tests: `tests/unit/gameflow-store.test.ts`

  **Acceptance Criteria**:
  - [ ] NO persistencia añadida
  - [ ] Selectores memoizados añadidos (si faltan)
  - [ ] API pública preservada
  - [ ] Tests pasan

  **QA Scenarios**:
  ```
  Scenario: Gameflow store remains volatile
    Tool: Read
    Steps: Verificar que no hay import de persist middleware
    Expected: 0 imports de persist
    Evidence: .sisyphus/evidence/task-10-gameflow.log
  ```

  **Commit**: YES (si hay cambios) | Message: `refactor(state): add memoized selectors to gameflow-store` | Files: `src/core/state/gameflow-store.ts`

- [x] 11. Refactorizar lobby-store.ts (simplificar persistencia)

  **What to do**: El `lobby-store.ts` ya usa `zustand/persist` con sessionStorage. Refactorizar para usar `createPersistedStore` helper. Evaluar si `sticky lobby` necesita sessionStorage o si debería ser volatile.
  **Must NOT do**: Cambiar key de persistencia sin migración.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: ya usa persist, solo normalizar
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: T16 | Blocked By: T7

  **References**:
  - lobby-store: `src/features/lobby/lobby-store.ts`
  - Helper: `src/core/state/create-persisted-store.ts`

  **Acceptance Criteria**:
  - [ ] Usa `createPersistedStore` en vez de `persist(create(...))` directo
  - [ ] `partialize` definido explícitamente
  - [ ] `version` y `migrate` si cambia shape
  - [ ] Tests pasan

  **QA Scenarios**:
  ```
  Scenario: Lobby store uses helper
    Tool: Read
    Steps: Verificar import de createPersistedStore
    Expected: Import presente, persist directo removido
    Evidence: .sisyphus/evidence/task-11-lobby.log
  ```

  **Commit**: YES | Message: `refactor(state): normalize lobby-store persistence` | Files: `src/features/lobby/lobby-store.ts`

- [x] 12. Refactorizar social-store.ts (eliminar persistencia ad-hoc)

  **What to do**: Eliminar toda lectura/escritura directa de localStorage en `social-store.ts`. `showOfflineGroup` ya migró a `settings-store`. Asegurar que social-store solo lee ese valor vía selector.
  **Must NOT do**: Dejar localStorage ad-hoc en social-store.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: ya se migró en T7, solo limpieza
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: T16 | Blocked By: T7

  **References**:
  - social-store: `src/features/social/social-store.ts`
  - settings-store: `src/core/state/settings-store.ts`

  **Acceptance Criteria**:
  - [ ] 0 `localStorage` en social-store
  - [ ] `showOfflineGroup` leído desde settings-store
  - [ ] API pública preservada
  - [ ] Tests pasan

  **QA Scenarios**:
  ```
  Scenario: Social store clean
    Tool: Bash
    Steps: grep "localStorage" src/features/social/social-store.ts
    Expected: Empty output
    Evidence: .sisyphus/evidence/task-12-social.log
  ```

  **Commit**: YES | Message: `refactor(state): remove ad-hoc persistence from social-store` | Files: `src/features/social/social-store.ts`

- [x] 13. Refactorizar champ-select-store.ts y aram-store.ts (evaluar slices)

  **What to do**: `champ-select-store.ts` es el store más grande (276 líneas). Evaluar si necesita dividirse en slices (ej: selection slice, session slice, error slice). `aram-store.ts` es más pequeño. Asegurar que NO se añade persistencia (volatile).
  **Must NOT do**: Persistir champ-select/ARAM state; cambiar API pública.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: análisis de si merece slices
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: T16 | Blocked By: T7

  **References**:
  - champ-select-store: `src/features/champ-select/champ-select-store.ts`
  - aram-store: `src/features/champ-select/aram-store.ts`

  **Acceptance Criteria**:
  - [ ] Decisión documentada: ¿slices o no? (con justificación)
  - [ ] Si slices: implementar sin cambiar API pública
  - [ ] NO persistencia añadida
  - [ ] Tests pasan

  **QA Scenarios**:
  ```
  Scenario: Champ-select store architecture documented
    Tool: Read
    Steps: Verificar archivo de decisión o comentarios en store
    Expected: Documentación de decisión de slices
    Evidence: .sisyphus/evidence/task-13-champ-select.md
  ```

  **Commit**: YES (si hay cambios) | Message: `refactor(state): evaluate champ-select-store slices` | Files: `src/features/champ-select/champ-select-store.ts`

- [x] 14. Refactorizar stores restantes (queue, ready-check, invites, swiftplay, custom, clash)

  **What to do**: Para cada uno de los 6 stores restantes: (a) verificar si usa persistencia (no deberían), (b) añadir selectores memoizados si faltan, (c) limpiar código duplicado, (d) asegurar tipado strict. Estos son stores pequeños, se pueden agrupar.
  **Must NOT do**: Añadir persistencia a ninguno; cambiar API pública.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: stores pequeños, cambios mecánicos
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: T16 | Blocked By: T7

  **References**:
  - queue-store: `src/features/queue/queue-store.ts`
  - ready-check-store: `src/features/ready-check/ready-check-store.ts`
  - invites-store: `src/features/invites/invites-store.ts`
  - swiftplay-store: `src/features/swiftplay/swiftplay-store.ts`
  - custom-store: `src/features/custom/custom-store.ts`
  - clash-store: `src/features/clash/clash-store.ts`

  **Acceptance Criteria**:
  - [ ] 0 persistencia en estos 6 stores
  - [ ] Selectores memoizados añadidos donde aplica
  - [ ] API pública preservada
  - [ ] Tests pasan para cada uno

  **QA Scenarios**:
  ```
  Scenario: No persistence in volatile stores
    Tool: Bash
    Steps: grep -l "persist" src/features/queue/queue-store.ts src/features/ready-check/ready-check-store.ts src/features/invites/invites-store.ts src/features/swiftplay/swiftplay-store.ts src/features/custom/custom-store.ts src/features/clash/clash-store.ts
    Expected: Empty output
    Evidence: .sisyphus/evidence/task-14-volatile.log
  ```

  **Commit**: YES | Message: `refactor(state): add selectors to volatile feature stores` | Files: `src/features/*/(*-store).ts` (6 archivos)

- [x] 15. Eliminar prop drilling en connected/route.tsx (social drawer state)

  **What to do**: Crear un store UI lightweight `ui-store.ts` (o usar settings-store) para manejar estado de UI cross-route como `isSocialDrawerOpen`. Reemplazar props `socialOpen/socialClose` en `connected/route.tsx` por lectura directa del store en componentes hijos.
  **Must NOT do**: Globalizar estado que solo vive en un componente leaf; crear store monolítico UI.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: requiere decidir boundary entre UI local y UI global
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: T16 | Blocked By: T9-T14

  **References**:
  - connected route: `src/routes/connected/route.tsx:18-139`
  - BottomSheet: buscar componente que recibe props

  **Acceptance Criteria**:
  - [ ] `connected/route.tsx` ya no pasa `socialOpen/socialClose` por props
  - [ ] BottomSheet lee estado desde store
  - [ ] API pública de componentes preservada (o actualizada)
  - [ ] Tests/rutas pasan

  **QA Scenarios**:
  ```
  Scenario: Social drawer via store
    Tool: Bash (test script)
    Steps:
      1. uiStore.setSocialDrawerOpen(true)
      2. Render connected route
      3. Assert BottomSheet is open
    Expected: Estado controlado por store, no props
    Evidence: .sisyphus/evidence/task-15-social-drawer.log
  ```

  **Commit**: YES | Message: `refactor(routes): remove prop drilling from connected route` | Files: `src/routes/connected/route.tsx`, `src/core/state/ui-store.ts` (nuevo)

- [x] 16. Eliminar prop drilling en lobby/route.tsx (sheet + overlay state)

  **What to do**: Identificar estado pasado por props en `lobby/route.tsx` (sheet state, invite overlay handlers). Mover a `ui-store.ts` o a stores de dominio si es compartido. Componentes hijos leen directamente del store.
  **Must NOT do**: Globalizar estado que solo usa un componente leaf.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: requiere análisis de qué props son UI cross-component
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: T20 | Blocked By: T15

  **References**:
  - lobby route: `src/routes/connected/lobby/route.tsx:34-254`

  **Acceptance Criteria**:
  - [ ] Lista de props eliminadas documentada
  - [ ] Componentes hijos leen desde store
  - [ ] Rutas pasan

  **QA Scenarios**:
  ```
  Scenario: Lobby route props eliminated
    Tool: Bash
    Steps: grep -n "socialOpen\|sheet\|overlay" src/routes/connected/lobby/route.tsx | grep "prop\|="
    Expected: Drástica reducción de prop passing
    Evidence: .sisyphus/evidence/task-16-lobby.log
  ```

  **Commit**: YES | Message: `refactor(routes): remove prop drilling from lobby route` | Files: `src/routes/connected/lobby/route.tsx`

- [x] 17. Eliminar prop drilling en custom/route.tsx (config + actions)

  **What to do**: Identificar estado pasado a `TeamPanel` y otros hijos en `custom/route.tsx`. Evaluar si `custom-store.ts` ya cubre esto o si necesita extenderse.
  **Must NOT do**: Duplicar estado entre route y store.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: custom store ya existe, verificar si falta integración
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: T20 | Blocked By: T15

  **References**:
  - custom route: `src/routes/connected/custom/route.tsx:19-251`
  - custom store: `src/features/custom/custom-store.ts`

  **Acceptance Criteria**:
  - [ ] Props pasadas a TeamPanel reducidas o eliminadas
  - [ ] custom-store usado directamente donde aplica
  - [ ] Rutas pasan

  **QA Scenarios**:
  ```
  Scenario: Custom route uses store
    Tool: Read
    Steps: Verificar que TeamPanel importa custom-store directamente
    Expected: Import presente
    Evidence: .sisyphus/evidence/task-17-custom.log
  ```

  **Commit**: YES | Message: `refactor(routes): remove prop drilling from custom route` | Files: `src/routes/connected/custom/route.tsx`

- [x] 18. Eliminar prop drilling en champ-select/route.tsx (picker state)

  **What to do**: Identificar estado pasado a `ChampionPicker` en `champ-select/route.tsx`. Evaluar si `champ-select-store.ts` ya cubre esto o necesita extenderse con estado de UI (filtros, búsqueda, etc.).
  **Must NOT do**: Persistir estado de UI temporal.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: champ-select es el más complejo, requiere cuidado
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: T20 | Blocked By: T15

  **References**:
  - champ-select route: `src/routes/connected/champ-select/route.tsx:25-232`
  - champ-select store: `src/features/champ-select/champ-select-store.ts`

  **Acceptance Criteria**:
  - [ ] Props a ChampionPicker reducidas
  - [ ] Estado de UI (filtros, búsqueda) en store o UI-store, NO persistido
  - [ ] Rutas pasan

  **QA Scenarios**:
  ```
  Scenario: Champ-select picker via store
    Tool: Read
    Steps: Verificar que ChampionPicker lee desde champ-select-store o ui-store
    Expected: No props de selección pasadas desde route
    Evidence: .sisyphus/evidence/task-18-champ-select.log
  ```

  **Commit**: YES | Message: `refactor(routes): remove prop drilling from champ-select route` | Files: `src/routes/connected/champ-select/route.tsx`

- [x] 19. Evaluar ddragon-client.ts y debug.ts

  **What to do**: Decidir si `ddragon-client.ts` (HTTP cache) y `debug.ts` (debug flag) deben moverse a Zustand persistencia o quedarse como están. Documentar decisión con justificación.
  **Must NOT do**: Mover sin justificación; ddragon cache es metadata de transporte, no UI state.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: decisión arquitectónica con tradeoffs
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: T20 | Blocked By: T7

  **References**:
  - ddragon-client: `src/core/http/ddragon-client.ts:145,268,277`
  - debug.ts: `src/core/debug.ts:13,23`

  **Acceptance Criteria**:
  - [ ] Decisión documentada: ddragon-client → Zustand? **NO** + justificación (cache HTTP, no UI state)
  - [ ] Decisión documentada: debug.ts → settings-store? **NO** + justificación (infra de debugging, no user preference)
  - [ ] Comentario en `ddragon-client.ts` explicando por qué queda fuera de Zustand
  - [ ] Comentario en `debug.ts` explicando por qué queda fuera de Zustand
  - [ ] Documento T19 referenciado desde DoD como lista oficial de excepciones

  **QA Scenarios**:
  ```
  Scenario: Documentation of decisions
    Tool: Read
    Steps: Verificar comentarios o archivo .sisyphus/evidence/task-19-decisions.md
    Expected: Decisiones documentadas con tradeoffs
    Evidence: .sisyphus/evidence/task-19-decisions.md
  ```

  **Commit**: YES | Message: `docs(state): document persistence scope for ddragon and debug` | Files: `src/core/http/ddragon-client.ts`, `src/core/debug.ts` (comentarios)

- [x] 20. Verificación completa: build, lint, tests, doctor

  **What to do**: Ejecutar el suite completo de verificación. Resolver cualquier error. Comparar con baseline de T4.
  **Must NOT do**: Ignorar errores de lint o typecheck.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: QA execution completo
  - Skills: []

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: F1-F4 | Blocked By: T16-T19

  **References**:
  - Baseline: `.sisyphus/evidence/task-4-baseline.log`
  - Scripts: `package.json`

  **Acceptance Criteria**:
  - [ ] `bun run fmt:check` → exit 0
  - [ ] `bun run lint` → exit 0
  - [ ] `bun test` → 0 fallos (mismo o más tests que baseline)
  - [ ] `bun run build` → exit 0
  - [ ] `bun run doctor:react:check` → exit 0
  - [ ] Reporte comparativo con baseline

  **QA Scenarios**:
  ```
  Scenario: Full verification suite
    Tool: Bash
    Steps:
      1. bun run fmt:check
      2. bun run lint
      3. bun test
      4. bun run build
      5. bun run doctor:react:check
    Expected: Todos exit 0
    Evidence: .sisyphus/evidence/task-20-verification.log
  ```

  **Commit**: NO (solo verificación)

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [x] F1. Plan Compliance Audit — oracle

  **What to verify**: ¿Se cumplió TODO el plan? ¿Faltó alguna tarea? ¿Se respetaron los guardrails (NO mega-store, NO persistir volatile, NO cambiar APIs públicas sin compatibilidad)?

  **Prompt**: "Review .sisyphus/plans/zustand-optimization.md against the actual code changes. Verify: all 20 tasks completed, guardrails respected, no scope creep, APIs preserved."

- [x] F2. Code Quality Review — unspecified-high

  **What to verify**: ¿El código sigue convenciones del proyecto? ¿TypeScript strict? ¿Oxlint pasa? ¿No hay any? ¿Nombres consistentes?

  **Prompt**: "Review all modified files in apps/web-next/src/ for code quality. Check: naming conventions, TypeScript strictness, no explicit any, consistent patterns with existing stores."

- [x] F3. Real Manual QA — unspecified-high (+ playwright if UI)

  **What to verify**: ¿La app funciona end-to-end? ¿Conexión, lobby, champ-select, custom game siguen operativos?

  **Prompt**: "Run the web-next app and verify key flows: connection screen, lobby, social drawer, champ select. Use playwright or manual bash verification. Check console for errors."

- [x] F4. Scope Fidelity Check — deep

  **What to verify**: ¿No hay cambios fuera del scope permitido (`apps/web-next/src/`, `apps/web-next/tests/`, `.sisyphus/evidence/`)? ¿No se modificó backend, legacy, o protocol?

  **Prompt**: "Verify that no files were modified outside apps/web-next/src/, apps/web-next/tests/, or .sisyphus/evidence/. Check git diff for scope creep. Verify packages/protocol-contract, apps/rift-next, web/, rift/, and conduit/ are untouched."

## Commit Strategy
- **Wave 1 commits**: T3 (helper) → mensaje claro de infraestructura
- **Wave 2 commits**: T5 (settings), T6 (session), T7 (migration centralizada), T8 (tests) → 4 commits independientes
- **Wave 3 commits**: T9-T14 (refactor stores), T15-T18 (prop drilling), T19 (evaluaciones) → agrupar por dominio
- **Wave 4**: NO commits (solo verificación)
- **Convención**: `type(scope): description` donde type ∈ {feat, refactor, test, docs}
- **Squash policy**: NO squash hasta después de F1-F4 aprobado; mantener historial granular para rollback

## Success Criteria
1. **Mantenibilidad**: 0 persistencia ad-hoc fuera de Zustand; 1 helper centralizado; APIs públicas estables
2. **Performance**: Selectores memoizados en stores grandes; no re-renders innecesarios por prop drilling
3. **Robustez**: Tests de hidratación, migración y corrupto pasan; logout limpia solo session
4. **Compatibilidad**: Keys legacy migrados sin pérdida de datos; usuarios existentes no ven regressions
5. **Calidad**: `bun run lint`, `bun test`, `bun run build`, `bun run doctor:react:check` → todos exit 0
6. **Scope**: Solo `apps/web-next/src/` y `apps/web-next/tests/` modificados; legacy web/, rift/, conduit/, rift-next, protocol-contract intactos
7. **Excepciones persistencia**: `ddragon-client.ts` y `debug.ts` permanecen con localStorage directo, documentados en T19 con justificación

## Decisions Record
| Decision | Rationale | Default/Confirmed |
|----------|-----------|-------------------|
| Stores separados por dominio | Oracle recomendó NO mega-store; mejor invalidación y tests | Default |
| NO persistir volatile League state | gameflow, queue, ready-check son runtime; persistir = stale | Default |
| MANTENER RiftClientProvider | Gestiona lifecycle de transport; mover a store = riesgo | Audit T2 |
| 2 stores nuevos: settings + session | Centralizan prefs UI e identidad duradera | User confirmed |
| Class-based slices: NO | Mantener funciones; evaluar solo para champ-select si crece | Default |
| ddragon-client: FUERA de Zustand | Es cache HTTP, no UI state | Decision T19 |
| debug.ts: FUERA de Zustand | Es infra de debugging, no user preference | Decision T19 |
| Theme: light/dark/system | Tres opciones, system como default | Default |
| Logout limpia session-store | Identidad de conexión es volátil; settings permanece | Default |

## Risk Mitigation
| Risk | Mitigation |
|------|------------|
| Persistence regression | version + migrate + tests de legacy keys (T8) |
| Over-globalizing UI state | UI-store lightweight solo para cross-route (T15) |
| Store coupling circular | Cross-store deps solo vía hooks/orquestación (T9) |
| Big-bang failure | Preservar APIs públicas; reversible si tests fallan |
| Auth security | NO persistir tokens sensibles; deviceId es identidad, no secret |


  **What to do**: Leer `rift-client-provider.tsx`, `rift-client.ts`, `hooks.ts` relacionados. Determinar si el provider gestiona lifecycle/subscriptions que NO deberían ir en un store. Documentar decisión: MANTENER, WRAP, o REMOVER.
  **Must NOT do**: Modificar el provider sin aprobación explícita del plan.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: análisis arquitectónico de lifecycle
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T16-T19 (si se decide remover/wrap) | Blocked By: -

  **References**:
  - Provider: `src/core/rift/rift-client-provider.tsx`
  - Client: `src/core/rift/rift-client.ts`
  - Store: `src/core/state/rift-store.ts`

  **Acceptance Criteria**:
  - [ ] Documento con: responsabilidades del provider, qué pasa si se remueve, riesgos, recomendación
  - [ ] Si recomendación es REMOVER: plan de migración a store
  - [ ] Evidence: `.sisyphus/evidence/task-2-provider-audit.md`

  **QA Scenarios**:
  ```
  Scenario: Lifecycle analysis
    Tool: Read
    Steps: Leer rift-client-provider.tsx líneas 1-48, rift-client.ts líneas 200-230
    Expected: Documento lista con todas las subscriptions/lifecycle identificadas
    Evidence: .sisyphus/evidence/task-2-provider-audit.md
  ```

  **Commit**: NO

- [x] 2. Auditoría de RiftClientProvider

- [x] 3. Crear helper de persistencia centralizado

  **What to do**: Crear `src/core/state/create-persisted-store.ts` que exporte una función `createPersistedStore` envolviendo `persist` middleware con configuración consistente: `name`, `version`, `storage`, `partialize`, `migrate`. Usar naming convention `mimic:{domain}`.
  **Must NOT do**: Persistir objetos no serializables; dejar `partialize` obligatorio.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: utilidad pequeña y bien definida
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T5, T6, T7 | Blocked By: T1

  **References**:
  - Zustand persist docs: https://docs.pmnd.rs/zustand/integrations/persisting-store-data
  - Skill Zustand: convenciones de naming y middleware
  - Existing persist: `src/features/lobby/lobby-store.ts:156`

  **Acceptance Criteria**:
  - [ ] Archivo creado con TypeScript strict, tipado correcto
  - [ ] Soporta localStorage y sessionStorage
  - [ ] Requiere `partialize` en tipos (no opcional)
  - [ ] Exporta `PersistedStoreOptions<T>` para tipado
  - [ ] `bun run lint` pasa

  **QA Scenarios**:
  ```
  Scenario: Helper creation and typing
    Tool: Bash
    Steps: bun run tsc --noEmit en apps/web-next
    Expected: 0 errores de tipo
    Evidence: .sisyphus/evidence/task-3-helper.ts

  Scenario: Partialize enforcement
    Tool: Read
    Steps: Verificar que createPersistedStore requiere partialize en sus tipos
    Expected: Error de compilación si se omite partialize
    Evidence: .sisyphus/evidence/task-3-types.txt
  ```

  **Commit**: YES | Message: `feat(state): add createPersistedStore helper` | Files: `src/core/state/create-persisted-store.ts`

- [x] 4. Tests baseline y snapshots

  **What to do**: Ejecutar test suite actual, guardar resultados como baseline. Contar tests existentes por store. Crear snapshot de coverage.
  **Must NOT do**: Modificar tests existentes.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: solo ejecutar y reportar
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T8 | Blocked By: -

  **References**:
  - Tests: `tests/unit/*-store.test.ts`
  - Script: `package.json` → `test`

  **Acceptance Criteria**:
  - [ ] `bun test` ejecutado con output guardado
  - [ ] Tabla: Store | Tests existentes | Estado (pass/fail)
  - [ ] Evidence: `.sisyphus/evidence/task-4-baseline.json`

  **QA Scenarios**:
  ```
  Scenario: Baseline test run
    Tool: Bash
    Steps: cd apps/web-next && bun test 2>&1 | tee baseline.log
    Expected: Todos los tests actuales pasan
    Evidence: .sisyphus/evidence/task-4-baseline.log
  ```

  **Commit**: NO

