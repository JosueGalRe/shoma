# Migración de apps/rift-next a Effect

## TL;DR

> **Summary**: Migración completa del backend relay de Elysia/JS imperativo a Effect con error handling tipado, resource safety y DI estructurado.
> **Deliverables**: `apps/rift-next/` completo migrado a Effect, `packages/protocol-contract` con dual-export de Effect.Schema, tests con TestClock.
> **Effort**: Medium-Large (~4 waves, ~800 LOC a migrar)
> **Parallel**: YES - 3 waves pueden paralelizarse internamente, Wave 4 es secuencial.
> **Critical Path**: Wave 1 (infra+setup) → Wave 2 (HTTP) → Wave 3 (realtime) → Wave 4 (integration+cleanup)

## Context

### Original Request

Migrar apps/rift-next completamente a Effect (https://effect.website) para mejorar arquitectura y escalabilidad.

### Interview Summary

- **Equipo**: Conoce Effect/FP
- **Objetivo**: Arquitectura/escalabilidad (no hay dolor agudo)
- **Scope**: Solo rift-next + protocol-contract. Web-next NO.
- **Enfoque**: Migración completa (no solo piloto), por waves

### Metis Review (gaps addressed)

- **Runtime boundary**: Definir claramente dónde Effect.runPromise corre (en boundaries de Elysia)
- **Behavior preservation**: Migración, no rediseño. Status codes, frames, responses se mantienen.
- **Rollback**: Cada wave debe ser independientemente verificable y shipeable.
- **Error mapping**: Typed Effect errors deben mapear a los mismos HTTP status/WebSocket behaviors actuales.
- **Realtime state**: Maps/Sets mutables se encapsulan en Effect service (no cambiar a Ref/Queue a menos que se justifique).
- **Scope boundaries**: NO reemplazar Elysia, NO migrar web-next, NO rediseñar protocolo.
- **Tests**: Preservar Bun test runner y coverage existente. Agregar TestClock para timers.

## Work Objectives

### Core Objective

Migrar apps/rift-next de async/await imperativo + error handling opaco a Effect con:

1. Error handling tipado y explícito
2. Resource safety (timers, DB, WebSockets)
3. Schema validation para HTTP bodies y WebSocket frames
4. Dependency injection con Layers
5. Testing determinístico de tiempo con TestClock

### Deliverables

- `apps/rift-next/src/core/config/env-config.ts` → Effect Config + Layer
- `apps/rift-next/src/core/logger/logger-utils.ts` → Effect Logger service
- `apps/rift-next/src/core/database/database.ts` → Effect service con acquireRelease
- `apps/rift-next/src/core/http/index-utils.ts` → Effect.Schema validation
- `apps/rift-next/src/core/realtime/realtime.ts` → Effect service con fiber management
- `apps/rift-next/src/index.ts` → Elysia boundaries con Effect.runPromise
- `packages/protocol-contract/src/` → Dual-export plain types + Effect.Schema
- Tests preservados + nuevos tests con TestClock

### Definition of Done (verifiable conditions)

- [ ] `bun test apps/rift-next` pasa (todos los tests existentes + nuevos)
- [ ] `bun run --filter @mimic/rift-next build` compila sin errores
- [ ] `bun run lint` sin nuevas violaciones
- [ ] HTTP endpoints retornan mismos status codes y JSON shapes
- [ ] WebSocket frames son byte-for-byte compatibles
- [ ] No memory leaks de timers/sockets en integration tests
- [ ] protocol-contract no rompe `bun run --filter @mimic/web-next build`

### Must Have

- Error handling tipado que reemplace null/boolean/throw mix
- Resource safety para timers, DB connections, WebSocket lifecycle
- Schema validation para HTTP bodies y WebSocket frames
- Tests determinísticos de keepalive/timers con TestClock
- Cada wave compila, testea, y preserva comportamiento antes de la siguiente

### Must NOT Have (guardrails)

- NO reemplazar Elysia como framework HTTP/WebSocket
- NO migrar apps/web-next
- NO cambiar semántica del protocolo (opcodes, frame formats)
- NO agregar features nuevas no relacionadas
- NO convertir cada helper puro en Effect service
- NO usar `any` para suprimir errores de tipado
- NO reescribir tests existentes a menos que sea necesario para compatibilidad

## Verification Strategy

- **Test decision**: Tests-after por wave. Preservar tests existentes, agregar tests Effect-specific.
- **Framework**: Bun native test runner (se mantiene)
- **QA policy**: Cada task tiene agent-executed scenarios
- **Evidence**: .sisyphus/evidence/task-{N}-{slug}.{ext}

## Execution Strategy

### Parallel Execution Waves

> Target: 4-6 tasks per wave.

**Wave 0: Pre-Migration Architecture (secuencial, must happen first)**

- Definir Effect runtime boundary, Layer graph, error taxonomy

**Wave 1: Infrastructure (paralelizable)**

- Config → Effect Config
- Logger → Effect Logger service
- Database → Effect service con acquireRelease
- Setup: instalar effect, configurar tsconfig

**Wave 2: HTTP Layer (paralelizable internamente, blocked by W1)**

- Schema validation para bodies
- Error taxonomy para HTTP
- Routes con Effect.runPromise en boundaries

**Wave 3: WebSocket/Realtime (blocked by W1+W2)**

- RiftRealtimeManager como Effect service
- Fiber management para keepalive
- State encapsulation

**Wave 4: Integration & Cleanup**

- Preservar tests existentes
- Agregar TestClock tests
- Verificar compatibilidad protocol-contract
- Build, lint, QA final

### Dependency Matrix

| Task                           | Blocks           | Blocked By             |
| ------------------------------ | ---------------- | ---------------------- |
| W0-1 Runtime boundary          | W1-4             | -                      |
| W1-1 Setup effect              | W1-2, W1-3, W1-4 | W0-1                   |
| W1-2 Config layer              | W2-1, W2-2, W3-1 | W1-1                   |
| W1-3 Logger service            | W3-1             | W1-1                   |
| W1-4 Database service          | W2-1, W2-2, W3-1 | W1-1                   |
| W2-1 HTTP schemas              | W2-2             | W1-2, W1-4             |
| W2-2 HTTP routes               | W4-1             | W2-1                   |
| W3-1 Realtime service          | W4-1             | W1-2, W1-3, W1-4, W2-1 |
| W4-1 Integration tests         | -                | W2-2, W3-1             |
| W4-2 protocol-contract schemas | -                | W4-1                   |
| W4-3 Final verification        | -                | W4-1, W4-2             |

### Agent Dispatch Summary

| Wave | Task Count | Categories               |
| ---- | ---------- | ------------------------ |
| W0   | 1          | deep                     |
| W1   | 4          | quick + deep             |
| W2   | 2          | deep                     |
| W3   | 1          | deep                     |
| W4   | 3          | unspecified-high + quick |

## TODOs

- [x] 0.1. Definir arquitectura Effect: runtime boundary, layers, error taxonomy

  **What to do**: Documentar decisiones arquitectónicas ANTES de tocar código:
  1. Dónde corre `Effect.runPromise` (Elysia route/WebSocket callbacks)
  2. Layer graph: ConfigLayer, LoggerLayer, DatabaseLayer, RealtimeLayer
  3. Error taxonomy: qué errores existen, cómo se mapean a HTTP status codes
  4. Estado mutable: RiftRealtimeManager se convierte en Effect service con Maps/Sets encapsulados
  5. Protocol-contract dual-export strategy

  **Must NOT do**: Escribir código de implementación. Esto es solo diseño documentado.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: decisiones arquitectónicas que impactan todo el resto
  - Skills: [`typescript-advanced-types`] - para diseñar el tipo de errores

  **Parallelization**: Can Parallel: NO | Wave 0 | Blocks: W1-4 | Blocked By: -

  **References**:
  - Pattern: `apps/rift-next/src/index.ts` - Elysia boundaries actuales
  - Pattern: `apps/rift-next/src/core/realtime/realtime.ts` - estado mutable actual
  - External: https://effect.website/docs/requirements-management/managing-layers/

  **Acceptance Criteria**:
  - [ ] Documento de arquitectura guardado en `.sisyphus/plans/effect-architecture.md`
  - [ ] Layer graph definido con todos los servicios y sus dependencias
  - [ ] Error taxonomy con mapeo a HTTP status codes documentado
  - [ ] Decisiones de estado mutable documentadas

  **QA Scenarios**:

  ```
  Scenario: Arquitectura documentada
    Tool: Read
    Steps: Leer `.sisyphus/plans/effect-architecture.md`
    Expected: Documento existe, contiene runtime boundary, layers, errors, state decisions
    Evidence: .sisyphus/evidence/task-01-architecture.md
  ```

  **Commit**: YES | Message: `docs(rift-next): effect migration architecture decisions`

- [x] 1.1. Instalar Effect y configurar entorno

  **What to do**:
  1. Agregar `effect` como dependency en `apps/rift-next/package.json`
  2. Verificar que `bun install` funcione
  3. Asegurar que TypeScript strict mode no tenga conflictos con Effect types
  4. Crear `src/core/effect/` con utilidades compartidas (runtime, etc.)

  **Must NOT do**: Empezar a migrar código existente todavía.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: cambio de infraestructura simple
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: W1-2, W1-3, W1-4 | Blocked By: W0-1

  **References**:
  - File: `apps/rift-next/package.json` - agregar dependency
  - File: `apps/rift-next/tsconfig.json` - verificar strict mode
  - External: https://effect.website/docs/getting-started/installation/

  **Acceptance Criteria**:
  - [ ] `effect` aparece en dependencies de `apps/rift-next/package.json`
  - [ ] `bun install` completa sin errores
  - [ ] `bun run --filter @mimic/rift-next build` compila (sin código Effect todavía)
  - [ ] `bun run lint` sin errores

  **QA Scenarios**:

  ```
  Scenario: Effect instalado correctamente
    Tool: Bash
    Steps: grep '"effect"' apps/rift-next/package.json && bun install
    Expected: effect está en dependencies, install exit 0
    Evidence: .sisyphus/evidence/task-11-install.txt
  ```

  **Commit**: YES | Message: `chore(rift-next): add effect dependency`

- [x] 1.2. Migrar Config a Effect Config + Layer

  **What to do**:
  1. Reemplazar `env-config.ts` con Effect Config que lee env vars
  2. Crear `ConfigLayer` que provee la configuración tipada
  3. Mapear: `RIFT_JWT_SECRET`, `RIFT_DB_PATH`, `PORT`, `HOSTNAME`

  **Must NOT do**: Cambiar las env vars que se leen (mismos nombres).

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: módulo pequeño y aislado
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: W2-1, W2-2, W3-1 | Blocked By: W0-1, W1-1

  **References**:
  - File: `apps/rift-next/src/core/config/env-config.ts` - config actual
  - External: https://effect.website/docs/configuration/

  **Acceptance Criteria**:
  - [ ] `ConfigLayer` existe y provee todas las variables de entorno
  - [ ] Tests existentes de rift-next siguen pasando
  - [ ] `bun run --filter @mimic/rift-next build` compila

  **QA Scenarios**:

  ```
  Scenario: Config carga correctamente
    Tool: Bash
    Steps: bun test apps/rift-next/tests/unit/index.test.ts
    Expected: Tests pasan (no dependen de config directamente, pero no deben romperse)
    Evidence: .sisyphus/evidence/task-12-config.txt
  ```

  **Commit**: YES | Message: `refactor(rift-next): migrate config to effect layer`

- [x] 1.3. Migrar Logger a Effect Logger service

  **What to do**:
  1. Crear servicio `LoggerService` con Effect Logger
  2. Reemplazar uso de pino manual con Effect Logger
  3. Preservar formato de logs estructurados (JSON con campos)

  **Must NOT do**: Cambiar la estructura de los logs (mismos campos, mismos niveles).

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: módulo pequeño
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: W3-1 | Blocked By: W0-1, W1-1

  **References**:
  - File: `apps/rift-next/src/core/logger/logger-utils.ts` - logger actual
  - External: https://effect.website/docs/observability/logging/

  **Acceptance Criteria**:
  - [ ] `LoggerService` existe
  - [ ] Logs siguen teniendo mismo formato estructurado
  - [ ] Tests existentes pasan

  **QA Scenarios**:

  ```
  Scenario: Logger funciona
    Tool: Bash
    Steps: bun test apps/rift-next/tests/
    Expected: Todos los tests pasan
    Evidence: .sisyphus/evidence/task-13-logger.txt
  ```

  **Commit**: YES | Message: `refactor(rift-next): migrate logger to effect service`

- [x] 1.4. Migrar Database a Effect service con acquireRelease

  **What to do**:
  1. Crear `DatabaseService` como Effect Tag + Layer
  2. Wrap `bun:sqlite` con `Effect.sync` para operaciones síncronas
  3. Usar `Effect.acquireRelease` para lifecycle de la DB connection
  4. Reemplazar funciones `generateCode`, `lookup`, `potentiallyUpdate` con operaciones Effect
  5. Tipar errores de DB (DatabaseNotInitialized, CodeGenerationFailed, etc.)

  **Must NOT do**: Cambiar schema de tablas SQL.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: requiere resource safety y tipado de errores
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: W2-1, W2-2, W3-1 | Blocked By: W0-1, W1-1

  **References**:
  - File: `apps/rift-next/src/core/database/database.ts` - DB actual
  - External: https://effect.website/docs/resource-management/

  **Acceptance Criteria**:
  - [ ] `DatabaseService` con operaciones tipadas
  - [ ] `Effect.acquireRelease` para DB lifecycle
  - [ ] Tests de DB pasan (integration tests con temp DB)
  - [ ] `bun test apps/rift-next/tests/integration/runtime.test.ts` pasa

  **QA Scenarios**:

  ```
  Scenario: DB operations con Effect
    Tool: Bash
    Steps: bun test apps/rift-next/tests/integration/runtime.test.ts
    Expected: Runtime lifecycle tests pasan (usan DB)
    Evidence: .sisyphus/evidence/task-14-database.txt

  Scenario: DB resource safety
    Tool: Bash
    Steps: Crear script que abre/cierra runtime 100 veces
    Expected: No memory leaks, no file descriptors abiertos
    Evidence: .sisyphus/evidence/task-14-db-safety.txt
  ```

  **Commit**: YES | Message: `refactor(rift-next): migrate database to effect service`

- [x] 2.1. Crear Effect.Schema para HTTP bodies y WebSocket frames

  **What to do**:
  1. Crear schemas Effect para: register body, check query, conduit auth
  2. Reemplazar type guards manuales (`readPubkeyFromBody`, `readTokenCode`, etc.) con `Schema.decode`
  3. Definir errores de validación tipados

  **Must NOT do**: Cambiar los shapes de los payloads (mismos campos).

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: schema design y error handling
  - Skills: [`typescript-advanced-types`]

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: W2-2 | Blocked By: W1-2, W1-4

  **References**:
  - File: `apps/rift-next/src/core/http/index-utils.ts` - parsing manual actual
  - File: `apps/rift-next/src/core/realtime/realtime-utils.ts` - frame parsing
  - External: https://effect.website/docs/schema/introduction/

  **Acceptance Criteria**:
  - [ ] Schemas validan mismos payloads que antes
  - [ ] Errores de validación tienen mensajes claros
  - [ ] Tests unitarios de auth pasan
  - [ ] `bun test apps/rift-next/tests/unit/index.test.ts` pasa

  **QA Scenarios**:

  ```
  Scenario: Validación de body register
    Tool: Bash
    Steps: bun test apps/rift-next/tests/unit/http-smoke.test.ts
    Expected: HTTP smoke tests pasan
    Evidence: .sisyphus/evidence/task-21-schemas.txt

  Scenario: Body inválido retorna error tipado
    Tool: interactive_bash
    Steps: Enviar POST /register con body {} y verificar error
    Expected: 400 Bad Request con mensaje de error
    Evidence: .sisyphus/evidence/task-21-invalid-body.txt
  ```

  **Commit**: YES | Message: `refactor(rift-next): add effect schemas for http and websocket`

- [x] 2.2. Migrar HTTP routes a Effect boundaries

  **What to do**:
  1. En cada route handler, envolver la lógica Effect con `Effect.runPromise`
  2. Mapear errores Effect a HTTP status codes (documentado en W0-1)
  3. Preservar CORS headers y response shapes

  **Must NOT do**: Cambiar URLs o métodos HTTP.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: integración Elysia + Effect runtime boundary
  - Skills: []

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: W4-1 | Blocked By: W2-1

  **References**:
  - File: `apps/rift-next/src/index.ts` - routes actuales
  - External: https://effect.website/docs/getting-started/running-effects/

  **Acceptance Criteria**:
  - [ ] GET / retorna 'Hai, rifto desu.'
  - [ ] POST /register retorna mismo shape JSON
  - [ ] GET /check retorna mismo shape
  - [ ] GET /health/protocol retorna mismo shape
  - [ ] `bun test apps/rift-next/tests/unit/http-smoke.test.ts` pasa

  **QA Scenarios**:

  ```
  Scenario: HTTP smoke tests
    Tool: Bash
    Steps: bun test apps/rift-next/tests/unit/http-smoke.test.ts
    Expected: Todos los tests pasan
    Evidence: .sisyphus/evidence/task-22-http.txt

  Scenario: Error handling HTTP
    Tool: interactive_bash
    Steps: POST /register sin pubkey, POST /register sin JWT secret configurado
    Expected: 400 y 500 respectivamente con mensajes de error correctos
    Evidence: .sisyphus/evidence/task-22-http-errors.txt
  ```

  **Commit**: YES | Message: `refactor(rift-next): migrate http routes to effect boundaries`

- [x] 3.1. Migrar RiftRealtimeManager a Effect service

  **What to do**:
  1. Convertir `RiftRealtimeManager` en Effect service con `Context.Tag`
  2. Encapsular Maps/Sets mutables dentro del service (no usar Ref a menos que sea necesario)
  3. Reemplazar `setInterval` con `Effect.repeat` + `Schedule`
  4. Usar `Effect.fork` para keepalive fiber
  5. Tipar todos los errores de realtime (InvalidFrame, UnknownPeer, etc.)
  6. Preservar exactamente el mismo comportamiento de frames y lifecycle

  **Must NOT do**: Cambiar el formato de frames WebSocket ni los opcodes.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: lógica compleja async, stateful, con fibers
  - Skills: []

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: W4-1 | Blocked By: W1-2, W1-3, W1-4, W2-1

  **References**:
  - File: `apps/rift-next/src/core/realtime/realtime.ts` - manager actual
  - File: `apps/rift-next/tests/unit/realtime.test.ts` - tests existentes
  - External: https://effect.website/docs/concurrency/fibers/
  - External: https://effect.website/docs/scheduling/introduction/

  **Acceptance Criteria**:
  - [ ] `bun test apps/rift-next/tests/unit/realtime.test.ts` pasa
  - [ ] `bun test apps/rift-next/tests/integration/websocket-integration.test.ts` pasa
  - [ ] `bun test apps/rift-next/tests/integration/runtime.test.ts` pasa
  - [ ] Keepalive funciona (TestClock test demuestra pings determinísticos)
  - [ ] Shutdown cierra todos los sockets y detiene fibers

  **QA Scenarios**:

  ```
  Scenario: Realtime unit tests preservados
    Tool: Bash
    Steps: bun test apps/rift-next/tests/unit/realtime.test.ts
    Expected: Todos los tests pasan
    Evidence: .sisyphus/evidence/task-31-realtime-unit.txt

  Scenario: WebSocket integration
    Tool: Bash
    Steps: bun test apps/rift-next/tests/integration/websocket-integration.test.ts
    Expected: Todos los tests pasan
    Evidence: .sisyphus/evidence/task-31-realtime-ws.txt

  Scenario: Keepalive determinístico con TestClock
    Tool: Bash
    Steps: Agregar test que use TestClock para avanzar tiempo y verificar pings
    Expected: Pings se envían exactamente en los intervalos esperados
    Evidence: .sisyphus/evidence/task-31-testclock.txt
  ```

  **Commit**: YES | Message: `refactor(rift-next): migrate realtime manager to effect service`

- [x] 4.1. Preservar y extender tests

  **What to do**:
  1. Asegurar que TODOS los tests existentes pasan
  2. Reemplazar `Bun.sleep` en tests de timers con `TestClock`
  3. Agregar tests para error paths tipados
  4. Verificar que no hay memory leaks (timers, sockets, DB)

  **Must NOT do**: Eliminar tests existentes.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: QA exhaustive
  - Skills: []

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: W4-3 | Blocked By: W2-2, W3-1

  **References**:
  - File: `apps/rift-next/tests/unit/realtime.test.ts` - tests con Bun.sleep
  - External: https://effect.website/docs/testing/testclock/

  **Acceptance Criteria**:
  - [ ] `bun test apps/rift-next` pasa al 100%
  - [ ] TestClock reemplaza Bun.sleep en tests de keepalive
  - [ ] Nuevos tests para error paths tipados existen

  **QA Scenarios**:

  ```
  Scenario: Full test suite
    Tool: Bash
    Steps: bun test apps/rift-next
    Expected: All tests pass
    Evidence: .sisyphus/evidence/task-41-tests.txt
  ```

  **Commit**: YES | Message: `test(rift-next): add effect-specific tests with testclock`

- [x] 4.2. Dual-export Effect.Schema en protocol-contract

  **What to do**:
  1. Agregar Effect.Schema exports a `packages/protocol-contract` ADEMÁS de los tipos existentes
  2. Usar naming: `*Schema` para schemas, tipos sin sufijo
  3. Verificar que web-next no se rompe

  **Must NOT do**: Eliminar o renombrar exports existentes.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: additive change, low risk
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: - | Blocked By: W4-1

  **References**:
  - File: `packages/protocol-contract/src/index.ts` - exports actuales
  - File: `apps/web-next/package.json` - verificar que no hay conflictos

  **Acceptance Criteria**:
  - [ ] `bun run --filter @mimic/web-next build` compila sin errores
  - [ ] `bun run --filter @mimic/protocol-contract build` compila (si aplica)
  - [ ] Protocol-contract exporta schemas y tipos con mismo naming

  **QA Scenarios**:

  ```
  Scenario: Web-next no roto
    Tool: Bash
    Steps: bun run --filter @mimic/web-next build
    Expected: Build exit 0
    Evidence: .sisyphus/evidence/task-42-webnext.txt
  ```

  **Commit**: YES | Message: `feat(protocol-contract): add effect schema dual exports`

## Final Verification Wave (MANDATORY)

> 4 review agents run in PARALLEL. ALL must APPROVE.

- [ ] F1. Plan Compliance Audit — oracle: Verificar que cada task cumple con las decisiones arquitectónicas de W0-1
- [ ] F2. Code Quality Review — unspecified-high: Revisar que no hay `any`, patrones anti-Effect, o abstracciones innecesarias
- [ ] F3. Real Manual QA — unspecified-high: Ejecutar full test suite, integration tests, y verificar compatibilidad HTTP/WebSocket
- [ ] F4. Scope Fidelity Check — deep: Verificar que no se migró web-next, no se cambió Elysia, no se agregaron features nuevas

## Commit Strategy

- Un commit por task (siguiendo el template `type(scope): desc`)
- Commits intermedios en cada wave
- Final merge con squash opcional (dejar al usuario decidir)

## Success Criteria

- [ ] apps/rift-next completamente migrado a Effect
- [ ] Todos los tests pasan (existentes + nuevos)
- [ ] HTTP/WebSocket behavior es 100% compatible
- [ ] protocol-contract dual-export funciona sin romper web-next
- [ ] Build y lint sin errores
- [ ] Documentación de arquitectura Effect guardada
