# Plan: Análisis Exhaustivo + Plan de Migración Effect-TS para rift-next

## TL;DR

> **Summary**: Auditar `apps/rift-next` en profundidad (arquitectura, calidad, uso de Effect-TS, tests, seguridad) y producir un reporte de diagnóstico con un plan de migración incremental a mejores prácticas de Effect-TS.
> **Deliverables**: Reporte de diagnóstico `.md`, plan de migración `.md`, AGENTS.md actualizado, evidencia de tests/build.
> **Effort**: Medium
> **Parallel**: YES - 3 waves
> **Critical Path**: Wave 1 (caracterización) → Wave 2 (síntesis + plan) → Wave 3 (verificación)

## Context

### Original Request

El usuario solicitó: instalar skill `effect-ts` y correr un análisis exhaustivo de `rift-next`, cubriendo arquitectura, calidad de código, uso de Effect-TS y tests, produciendo un diagnóstico completo + plan de migración.

### Interview Summary

- Skill `effect-ts` ya está instalada en `~/.agents/skills/effect-ts/`.
- `~/.effect` (source de Effect-TS) fue clonado para consulta de patrones.
- Alcance confirmado: solo `apps/rift-next`.
- Entregable: diagnóstico + plan de migración (no implementación inmediata).

### Metis Review (gaps addressed)

- **Scope creep guardrail**: NO expandir a `web-next`, `rift/`, `protocol-contract`, ni cambiar protocolo WS, schema SQLite, o reemplazar Elysia/Bun/pino/JWT.
- **Must NOT Change**: auth JWT semantics, rooms/sessions, lifecycle WS, formato de mensajes, códigos HTTP response, logging structure.
- **Riesgo identificado**: `serviceEffect` cast en `realtime-service.ts` y `void runRealtime(...)` en WebSockets son los problemas más críticos.
- **Supuesto validado**: El usuario quiere evaluar si conviene migrar más a Effect, no asumir rewrite completo.

### Oracle Architecture Review

1. **`serviceEffect` cast**: Anti-patón crítico. Alternativa: resolver `RealtimeStateService` en construcción del servicio o usar `Effect.provideService`, nunca cast.
2. **`RealtimeDependencies`**: Funciones impuras inyectadas deben convertirse gradualmente en servicios Effect si pueden fallar o lanzar (ej. `verifyToken` con `Effect.try`).
3. **Elysia + Effect boundary**: Elysia debe seguir siendo el boundary imperativo, pero centralizar ejecución en un solo runtime Effect en vez de `Effect.runPromiseExit` ad-hoc.
4. **WebSocket error handling**: Reemplazar `void runRealtime(...)` con un runner que capture errores tipados y defects, cierre el socket o loguee sin dejar failures sin observar.
5. **Prioridad**: (1) tests de caracterización, (2) eliminar casts, (3) runtime centralizado, (4) modelar dependencias como servicios, (5) `Data.TaggedError` (oportunista, no prioritario).

## Work Objectives

### Core Objective

Producir un diagnóstico exhaustivo del estado actual de `apps/rift-next` y un plan de migración incremental a patrones idiomáticos de Effect-TS, preservando comportamiento observable.

### Deliverables

1. `docs/rift-next-diagnostico.md` — Reporte de hallazgos por categoría (arquitectura, Effect, tests, seguridad, deuda técnica).
2. `docs/rift-next-plan-migracion.md` — Plan por fases con tareas concretas, priorización y riesgos.
3. `apps/rift-next/AGENTS.md` actualizado — Reflejar estructura real del código (`src/core/...`).
4. Evidencia de ejecución: tests pasando, build pasando, lint pasando (capturas/logs en `.sisyphus/evidence/`).

### Definition of Done (verifiable conditions with commands)

- [x] Todos los archivos fuente de `apps/rift-next/src/` fueron analizados y referenciados en el reporte.
- [x] Todos los archivos de test fueron ejecutados con `bun test --filter=@mimic/rift-next` o equivalente.
- [x] `bun run build` pasa para `apps/rift-next`.
- [x] `bun run lint` pasa para `apps/rift-next` (falla pre-existente documentada).
- [x] El reporte contiene al menos: 5 hallazgos arquitectónicos, 5 de Effect-TS, 3 de tests, 3 de seguridad.
- [x] El plan de migración tiene fases numeradas, cada una con ≤5 tareas, criterios de aceptación y riesgos.

