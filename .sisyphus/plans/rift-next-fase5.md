# Plan: Fase 5 — Effect Puro Completo (apps/rift-next)

## TL;DR

> **Summary**: Eliminar todo código imperativo restante en `apps/rift-next/src`, migrando `database.ts`, `realtime.ts`, `env-config.ts` e `index.ts` a Effect puro. Elysia permanece como único boundary imperativo.
> **Deliverables**: 0 `Effect.runSync` en `src/`, errores como `Data.TaggedError`, `RealtimeDependencies` con Effect, tests para env-config.
> **Effort**: Medium
> **Parallel**: YES — 3 waves
> **Critical Path**: Wave 1 (database/env) → Wave 2 (realtime deps) → Wave 3 (index integration)

## Context

### Original Request

Migrar toda la codebase de `apps/rift-next` a Effect puro, manteniendo Elysia como backend.

### Interview Summary

- Usuario confirmó: "cambia toda la codebase para que sea effect puro, siempre elysia como be pero effect"
- Scope: `apps/rift-next` únicamente
- Preservar comportamiento observable (WS, HTTP, JWT)

### Metis Review (gaps addressed)

- **Hallazgo crítico**: `database.ts` contiene bridge síncrono con `Effect.runSync` que debe migrarse para lograr "effect puro"
- **Hallazgo crítico**: `RealtimeDependencies` (`lookup`, `potentiallyUpdate`, `verifyToken`) son síncronos; deben volverse Effect-returning
- **Hallazgo crítico**: servicio `realtime` se crea en module load con `Effect.runSync` (index.ts:269-278)
- **Riesgo**: cambiar `handleConduitOpen` de sync a Effect puede romper cierre de socket en auth fallido
- **Mitigación**: Elysia WS handler sigue siendo boundary; solo `index.ts` ejecuta Effects en handlers
- **Guardrail**: acceptance criteria incluye scan de `Effect.runSync` con count === 0 en `src/`

## Work Objectives

### Core Objective

Eliminar todo `Effect.runSync` de `apps/rift-next/src/` y migrar dependencias síncronas a Effect, preservando comportamiento observable de HTTP, WS y DB.

### Deliverables

1. `database.ts` migrado a Effect puro (o deprecado si `database-service.ts` lo reemplaza)
2. `RealtimeDependencies` con métodos Effect-returning
3. `RiftRealtimeManager` eliminado o convertido a funciones puras
4. `env-config.ts` con errores `Data.TaggedError` y tests directos
5. `index.ts` sin `Effect.runSync`, sin creación de servicios en module load
6. `realtime-schemas.ts` sin cast `as RiftFrame`
7. Scan automatizado: 0 `Effect.runSync` en `apps/rift-next/src/`

### Definition of Done

```bash
# Build exit 0
cd apps/rift-next && bun run build

# Todos los tests pasan
cd apps/rift-next && bun test

# 0 runSync en src/
bun -e "const fs=require('node:fs'),path=require('node:path');function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{const p=path.join(d,e.name);return e.isDirectory()?walk(p):p.endsWith('.ts')?[p]:[]})}const hits=walk('apps/rift-next/src').flatMap(f=>fs.readFileSync(f,'utf8').split('\n').map((l,i)=>({f,i:i+1,l})).filter(x=>/Effect\.runSync|runSyncExit/.test(x.l)));console.log('DISALLOWED_RUNSYNC='+hits.length);if(hits.length){console.log(hits.map(h=>\`${h.f}:${h.i}:${h.l.trim()}\`).join('\n'));process.exit(1)}"
# Expected: DISALLOWED_RUNSYNC=0
```

### Must Have

- Comportamiento HTTP/WS idéntico al observable externamente
- Todos los errores nuevos usan `Data.TaggedError`
- Tests de regresión pasan

### Must NOT Have

- Ningún `Effect.runSync` en `apps/rift-next/src/` (excepto documentado explícitamente con justificación)
- Cambios en protocolo WS, schema DB, semantics JWT
- Cambios en respuestas HTTP status/body
- Nuevas abstracciones runtime custom

## Verification Strategy

