# Carpeta Desconectados (Offline Folder) - SocialPanel

## TL;DR
> **Summary**: Implementar un grupo virtual "Desconectados" en el SocialPanel que extrae automáticamente los amigos offline de sus grupos originales. Incluye un menú de configuración con toggle persistido en localStorage, activado por defecto.
> **Deliverables**: `social-store.ts` actualizado, `SocialPanel.tsx` con menú y lógica de agrupamiento, traducciones i18n, tests unitarios.
> **Effort**: Short
> **Parallel**: NO
> **Critical Path**: Estado del toggle → Lógica de agrupamiento → UI del menú → Traducciones → Tests

## Context
### Original Request
Hacer que la carpeta de desconectados funcione correctamente como en LOL: todos los desconectados ahí, y si se conecta alguien, moverlo de vuelta a su grupo original.

### Interview Summary
- **Comportamiento**: Offline friends se mueven COMPLETAMENTE a "Desconectados", no se duplican.
- **Posición**: El grupo "Desconectados" va SIEMPRE al final de la lista.
- **Visibilidad**: Se oculta cuando no hay amigos offline (contador = 0).
- **Configuración**: Toggle/checkbox en un menú contextual dentro del panel Social (como LOL).
- **Persistencia**: Sí, en localStorage.
- **Valor por defecto**: Activado.

### Metis Review (gaps addressed)
- **Persistencia**: Confirmado localStorage.
- **Clave estable**: El grupo virtual usará una clave interna `__offline__`, nunca el texto traducido.
- **Colisión de nombres**: Si un grupo real de LCU se llama "Offline"/"Desconectados", el virtual no colisiona gracias a la clave interna.
- **Comportamiento toggle off**: Los offline vuelven a sus grupos originales (comportamiento actual preservado).
- **Grupos vacíos**: Si un grupo queda vacío tras extraer offline, sigue el comportamiento actual del componente.

## Work Objectives
### Core Objective
Implementar un grupo virtual "Desconectados" extraído client-side, configurable y persistido, sin modificar datos de LCU ni el protocolo.

### Deliverables
1. `social-store.ts` con `showOfflineGroup` persistido vía localStorage.
2. `SocialPanel.tsx` con menú de settings y lógica de agrupamiento offline.
3. Traducciones en `en.ts` y `es.ts`.
4. Tests unitarios para la lógica de agrupamiento.

### Definition of Done
- [x] Al activar el toggle, los amigos `status === 'offline'` se mueven a un grupo "Desconectados" al final de la lista.
- [x] Al desactivar el toggle, los amigos offline vuelven a sus grupos originales.
- [x] El grupo "Desconectados" no aparece si no hay amigos offline.
- [x] La preferencia del toggle persiste en localStorage.
- [x] El toggle está activado por defecto.
- [x] Las traducciones funcionan en inglés y español.
- [x] Los tests pasan (`bun test`).

### Must Have
- Toggle configurable en menú del SocialPanel.
- Persistencia localStorage.
- Agrupamiento virtual client-side.
- Traducciones i18n.

### Must NOT Have
- Modificación de LCU parsing, protocolo, o servidor.
- Persistencia en servidor o base de datos.
- Cambios en el ordenamiento de grupos originales.
- Feature flags o AB testing.

## Verification Strategy
- **Test decision**: Tests-after + agent QA
- **Framework**: Bun native test runner
- **QA policy**: Cada task tiene escenarios agent-ejecutables
- **Evidence**: Screenshots de UI y output de tests

## Execution Strategy
### Parallel Execution Waves
Wave 1: Estado y traducciones (independientes)
Wave 2: Lógica de agrupamiento y UI del menú (dependen de Wave 1)
Wave 3: Tests y verificación (dependen de Wave 2)

### Dependency Matrix
| Task | Depende de |
|------|-----------|
| 1 (social-store) | Ninguno |
| 2 (traducciones) | Ninguno |
| 3 (groupFriends refactor) | 1, 2 |
| 4 (menú UI) | 1, 3 |
| 5 (tests) | 1, 2, 3 |
| F1-F4 (verificación) | 1-5 |

### Agent Dispatch Summary
- Wave 1: 2 tareas (quick/unspecified-low)
- Wave 2: 2 tareas (quick/unspecified-low)
- Wave 3: 1 tarea (quick)

## TODOs