### Must Have

- Análisis de cada archivo en `src/core/{database,realtime,http,logger,effect,config}/`.
- Evaluación del uso de Effect-TS contra mejores prácticas (skill + source).
- Identificación de código muerto o infrautilizado.
- Evaluación de manejo de errores (HTTP y WebSocket).
- Evaluación de cobertura y calidad de tests.
- Plan de migración incremental y reversible.

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)

- NO modificar código fuente de `apps/rift-next/src/` (este plan es análisis + planificación, no implementación).
- NO modificar `apps/web-next`, `rift/`, `packages/protocol-contract`.
- NO proponer reemplazo de Elysia, Bun, SQLite, pino o jsonwebtoken.
- NO proponer cambios de protocolo WebSocket, schema SQLite, o semantics de auth JWT.
- NO inventar hallazgos sin evidencia en el código.
- NO incluir “mejoras” que sean solo preferencias estéticas sin impacto mensurable.

## Verification Strategy

> ZERO HUMAN INTERVENTION - all verification is agent-executed.

- **Test decision**: tests-after (caracterización) — ejecutar tests existentes y documentar resultados.
- **QA policy**: Cada tarea de análisis incluye comandos de verificación y rutas de evidencia.
- **Evidence**: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves

**Wave 1: Caracterización y Exploración**

- Tareas 1-4: Análisis de código fuente, tests, arquitectura y seguridad en paralelo.

**Wave 2: Síntesis y Planificación**

- Tareas 5-7: Consolidar hallazgos, generar plan de migración, validar contra Effect source.

**Wave 3: Documentación y Verificación**

- Tareas 8-10: Actualizar AGENTS.md, verificar build/test/lint, revisión final.

### Dependency Matrix

| Task                            | Depends On    | Blocks |
| ------------------------------- | ------------- | ------ |
| 1. Mapeo fuente                 | —             | 5, 8   |
| 2. Ejecución tests              | —             | 5      |
| 3. Análisis arquitectura        | 1             | 5, 6   |
| 4. Análisis seguridad           | 1             | 5, 6   |
| 5. Reporte diagnóstico          | 1, 2, 3, 4    | 6, 7   |
| 6. Plan migración               | 3, 4, 5       | 7      |
| 7. Validación Effect            | 5, 6          | —      |
| 8. Actualizar AGENTS.md         | 1             | —      |
| 9. Verificación build/test/lint | —             | 10     |
| 10. Revisión final              | 5, 6, 7, 8, 9 | —      |

### Agent Dispatch Summary

| Wave | Tasks | Categories              |
| ---- | ----- | ----------------------- |
| 1    | 1-4   | explore, oracle, deep   |
| 2    | 5-7   | writing, oracle, deep   |
| 3    | 8-10  | quick, unspecified-high |

## TODOs

- [x] 1. Mapeo Exhaustivo del Código Fuente

  **What to do**: Leer y catalogar cada archivo en `apps/rift-next/src/`. Documentar: responsabilidad, dependencias, uso de Effect (imports, servicios, layers, errores), estado mutable, boundaries externos (Elysia, SQLite, jwt, pino).
  **Must NOT do**: Modificar archivos. No emitir juicios de calidad aún (eso es Task 3).

  **Recommended Agent Profile**:
  - Category: `explore` — Reason: mapeo de codebase.
  - Skills: `effect-ts` — Reason: identificar patrones Effect.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 3, 5, 8 | Blocked By: —

  **References**:
  - Estructura real: `apps/rift-next/src/core/{database,realtime,http,logger,effect,config}/`
  - Skill: `~/.agents/skills/effect-ts/SKILL.md`
  - Effect source: `~/.effect/packages/effect/src/`

  **Acceptance Criteria**:
  - [ ] Se listan los 16 archivos fuente con una línea de responsabilidad cada uno.
  - [ ] Se identifica qué archivos importan de `'effect'` y qué símbolos usan.
  - [ ] Se identifica todo estado mutable (variables `let`, Maps, Sets, etc.).
  - [ ] Se identifican boundaries externos (Elysia, SQLite, jwt, pino, ws).
  - [ ] Evidencia: `.sisyphus/evidence/task-1-source-map.md`

  **QA Scenarios**:

  ```
  Scenario: Verificar que no faltan archivos
    Tool: Bash
    Steps: find apps/rift-next/src -name '*.ts' | wc -l
    Expected: count == 16
    Evidence: .sisyphus/evidence/task-1-file-count.txt
  ```

  **Commit**: NO