- **Test decision**: tests-after (infra ya existe) + Bun native runner
- **QA policy**: Cada tarea tiene escenarios happy + failure
- **Evidence**: `.sisyphus/evidence/fase5-task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves

**Wave 1**: Foundation — database bridge y config
**Wave 2**: Realtime — dependencias y manager  
**Wave 3**: Integration — index.ts y verificación global

### Dependency Matrix

| Task                         | Blocks | Blocked By |
| ---------------------------- | ------ | ---------- |
| T1 (database effect)         | T4, T6 | —          |
| T2 (env-config errors)       | T7     | —          |
| T3 (env-config tests)        | —      | T2         |
| T4 (realtime-deps effect)    | T5, T6 | T1         |
| T5 (eliminate manager)       | T6     | T4         |
| T6 (index.ts cleanup)        | —      | T1, T4, T5 |
| T7 (realtime-schemas cast)   | —      | —          |
| T8 (remaining tagged errors) | —      | —          |

### Agent Dispatch Summary

- Wave 1: 3 tasks (deep, deep, quick)
- Wave 2: 2 tasks (deep, quick)
- Wave 3: 3 tasks (deep, quick, quick)

## TODOs

- [x] 1. Migrar `database.ts` a Effect puro

  **What to do**:
  - Reemplazar `Effect.runSync` en `initializeDatabase`, `generateCode`, `lookup`, `potentiallyUpdate` con operaciones Effect puras
  - Exportar funciones que devuelvan `Effect.Effect<..., DatabaseError>` en vez de valores síncronos
  - Si `database-service.ts` ya provee equivalentes, deprecar `database.ts` y redirigir consumidores

  **Must NOT do**:
  - No cambiar schema SQLite
  - No modificar `database-service.ts` salvo para exponer APIs que `database.ts` necesite

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: requiere entender bridge sync→async y consumidores
  - Skills: `[]` — No skills específicas necesarias

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T4, T6 | Blocked By: —

  **References**:
  - Pattern: `src/core/database/database.ts` — bridge sync actual
  - Pattern: `src/core/database/database-service.ts` — servicio Effect existente
  - Consumer: `src/index.ts:242-267` — `realtimeDeps` usa `lookup`, `potentiallyUpdate`

  **Acceptance Criteria**:
  - [ ] `grep -E 'Effect\.runSync|runSyncExit' apps/rift-next/src/core/database/database.ts` retorna 0 líneas
  - [ ] `bun test apps/rift-next/tests/unit/database-live.test.ts` pasa
  - [ ] Build exit 0

  **QA Scenarios**:

  ```
  Scenario: database.ts sin runSync
    Tool: Bash
    Steps: grep -E 'Effect\.runSync|runSyncExit' apps/rift-next/src/core/database/database.ts | wc -l
    Expected: 0
    Evidence: .sisyphus/evidence/fase5-t1-qa-runsync.txt

  Scenario: Tests de DB pasan tras migración
    Tool: Bash
    Steps: cd apps/rift-next && bun test tests/unit/database-live.test.ts 2>&1
    Expected: output contiene "pass" y 0 "fail"
    Evidence: .sisyphus/evidence/fase5-t1-qa-tests.txt
  ```

  **Commit**: YES | Message: `refactor(rift-next): migrate database bridge to pure Effect` | Files: `src/core/database/database.ts`, `src/index.ts`

- [x] 2. Migrar errores de `env-config.ts` a `Data.TaggedError`

  **What to do**:
  - Reemplazar `MissingJwtSecretError` y `InvalidPortError` (clases manuales) con `Data.TaggedError`
  - Preservar mensajes de error existentes
  - Actualizar `mapHttpError` en `index.ts` si referencia estos errores

  **Must NOT do**:
  - No cambiar validación de puerto ni lógica de JWT

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: cambio mecánico de clase a TaggedError

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T3, T7 | Blocked By: —

  **References**:
  - Pattern: `src/core/database/database-service.ts:25-35` — ejemplos de Data.TaggedError
  - Pattern: `src/core/http/http-schemas.ts` — ejemplos de Data.TaggedError
  - Consumer: `src/index.ts:96-116` — mapHttpError usa MissingJwtSecretError

  **Acceptance Criteria**:
  - [ ] `grep 'class MissingJwtSecretError\|class InvalidPortError' apps/rift-next/src/core/config/env-config.ts` retorna 0
  - [ ] `grep 'Data.TaggedError' apps/rift-next/src/core/config/env-config.ts` retorna >= 1
  - [ ] Build exit 0

  **QA Scenarios**:

  ```
  Scenario: Errores son Data.TaggedError
    Tool: Bash
    Steps: grep 'Data.TaggedError' apps/rift-next/src/core/config/env-config.ts | wc -l
    Expected: >= 1
    Evidence: .sisyphus/evidence/fase5-t2-qa-tagged.txt

  Scenario: mapHttpError sigue funcionando
    Tool: Bash
    Steps: cd apps/rift-next && bun test tests/unit/http-smoke.test.ts 2>&1
    Expected: output contiene "pass" y 0 "fail"
    Evidence: .sisyphus/evidence/fase5-t2-qa-map.txt
  ```

  **Commit**: YES | Message: `refactor(rift-next): migrate env-config errors to Data.TaggedError` | Files: `src/core/config/env-config.ts`, `src/index.ts`

- [x] 3. Agregar tests directos para `env-config.ts`

  **What to do**:
  - Crear `tests/unit/env-config.test.ts`
  - Testear: `ConfigLayer` con variables válidas, `MissingJwtSecretError` cuando falta secret, `InvalidPortError` con puerto fuera de rango
  - No testear el objeto `env` síncrono (legacy)

  **Must NOT do**:
  - No modificar variables de entorno globales permanentemente
  - No testear `env` síncrono (se depreca en T7)

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: tests unitarios mecánicos

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: — | Blocked By: T2

  **References**:
  - Pattern: `tests/unit/http-schemas.test.ts` — estilo de tests de schemas
  - API: `src/core/config/env-config.ts` — ConfigLayer, configEffect

  **Acceptance Criteria**:
  - [ ] `bun test apps/rift-next/tests/unit/env-config.test.ts` pasa
  - [ ] Al menos 4 casos: success, missing jwt, invalid port, default values

  **QA Scenarios**:

  ```
  Scenario: Tests de env-config pasan
    Tool: Bash
    Steps: cd apps/rift-next && bun test tests/unit/env-config.test.ts 2>&1
    Expected: output contiene "pass" y 0 "fail"
    Evidence: .sisyphus/evidence/fase5-t3-qa-tests.txt
  ```

  **Commit**: YES | Message: `test(rift-next): add env-config unit tests` | Files: `tests/unit/env-config.test.ts`

- [x] 4. Migrar `RealtimeDependencies` a Effect-returning APIs

  **What to do**:
  - Cambiar tipo `RealtimeDependencies` en `realtime-types.ts`:
    - `lookup(code): Effect.Effect<{code, public_key} | null, DatabaseError>`
    - `potentiallyUpdate(code, pubkey): Effect.Effect<boolean, DatabaseError>`
    - `verifyToken(token): Effect.Effect<{code?: string} | null, JwtError>`
    - `createConnectionId(): Effect.Effect<string, never>` (o string sync, es puro)
  - Actualizar `makeRealtimeService` en `realtime-service.ts` para usar `yield*` en vez de llamadas sync
  - Actualizar `index.ts` para proveer implementaciones Effect (usando `DatabaseService`, `LoggerService`)

  **Must NOT do**:
  - No cambiar lógica de negocio de lookup/verifyToken

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: cambia contrato central de realtime; afecta múltiples módulos

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T5, T6 | Blocked By: T1

  **References**:
  - Type: `src/core/realtime/realtime-types.ts:14-19` — RealtimeDependencies actual
  - Consumer: `src/core/realtime/realtime-service.ts` — makeRealtimeService usa deps
  - Consumer: `src/index.ts:242-267` — realtimeDeps implementación actual

  **Acceptance Criteria**:
  - [ ] `realtime-types.ts` define métodos que retornan `Effect.Effect`
  - [ ] `realtime-service.ts` usa `yield* deps.lookup(...)` en vez de `deps.lookup(...)`
  - [ ] `bun test apps/rift-next/tests/unit/realtime.test.ts` pasa

  **QA Scenarios**:

  ```
  Scenario: RealtimeDependencies es Effect
    Tool: grep
    Steps: pattern='Effect\.Effect' path='apps/rift-next/src/core/realtime/realtime-types.ts' output_mode='content'
    Expected: output contiene Effect.Effect en lookup, potentiallyUpdate, verifyToken
    Evidence: .sisyphus/evidence/fase5-t4-qa-effect.txt

  Scenario: realtime-service usa yield* para deps
    Tool: grep
    Steps: pattern='yield\* deps\.' path='apps/rift-next/src/core/realtime/realtime-service.ts' output_mode='content'
    Expected: count >= 1
    Evidence: .sisyphus/evidence/fase5-t4-qa-yield.txt

  Scenario: Tests realtime pasan
    Tool: Bash
    Steps: cd apps/rift-next && bun test tests/unit/realtime.test.ts 2>&1
    Expected: output contiene "pass" y 0 "fail"
    Evidence: .sisyphus/evidence/fase5-t4-qa-tests.txt
  ```

  **Commit**: YES | Message: `refactor(rift-next): migrate RealtimeDependencies to Effect APIs` | Files: `src/core/realtime/realtime-types.ts`, `src/core/realtime/realtime-service.ts`, `src/index.ts`

- [x] 5. Eliminar `RiftRealtimeManager` (realtime.ts)

  **What to do**:
  - Eliminar archivo `src/core/realtime/realtime.ts`
  - `index.ts` ya usa `RealtimeService` directamente (a través de `RealtimeLive`)
  - Actualizar tests que importen `RiftRealtimeManager` para usar `makeRealtimeService` directamente
  - Si algún consumidor externo necesita facade sync, documentar como deprecated en index.ts (no en core/)

  **Must NOT do**:
  - No introducir nueva clase manager
  - No dejar código muerto

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: eliminación mecánica + ajuste de imports

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T6 | Blocked By: T4

  **References**:
  - Target: `src/core/realtime/realtime.ts` — archivo a eliminar
  - Consumer: `tests/unit/realtime.test.ts` — posible import de RiftRealtimeManager
  - Pattern: `src/core/realtime/realtime-service.ts` — makeRealtimeService reemplaza funcionalidad

  **Acceptance Criteria**:
  - [ ] `realtime.ts` no existe en `src/core/realtime/`
  - [ ] `grep 'RiftRealtimeManager' apps/rift-next/src` retorna 0
  - [ ] Tests pasan tras ajuste de imports

  **QA Scenarios**:

  ```
  Scenario: RiftRealtimeManager eliminado
    Tool: Bash
    Steps: test -f apps/rift-next/src/core/realtime/realtime.ts && echo EXISTS || echo REMOVED
    Expected: REMOVED
    Evidence: .sisyphus/evidence/fase5-t5-qa-removed.txt

  Scenario: Sin referencias en src/
    Tool: Bash
    Steps: grep -r 'RiftRealtimeManager' apps/rift-next/src/ | wc -l
    Expected: 0
    Evidence: .sisyphus/evidence/fase5-t5-qa-refs.txt
  ```

  **Commit**: YES | Message: `refactor(rift-next): remove RiftRealtimeManager sync facade` | Files: `src/core/realtime/realtime.ts`, `tests/unit/realtime.test.ts`, `src/index.ts`

- [x] 6. Limpiar `index.ts`: eliminar runSync, module-load runtime, y verifyToken imperativo

  **What to do**:
  - Mover creación de servicio `realtime` de module load (líneas 269-278) a `initializeApp` o `startRuntime`
  - Reemplazar `realtimeDeps.verifyToken` imperativo (try/catch + logger manual) con Effect usando `LoggerService` y manejo de error tipado
  - Hacer `initializeApp` async/Effect: que devuelva `Effect.Effect<void, ConfigError | DatabaseError>` y ejecutarla con `Effect.runPromise` en `startRuntime`
  - Eliminar `Effect.runSync(httpDatabase.initialize)` de `initializeApp`
  - Preservar `runRealtime` como runner en boundary Elysia (pero asegurar que use `runPromiseExit` y loguee)

  **Must NOT do**:
  - No cambiar rutas HTTP ni handlers WS
  - No cambiar comportamiento de close codes (preservar 1000)

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: integración crítica; toca startup, WS handlers, HTTP handlers

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: — | Blocked By: T1, T4, T5

  **References**:
  - Target: `src/index.ts:269-278` — module load runtime
  - Target: `src/index.ts:242-267` — realtimeDeps imperativo
  - Target: `src/index.ts:297-301` — initializeApp sync
  - Pattern: `src/index.ts:280-289` — runRealtime (preservar)

  **Acceptance Criteria**:
  - [ ] `grep -E 'Effect\.runSync' apps/rift-next/src/index.ts` retorna 0 (excepto en comentarios)
  - [ ] Servicio realtime se crea durante `startRuntime`, no en module load
  - [ ] `bun test` pasa completo

  **QA Scenarios**:

  ```
  Scenario: index.ts sin runSync
    Tool: Bash
    Steps: grep -E 'Effect\.runSync' apps/rift-next/src/index.ts | wc -l
    Expected: 0
    Evidence: .sisyphus/evidence/fase5-t6-qa-runsync.txt

  Scenario: Startup funciona correctamente
    Tool: Bash
    Steps: cd apps/rift-next && bun test tests/integration/runtime-central.test.ts 2>&1
    Expected: output contiene "pass" y 0 "fail"
    Evidence: .sisyphus/evidence/fase5-t6-qa-startup.txt

  Scenario: Tests WS pasan tras cleanup
    Tool: Bash
    Steps: cd apps/rift-next && bun test tests/integration/websocket-integration.test.ts 2>&1
    Expected: output contiene "pass" y 0 "fail"
    Evidence: .sisyphus/evidence/fase5-t6-qa-ws.txt
  ```

  **Commit**: YES | Message: `refactor(rift-next): remove runSync from index.ts and defer runtime creation` | Files: `src/index.ts`

- [x] 7. Eliminar cast `as RiftFrame` en `realtime-schemas.ts`

  **What to do**:
  - Reemplazar `Schema.decodeUnknownEither` + cast manual con `Schema.decodeUnknown` (devuelve `Effect`)
  - Cambiar firma de `decodeRiftFrame` a `Effect.Effect<RiftFrame, FramePayloadError>`
  - Actualizar consumidores en `realtime-service.ts` para usar `yield*` o `.pipe()`

  **Must NOT do**:
  - No cambiar estructura de `RiftFrameSchema`

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: cambio mecánico de decode

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: — | Blocked By: —

  **References**:
  - Target: `src/core/realtime/realtime-schemas.ts:17-20` — cast actual
  - Consumer: `src/core/realtime/realtime-service.ts` — usa decodeRiftFrame

  **Acceptance Criteria**:
  - [ ] `grep 'as RiftFrame' apps/rift-next/src/core/realtime/realtime-schemas.ts` retorna 0
  - [ ] `decodeRiftFrame` devuelve `Effect.Effect<RiftFrame, FramePayloadError>`
  - [ ] Build exit 0

  **QA Scenarios**:

  ```
  Scenario: Sin cast as RiftFrame
    Tool: Bash
    Steps: grep 'as RiftFrame' apps/rift-next/src/core/realtime/realtime-schemas.ts | wc -l
    Expected: 0
    Evidence: .sisyphus/evidence/fase5-t7-qa-cast.txt

  Scenario: Tests de schemas pasan
    Tool: Bash
    Steps: cd apps/rift-next && bun test tests/unit/realtime-schemas.test.ts 2>&1
    Expected: output contiene "pass" y 0 "fail"
    Evidence: .sisyphus/evidence/fase5-t7-qa-tests.txt
  ```

  **Commit**: YES | Message: `refactor(rift-next): remove RiftFrame type cast, use Effect decode` | Files: `src/core/realtime/realtime-schemas.ts`, `src/core/realtime/realtime-service.ts`

- [x] 8. Migrar `TokenSignError` e `InvalidTokenError` a `Data.TaggedError`

  **What to do**:
  - Reemplazar clases manuales en `index.ts` con `Data.TaggedError`
  - Actualizar `isRiftHttpError` y `mapHttpError` si es necesario
  - Preservar `_tag` para matching

  **Must NOT do**:
  - No cambiar respuestas HTTP mapeadas

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: cambio mecánico

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: — | Blocked By: —

  **References**:
  - Target: `src/index.ts:51-61` — clases manuales
  - Consumer: `src/index.ts:144-162` — isRiftHttpError
  - Consumer: `src/index.ts:96-116` — mapHttpError

  **Acceptance Criteria**:
  - [ ] `grep 'class TokenSignError\|class InvalidTokenError' apps/rift-next/src/index.ts` retorna 0
  - [ ] Build exit 0

  **QA Scenarios**:

  ```
  Scenario: Errores migrados a TaggedError
    Tool: Bash
    Steps: grep 'Data.TaggedError.*TokenSignError\|Data.TaggedError.*InvalidTokenError' apps/rift-next/src/index.ts | wc -l
    Expected: >= 1
    Evidence: .sisyphus/evidence/fase5-t8-qa-tagged.txt

  Scenario: Tests HTTP pasan
    Tool: Bash
    Steps: cd apps/rift-next && bun test tests/unit/http-smoke.test.ts 2>&1
    Expected: output contiene "pass" y 0 "fail"
    Evidence: .sisyphus/evidence/fase5-t8-qa-tests.txt
  ```

  **Commit**: YES | Message: `refactor(rift-next): migrate TokenSignError and InvalidTokenError to Data.TaggedError` | Files: `src/index.ts`

## Final Verification Wave (MANDATORY)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user.

- [x] F1. Plan Compliance Audit — oracle: ¿Todos los `Effect.runSync` eliminados de `src/`? ¿Comportamiento WS preservado? ✅ APPROVE
- [x] F2. Code Quality Review — unspecified-high: ¿Nuevos errores usan Data.TaggedError? ¿Sin casts? ✅ APPROVE
- [x] F3. Real Manual QA — unspecified-high: Ejecutar scan de runSync, build, tests completos ✅ APPROVE
- [x] F4. Scope Fidelity Check — deep: ¿Solo `apps/rift-next` modificada? ¿Elysia intacto? ¿Protocolo WS sin cambios? ✅ APPROVE

### Consolidated Results

| Check                                                 | Result                                           |
| ----------------------------------------------------- | ------------------------------------------------ |
| `bun test`                                            | ✅ 67 pass, 0 fail, 168 expect() calls, 12 files |
| `bun run build`                                       | ✅ `bunx tsc -p tsconfig.json` exit 0            |
| LSP diagnostics (`src/`)                              | ✅ 0 errors across 13 files                      |
| Scan `Effect.runSync` en `src/` (excl. logger facade) | ✅ 0 ocurrencias                                 |
| Scan `as RiftFrame`                                   | ✅ 0 ocurrencias                                 |
| Manual error classes                                  | ✅ 0 ocurrencias (todos Data.TaggedError)        |
| `RiftRealtimeManager` eliminado                       | ✅ archivo eliminado, 0 referencias              |
| WS close code preservado                              | ✅ 1000 (comportamiento por defecto)             |

## Commit Strategy

- Commits individuales por tarea (8 commits)
- Mensajes en formato `type(scope): description` (conventional commits)
- Push al final de F3 aprobación

## Success Criteria

- [x] `bun test` en `apps/rift-next`: 100% pass (67/67)
- [x] `bun run build`: exit 0
- [x] Scan `Effect.runSync` en `apps/rift-next/src/`: 0 ocurrencias
- [x] Scan `as RiftFrame`: 0 ocurrencias
- [x] `Data.TaggedError` usado para todos los errores nuevos
- [x] Tests de WS preservan close code 1000 en auth fallido
- [x] `RiftRealtimeManager` eliminado de codebase