- [x] 1. Persistir `showOfflineGroup` en `social-store.ts`

  **What to do**: Añadir `showOfflineGroup: boolean` al estado de Zustand con valor por defecto `true`. Implementar persistencia vía localStorage usando `zustand/middleware` (persist) o manualmente en el store. La clave de localStorage debe ser `mimic:social:show-offline-group`.

  **Must NOT do**: No modificar otras propiedades del store. No usar `any`.

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: [`zustand`]
  - Omitted: [`tanstack-query-best-practices`] - no aplica

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 3, 4 | Blocked By: Ninguno

  **References**:
  - Pattern: `src/features/social/social-store.ts:25-36` - Estado actual del store
  - API: `zustand/middleware` - `persist` middleware
  - External: https://docs.pmnd.rs/zustand/guides/persisting-store-data

  **Acceptance Criteria**:
  - [ ] El store exporta `showOfflineGroup: boolean` con valor por defecto `true`
  - [ ] La preferencia se lee de localStorage al inicializar
  - [ ] La preferencia se escribe en localStorage al cambiar
  - [ ] `bun test` pasa (si hay tests existentes del store)

  **QA Scenarios**:
  ```
  Scenario: Valor por defecto
    Tool: Bash
    Steps: Leer estado inicial del store
    Expected: `showOfflineGroup === true`
    Evidence: .sisyphus/evidence/task-1-default.png

  Scenario: Persistencia
    Tool: Bash
    Steps: 1. Cambiar a false. 2. Recargar store. 3. Verificar valor.
    Expected: `showOfflineGroup === false` tras recargar
    Evidence: .sisyphus/evidence/task-1-persist.png
  ```

  **Commit**: YES | Message: `feat(social): add showOfflineGroup toggle state with localStorage persistence` | Files: `src/features/social/social-store.ts`

- [x] 2. Añadir traducciones i18n para grupo offline y menú

  **What to do**: Añadir claves `social.group.offline` y `social.settings.showOfflineGroup` en `en.ts` y `es.ts`. Los valores deben ser:
  - `social.group.offline`: `"Offline"` (en) / `"Desconectados"` (es)
  - `social.settings.showOfflineGroup`: `"Show offline group"` (en) / `"Mostrar grupo desconectado"` (es)

  **Must NOT do**: No modificar otras claves de traducción. No hardcodear texto en el componente.

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: []
  - Omitted: [`zustand`]

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 3, 4 | Blocked By: Ninguno

  **References**:
  - Pattern: `src/i18n/translations/en.ts:405-414` - Estructura actual
  - Pattern: `src/i18n/translations/es.ts:394-403` - Estructura actual

  **Acceptance Criteria**:
  - [ ] `social.group.offline` existe en ambos archivos
  - [ ] `social.settings.showOfflineGroup` existe en ambos archivos
  - [ ] `bun run lint` pasa sin errores

  **QA Scenarios**:
  ```
  Scenario: Traducciones cargadas
    Tool: Bash
    Steps: grep por las nuevas claves en ambos archivos
    Expected: Las claves existen con los valores correctos
    Evidence: .sisyphus/evidence/task-2-i18n.txt
  ```

  **Commit**: YES | Message: `feat(i18n): add offline group and settings translations` | Files: `src/i18n/translations/en.ts`, `src/i18n/translations/es.ts`

- [x] 3. Refactorizar `groupFriends()` para soportar extracción de offline

  **What to do**: Modificar `groupFriends()` en `SocialPanel.tsx` para que acepte un parámetro `showOfflineGroup: boolean`. Cuando es `true`:
  1. Filtrar amigos `status === 'offline'` del array original.
  2. Crear un grupo virtual con clave interna `__offline__` al final.
  3. Los amigos offline SOLO aparecen en este grupo (no duplicados).
  4. Los grupos originales mantienen su orden; el virtual va SIEMPRE al final.
  Cuando es `false`, comportamiento actual sin cambios.

  **Must NOT do**: No modificar `Friend` type. No modificar LCU parsing. No hardcodear `"Desconectados"`.

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: [`typescript-advanced-types`]
  - Omitted: [`zustand`]

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 4, 5 | Blocked By: 1, 2

  **References**:
  - Pattern: `src/features/social/components/SocialPanel.tsx:56-64` - `groupFriends()` actual
  - Type: `src/features/social/social-store.ts:8-15` - `Friend` type

  **Acceptance Criteria**:
  - [ ] `groupFriends()` acepta tercer parámetro `showOfflineGroup: boolean`
  - [ ] Con `true`, offline friends solo en grupo `__offline__` al final
  - [ ] Con `false`, comportamiento idéntico al actual
  - [ ] El grupo `__offline__` no aparece si no hay offline friends

  **QA Scenarios**:
  ```
  Scenario: Extracción de offline
    Tool: Bash (unit test)
    Steps: Crear fixture: Alice(Ranked, online), Bob(Ranked, offline), Carla(IRL, offline)
    Expected: Con true: Ranked=[Alice], IRL=[], __offline__=[Bob, Carla]
    Evidence: .sisyphus/evidence/task-3-grouping.test.ts

  Scenario: Toggle off preserva comportamiento
    Tool: Bash (unit test)
    Steps: Mismo fixture, showOfflineGroup=false
    Expected: Ranked=[Alice, Bob], IRL=[Carla], sin grupo __offline__
    Evidence: .sisyphus/evidence/task-3-grouping-off.test.ts

  Scenario: Sin amigos offline
    Tool: Bash (unit test)
    Steps: Fixture sin offline, showOfflineGroup=true
    Expected: Sin grupo __offline__ en el output
    Evidence: .sisyphus/evidence/task-3-no-offline.test.ts
  ```

  **Commit**: YES | Message: `feat(social): add offline group extraction logic` | Files: `src/features/social/components/SocialPanel.tsx`