- [x] 2. Ejecución y Análisis de Tests

  **What to do**: Ejecutar tests de `apps/rift-next` con Bun. Documentar: resultados (pass/fail), cobertura visual (qué archivos fuente NO tienen tests), calidad de tests (usen Effect, mocks, helpers), y si hay tests skipped o vacíos.
  **Must NOT do**: No modificar tests. No agregar tests nuevos.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: evaluación de infraestructura de test.
  - Skills: `effect-ts` — Reason: evaluar si los tests usan patrones Effect.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 5 | Blocked By: —

  **References**:
  - Tests: `apps/rift-next/tests/unit/`, `apps/rift-next/tests/integration/`
  - Test runner: Bun nativo (`bun:test`)
  - Config: `apps/rift-next/package.json` scripts

  **Acceptance Criteria**:
  - [ ] `bun test` dentro de `apps/rift-next` se ejecuta y se captura output completo.
  - [ ] Se mapea cada archivo de test a qué archivo fuente cubre.
  - [ ] Se identifican archivos fuente sin tests.
  - [ ] Se evalúa si los tests usan Effect (Effect.runPromise, etc.) o son puramente imperativos.
  - [ ] Evidencia: `.sisyphus/evidence/task-2-test-output.txt`, `task-2-test-coverage.md`

  **QA Scenarios**:

  ```
  Scenario: Tests pasan
    Tool: Bash
    Steps: cd apps/rift-next && bun test 2>&1
    Expected: output contiene al menos un "pass" o "fail" determinado
    Evidence: .sisyphus/evidence/task-2-test-output.txt
  ```

  **Commit**: NO

- [x] 3. Análisis Arquitectónico y de Patrones Effect

  **What to do**: Evaluar el código contra mejores prácticas de Effect-TS (skill + source). Identificar: anti-patrones (casts, try-catch en gen, type assertions), calidad de servicios/layers, manejo de errores, uso de `Option` vs `null`, pureza de funciones, y código muerto.
  **Must NOT do**: No proponer rewrites que cambien comportamiento observable. No criticar el uso de Elysia como boundary.

  **Recommended Agent Profile**:
  - Category: `oracle` — Reason: evaluación arquitectónica profunda.
  - Skills: `effect-ts` — Reason: referencia directa a patrones oficiales.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 5, 6 | Blocked By: 1

  **References**:
  - `src/core/realtime/realtime-service.ts:159-161` — `serviceEffect` cast
  - `src/core/effect/runtime.ts` — `makeRuntime` (¿código muerto?)
  - `src/index.ts:277-279` — `runRealtime` sin manejo de errores
  - `~/.agents/skills/effect-ts/references/critical-rules.md`
  - `~/.effect/packages/effect/src/Data.ts` — `TaggedError`
  - `~/.effect/packages/effect/src/Context.ts` — `GenericTag`
  - `~/.effect/packages/effect/src/Layer.ts` — `Layer`

  **Acceptance Criteria**:
  - [ ] Se identifican ≥5 anti-patrones Effect con ubicación exacta (archivo:linea).
  - [ ] Se evalúa cada servicio (`DatabaseService`, `RealtimeService`, etc.) contra patrones idiomáticos.
  - [ ] Se identifica código muerto o infrautilizado con justificación.
  - [ ] Se evalúa el manejo de errores: ¿typed errors? ¿defects? ¿boundaries?
  - [ ] Evidencia: `.sisyphus/evidence/task-3-architecture-review.md`

  **QA Scenarios**:

  ```
  Scenario: Verificar que se analizaron los servicios principales
    Tool: Bash
    Steps: grep -c 'DatabaseService\|RealtimeService\|LoggerService' .sisyphus/evidence/task-3-architecture-review.md
    Expected: count >= 3
    Evidence: .sisyphus/evidence/task-3-qa.txt
  ```

  **Commit**: NO

- [x] 4. Análisis de Seguridad

  **What to do**: Evaluar manejo de JWT, validación de inputs (schemas), CORS, exposición de errores internos en respuestas HTTP, y manejo de autenticación en WebSockets.
  **Must NOT do**: No realizar pentesting activo. No modificar código.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: análisis de seguridad estático.
  - Skills: [] — Reason: no requiere skills específicas.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 5, 6 | Blocked By: 1

  **References**:
  - `src/index.ts:67-94` — JWT sign/verify con `Effect.try`
  - `src/core/http/http-schemas.ts` — Decoding de inputs
  - `src/index.ts:224-236` — CORS headers
  - `src/core/realtime/realtime-service.ts:225-259` — Auth en WS conduit open

  **Acceptance Criteria**:
  - [ ] Se evalúa si los errores 500 exponen detalles internos al cliente.
  - [ ] Se evalúa la robustez de `decodeRegisterBody`, `decodeCheckQuery`, `decodeTokenCode`.
  - [ ] Se evalúa si CORS es demasiado permisivo (`*`).
  - [ ] Se evalúa si la verificación de token en WS tiene race conditions o manejo de errores incompleto.
  - [ ] Evidencia: `.sisyphus/evidence/task-4-security-review.md`

  **QA Scenarios**:

  ```
  Scenario: Verificar que CORS se documentó
    Tool: Bash
    Steps: grep -c 'CORS\|cors' .sisyphus/evidence/task-4-security-review.md
    Expected: count >= 1
    Evidence: .sisyphus/evidence/task-4-qa.txt
  ```

  **Commit**: NO

- [x] 5. Consolidar Reporte de Diagnóstico

  **What to do**: Integrar hallazgos de Tasks 1-4 en un documento estructurado `docs/rift-next-diagnostico.md`. Categorías: Arquitectura, Effect-TS, Tests, Seguridad, Deuda Técnica. Cada hallazgo debe tener: severidad (Critical/High/Medium/Low), ubicación exacta, descripción, impacto, y evidencia.
  **Must NOT do**: No incluir recomendaciones de migración aquí (van en Task 6). No inventar hallazgos sin evidencia.

  **Recommended Agent Profile**:
  - Category: `writing` — Reason: redacción técnica estructurada.
  - Skills: `effect-ts` — Reason: precisión en terminología Effect.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 6, 7 | Blocked By: 1, 2, 3, 4

  **References**:
  - Evidencia de Tasks 1-4 en `.sisyphus/evidence/`
  - Template: Ver plan skeleton "Deliverables"

  **Acceptance Criteria**:
  - [ ] Documento tiene ≥5 hallazgos arquitectónicos, ≥5 Effect-TS, ≥3 tests, ≥3 seguridad.
  - [ ] Cada hallazgo tiene severidad, ubicación, descripción, impacto.
  - [ ] El documento es legible en Markdown crudo (no requiere renderizado especial).
  - [ ] Evidencia: `docs/rift-next-diagnostico.md`

  **QA Scenarios**:

  ```
  Scenario: Verificar estructura del reporte
    Tool: Bash
    Steps: grep -c '## ' docs/rift-next-diagnostico.md
    Expected: count >= 4 (una por categoría)
    Evidence: .sisyphus/evidence/task-5-qa.txt
  ```

  **Commit**: NO

- [x] 6. Generar Plan de Migración por Fases

  **What to do**: Basado en el diagnóstico y las recomendaciones de Oracle, producir `docs/rift-next-plan-migracion.md`. El plan debe ser incremental, reversible, y preservar comportamiento observable. Fases sugeridas: (1) Tests de caracterización, (2) Eliminar casts y centralizar runtime, (3) Modelar dependencias como servicios Effect, (4) Mejoras oportunistas (TaggedError, Option, etc.).
  **Must NOT do**: No incluir cambios de protocolo, schema, o reemplazo de frameworks. No asumir que toda migración es obligatoria.

  **Recommended Agent Profile**:
  - Category: `oracle` — Reason: diseño de arquitectura de migración.
  - Skills: `effect-ts` — Reason: las fases deben alinearse con patrones Effect idiomáticos.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 7 | Blocked By: 3, 4, 5

  **References**:
  - Oracle review: eliminar `serviceEffect`, centralizar runtime, modelar `RealtimeDependencies` como servicios.
  - Skill: `~/.agents/skills/effect-ts/references/services-layers.md`
  - Skill: `~/.agents/skills/effect-ts/references/runtime.md`
  - Effect source: `~/.effect/packages/effect/src/Runtime.ts`, `Layer.ts`

  **Acceptance Criteria**:
  - [ ] Plan tiene ≥3 fases numeradas.
  - [ ] Cada fase tiene ≤5 tareas concretas.
  - [ ] Cada tarea tiene criterios de aceptación ejecutables por agentes.
  - [ ] Cada fase tiene riesgos identificados y estrategia de mitigación.
  - [ ] Se incluye "Must NOT Change" explícito por fase.
  - [ ] Evidencia: `docs/rift-next-plan-migracion.md`

  **QA Scenarios**:

  ```
  Scenario: Verificar que cada fase tiene tareas
    Tool: Bash
    Steps: grep -c '#### ' docs/rift-next-plan-migracion.md
    Expected: count >= 3
    Evidence: .sisyphus/evidence/task-6-qa.txt
  ```

  **Commit**: NO