- [x] 4. Implementar menú de settings en SocialPanel header

  **What to do**: Añadir un botón de menú (ícono de engranaje o tres puntos) en el header del SocialPanel que abra un dropdown/popover con un checkbox toggle para "Mostrar grupo desconectado". Usar componentes UI existentes (Button, posiblemente crear un simple dropdown con `div` o usar shadcn DropdownMenu si existe). El toggle debe leer/escribir `showOfflineGroup` del Zustand store.

  **Must NOT do**: No crear un sistema de settings global. No modificar layout general del panel.

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: [`react-patterns`]
  - Omitted: [`zustand`]

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 5 | Blocked By: 1, 3

  **References**:
  - Pattern: `src/features/social/components/SocialPanel.tsx:136-155` - Header actual
  - Component: `src/components/ui/button.tsx` - Botón existente
  - Translation: `src/i18n/translations/es.ts:394-403` - Claves de social

  **Acceptance Criteria**:
  - [ ] Botón de menú visible en header del SocialPanel
  - [ ] Dropdown se abre al hacer click
  - [ ] Checkbox refleja el estado actual de `showOfflineGroup`
  - [ ] Cambiar el checkbox actualiza el store inmediatamente
  - [ ] El dropdown se cierra al hacer click fuera

  **QA Scenarios**:
  ```
  Scenario: Abrir menú y toggle
    Tool: Playwright
    Steps: 1. Render SocialPanel. 2. Click botón menú. 3. Click checkbox. 4. Verificar que offline friends se mueven.
    Expected: Checkbox cambia de estado y la UI actualiza inmediatamente
    Evidence: .sisyphus/evidence/task-4-menu-toggle.png

  Scenario: Accesibilidad
    Tool: Playwright
    Steps: Verificar aria-labels y roles del menú y checkbox
    Expected: Menú tiene role="menu", checkbox tiene aria-checked
    Evidence: .sisyphus/evidence/task-4-a11y.png
  ```

  **Commit**: YES | Message: `feat(social): add offline group settings menu to SocialPanel` | Files: `src/features/social/components/SocialPanel.tsx`

- [x] 5. Añadir tests unitarios para agrupamiento offline

  **What to do**: Crear archivo de test `src/features/social/components/SocialPanel.test.ts` (o similar) que testee `groupFriends()` con los escenarios: extracción de offline, toggle off, sin offline friends, grupo vacío tras extracción. Usar el test runner nativo de Bun.

  **Must NOT do**: No testear componente React completo (sin DOM). Solo la función pura.

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: []
  - Omitted: [`playwright`]

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: F1-F4 | Blocked By: 1, 2, 3

  **References**:
  - Pattern: `src/features/social/components/SocialPanel.tsx:56-64` - `groupFriends()`
  - Test convention: `*.test.ts` naming, Bun native runner

  **Acceptance Criteria**:
  - [ ] Tests ejecutan con `bun test` y pasan
  - [ ] Cubren al menos 4 escenarios: extracción, toggle off, sin offline, grupo vacío
  - [ ] No hay `any` o supresiones de lint

  **QA Scenarios**:
  ```
  Scenario: Ejecutar tests
    Tool: Bash
    Steps: `bun test src/features/social/components/SocialPanel.test.ts`
    Expected: Todos los tests pasan (0 failures)
    Evidence: .sisyphus/evidence/task-5-tests.txt
  ```

  **Commit**: YES | Message: `test(social): add unit tests for offline group extraction` | Files: `src/features/social/components/SocialPanel.test.ts`

## Final Verification Wave
- [x] F1. Plan Compliance Audit — oracle: Verificar que no se modificó LCU parsing, protocolo, ni servidor.
- [x] F2. Code Quality Review — unspecified-high: Revisar que no hay `any`, que las traducciones están completas, que la lógica es pura.
- [x] F3. Real Manual QA — unspecified-high + playwright: Abrir SocialPanel, verificar que el menú funciona, toggle on/off, offline friends se mueven correctamente.
- [x] F4. Scope Fidelity Check — deep: Confirmar que todo está client-side, que no hay duplicación de amigos, que el grupo va al final.

## Commit Strategy
Commits incrementales por task. Message format: `type(scope): desc`
- Task 1: `feat(social): add showOfflineGroup toggle state with localStorage persistence`
- Task 2: `feat(i18n): add offline group and settings translations`
- Task 3: `feat(social): add offline group extraction logic`
- Task 4: `feat(social): add offline group settings menu to SocialPanel`
- Task 5: `test(social): add unit tests for offline group extraction`

## Success Criteria
- [x] Los amigos offline se mueven automáticamente al grupo "Desconectados" cuando el toggle está activo.
- [x] Vuelven a sus grupos originales cuando el toggle se desactiva o cuando su status cambia a online/away.
- [x] El grupo "Desconectados" va siempre al final y se oculta cuando no hay offline friends.
- [x] La preferencia persiste en localStorage.
- [x] El toggle está activado por defecto.
- [x] Las traducciones funcionan en inglés y español.
- [x] Los tests pasan.
- [x] No se modificó código de servidor, protocolo, ni parsing LCU.