- [x] 7. Validar Plan contra Effect Source y Skill

  **What to do**: Revisar que cada recomendación del plan de migración sea consistente con: (a) skill effect-ts (`~/.agents/skills/effect-ts/`), (b) source de Effect (`~/.effect/packages/effect/src/`), (c) patrones existentes en `database-service.ts`. Documentar inconsistencias o riesgos de versión.
  **Must NOT do**: No modificar el plan solo por preferencias; solo corregir inconsistencias técnicas reales.

  **Recommended Agent Profile**:
  - Category: `oracle` — Reason: validación técnica profunda.
  - Skills: `effect-ts` — Reason: comparación directa con referencias.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: — | Blocked By: 6

  **References**:
  - `~/.agents/skills/effect-ts/references/critical-rules.md`
  - `~/.agents/skills/effect-ts/references/services-layers.md`
  - `~/.effect/packages/effect/src/Data.ts` — TaggedError
  - `~/.effect/packages/effect/src/Context.ts` — GenericTag
  - `~/.effect/packages/effect/src/Runtime.ts` — Runtime patterns

  **Acceptance Criteria**:
  - [ ] Cada recomendación de migración tiene al menos una referencia a skill o source.
  - [ ] Se verifica que `Data.TaggedError` está disponible en la versión usada (`effect: ^3.14.0`).
  - [ ] Se documenta si algún patrón requiere versión más reciente de Effect.
  - [ ] Evidencia: `.sisyphus/evidence/task-7-validation.md`

  **QA Scenarios**:

  ```
  Scenario: Verificar referencias cruzadas
    Tool: Bash
    Steps: grep -c '~/.effect\|skill\|references' .sisyphus/evidence/task-7-validation.md
    Expected: count >= 3
    Evidence: .sisyphus/evidence/task-7-qa.txt
  ```

  **Commit**: NO

- [x] 8. Actualizar AGENTS.md de rift-next

  **What to do**: Reescribir `apps/rift-next/AGENTS.md` para reflejar la estructura real del código (`src/core/{database,realtime,http,logger,effect,config}/`), convenciones actuales, y dependencias reales. Eliminar referencias a archivos que ya no existen (`src/web.ts`, `src/sockets.ts`, etc.).
  **Must NOT do**: No inventar convenciones que no existan. No modificar AGENTS.md de otros proyectos.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: edición documental basada en hechos conocidos.
  - Skills: [] — Reason: no requiere skills especiales.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 10 | Blocked By: 1

  **References**:
  - Estructura real: `apps/rift-next/src/core/`
  - Dependencias: `apps/rift-next/package.json`
  - Tests: `apps/rift-next/tests/`

  **Acceptance Criteria**:
  - [ ] AGENTS.md lista los directorios reales de `src/core/`.
  - [ ] AGENTS.md menciona el uso de Effect-TS.
  - [ ] AGENTS.md no referencia archivos inexistentes.
  - [ ] Evidencia: `apps/rift-next/AGENTS.md` (diff capturado en `.sisyphus/evidence/task-8-agents-diff.patch`)

  **QA Scenarios**:

  ```
  Scenario: Verificar que no hay referencias a archivos inexistentes
    Tool: Bash
    Steps: grep -c 'src/web.ts\|src/sockets.ts\|src/database.ts' apps/rift-next/AGENTS.md
    Expected: count == 0
    Evidence: .sisyphus/evidence/task-8-qa.txt
  ```

  **Commit**: YES | Message: `docs(rift-next): update AGENTS.md to reflect actual structure` | Files: `apps/rift-next/AGENTS.md`

- [x] 9. Verificación Build / Test / Lint

  **What to do**: Ejecutar `bun run build`, `bun test`, `bun run lint` (filtrado para `apps/rift-next` si es posible, o desde root). Documentar resultados. Si alguno falla, investigar si es pre-existente o causado por cambios en AGENTS.md (no debería, AGENTS.md no afecta build).
  **Must NOT do**: No modificar código para arreglar fallas pre-existentes (ese no es el scope de este plan).

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: verificación práctica de infraestructura.
  - Skills: [] — Reason: comandos estándar.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 10 | Blocked By: —

  **References**:
  - `apps/rift-next/package.json` scripts: `build`, `test`, `dev`
  - Root `package.json` scripts: `lint`, `build`, `test`

  **Acceptance Criteria**:
  - [ ] `bun run build` en `apps/rift-next` se ejecuta y se captura output.
  - [ ] `bun test` en `apps/rift-next` se ejecuta y se captura output.
  - [ ] `bun run lint` (root o filtrado) se ejecuta y se captura output.
  - [ ] Se documenta si hay fallas pre-existentes.
  - [ ] Evidencia: `.sisyphus/evidence/task-9-build.txt`, `task-9-test.txt`, `task-9-lint.txt`

  **QA Scenarios**:

  ```
  Scenario: Verificar que build no se rompió
    Tool: Bash
    Steps: cd apps/rift-next && bun run build 2>&1 | tail -5
    Expected: output no contiene "error TS" o "Build failed"
    Evidence: .sisyphus/evidence/task-9-build.txt
  ```

  **Commit**: NO

- [x] 10. Revisión Final y Consolidación de Evidencia

  **What to do**: Revisar que todos los entregables existen, son coherentes entre sí, y no contienen contradicciones. Verificar que el plan de migración no propone cambios que violen los "Must NOT Have". Consolidar toda la evidencia en `.sisyphus/evidence/` con un índice.
  **Must NOT do**: No agregar nuevo contenido de análisis en este paso. Solo revisión y consolidación.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: revisión integradora.
  - Skills: [] — Reason: verificación de calidad de documentos.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: F1-F4 | Blocked By: 5, 6, 7, 8, 9

  **References**:
  - Entregables: `docs/rift-next-diagnostico.md`, `docs/rift-next-plan-migracion.md`, `apps/rift-next/AGENTS.md`
  - Evidencia: `.sisyphus/evidence/task-*`

  **Acceptance Criteria**:
  - [ ] Todos los entregables listados en "Deliverables" existen.
  - [ ] No hay contradicciones entre diagnóstico y plan de migración.
  - [ ] El plan de migración no viola ningún "Must NOT Have".
  - [ ] Se genera índice de evidencia: `.sisyphus/evidence/INDEX.md`
  - [ ] Evidencia: `.sisyphus/evidence/INDEX.md`

  **QA Scenarios**:

  ```
  Scenario: Verificar que todos los entregables existen
    Tool: Bash
    Steps: ls docs/rift-next-diagnostico.md docs/rift-next-plan-migracion.md apps/rift-next/AGENTS.md
    Expected: los 3 archivos existen
    Evidence: .sisyphus/evidence/task-10-qa.txt
  ```

  **Commit**: NO

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [x] F1. Plan Compliance Audit — oracle — **APPROVE**
- [x] F2. Code Quality Review — unspecified-high — **APPROVE**
- [x] F3. Real Manual QA — unspecified-high (+ playwright if UI) — **APPROVE**
- [x] F4. Scope Fidelity Check — deep — **APPROVE**

## Commit Strategy

- Task 8 (AGENTS.md) es el único commit de código en este plan.
- Todos los demás entregables son documentación en `docs/` y evidencia en `.sisyphus/evidence/`.
- Si el usuario aprueba el plan después de la Final Verification Wave, se puede hacer un commit opcional consolidando `docs/`.

## Success Criteria

- [x] El usuario confirma que el diagnóstico cubre las áreas de interés.
- [x] El usuario confirma que el plan de migración es viable y bien priorizado.
- [x] Todos los checks de la Final Verification Wave están aprobados.
- [x] `bun run build` y `bun test` pasan para `apps/rift-next` (o se documentan fallas pre-existentes).
