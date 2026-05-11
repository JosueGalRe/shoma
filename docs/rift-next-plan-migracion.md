# Plan de Migración por Fases: rift

Este plan propone una migración incremental, reversible y orientada a preservar el comportamiento observable de `rift`. No asume que toda la migración sea obligatoria: cada fase debe aportar valor verificable por sí sola y puede detenerse si el riesgo supera el beneficio.

## Principios

- Preservar contratos HTTP, WebSocket, JWT, rooms/sessions, formato de mensajes, códigos HTTP y estructura de logging.
- Priorizar tests de caracterización antes de refactors internos.
- Reducir deuda Effect-TS sin reemplazar Elysia, Bun, SQLite, `jsonwebtoken` ni el protocolo existente.
- Mantener cambios pequeños, revisables y reversibles.

#### Fase 1: Tests de caracterización

Objetivo: fijar el comportamiento actual antes de tocar runtime, casts o servicios.

Must NOT Change:
- No cambiar endpoints, opcodes, formato de frames, schemas públicos, códigos HTTP ni mensajes WebSocket.
- No cambiar semántica de JWT, registro, `/check`, auth de conduit o lifecycle de sesiones.
- No cambiar implementación productiva salvo ajustes mínimos requeridos por tests.

Tareas:
1. Agregar tests directos para `src/core/realtime/realtime-utils.ts`.
   - Criterios de aceptación: casos válidos e inválidos de `parseFrame` y `socketKey` cubiertos; `bun test tests/unit` pasa.
   - **QA Scenarios**:
     ```
     Scenario: Tests de realtime-utils pasan
       Tool: Bash
       Steps: cd rift && bun test tests/unit/realtime-utils.test.ts 2>&1
       Expected: output contiene "pass" y 0 "fail"
       Evidence: .sisyphus/evidence/fase1-t1-qa.txt

     Scenario: No se modifica comportamiento observable de frames
       Tool: Bash
       Steps: cd rift && bun test tests/integration/websocket-integration.test.ts 2>&1
       Expected: output contiene "pass" y 0 "fail"
       Evidence: .sisyphus/evidence/fase1-t1-qa-regression.txt
     ```

2. Agregar tests directos para `src/core/realtime/realtime-schemas.ts`.
   - Criterios de aceptación: se validan frames malformados, payload inválido y frame válido; no se cambia el formato aceptado actualmente.
   - **QA Scenarios**:
     ```
     Scenario: Tests de realtime-schemas pasan
       Tool: Bash
       Steps: cd rift && bun test tests/unit/realtime-schemas.test.ts 2>&1
       Expected: output contiene "pass" y 0 "fail"
       Evidence: .sisyphus/evidence/fase1-t2-qa.txt

     Scenario: No hay cambios en formato aceptado de frames
       Tool: Bash
       Steps: git diff -- rift/src/core/realtime/realtime-schemas.ts
       Expected: diff está vacío o solo contiene imports de tests
       Evidence: .sisyphus/evidence/fase1-t2-qa-schema.txt
     ```

3. Agregar tests directos para `src/core/http/http-schemas.ts`.
   - Criterios de aceptación: se cubren inputs faltantes, tipos incorrectos y strings actualmente aceptados; no se introducen refinamientos semánticos en esta fase.
   - **QA Scenarios**:
     ```
     Scenario: Tests de http-schemas pasan
       Tool: Bash
       Steps: cd rift && bun test tests/unit/http-schemas.test.ts 2>&1
       Expected: output contiene "pass" y 0 "fail"
       Evidence: .sisyphus/evidence/fase1-t3-qa.txt

     Scenario: No se introducen refinamientos semánticos
       Tool: grep
       Steps: pattern='Schema\.refine\|Schema\.length\|Schema\.pattern' path='rift/src/core/http/http-schemas.ts'
       Expected: count == 0 (sin refinamientos nuevos)
       Evidence: .sisyphus/evidence/fase1-t3-qa-refine.txt
     ```

4. Agregar tests de caracterización para el límite `runRealtime`.
   - Criterios de aceptación: se documenta el comportamiento actual ante failure/defect sin exigir todavía la corrección; `bun test` pasa.
   - **QA Scenarios**:
     ```
     Scenario: Tests de caracterización de runRealtime pasan
       Tool: Bash
       Steps: cd rift && bun test tests/unit/runRealtime.test.ts 2>&1
       Expected: output contiene "pass" y 0 "fail"
       Evidence: .sisyphus/evidence/fase1-t4-qa.txt

     Scenario: Comportamiento de WS no cambia tras agregar tests
       Tool: Bash
       Steps: cd rift && bun test tests/integration/websocket-integration.test.ts 2>&1
       Expected: output contiene "pass" y 0 "fail"
       Evidence: .sisyphus/evidence/fase1-t4-qa-regression.txt
     ```

5. Agregar tests para `DatabaseLive` que demuestren el estado actual no inicializado.
   - Criterios de aceptación: el test falla o marca explícitamente el caso si `DatabaseLive` no inicializa; queda como protección para la Fase 2.
   - **QA Scenarios**:
     ```
     Scenario: Test documenta estado no inicializado
       Tool: Bash
       Steps: cd rift && bun test tests/unit/database-live.test.ts 2>&1
       Expected: output contiene "pass" y documenta el comportamiento actual (o falla intencionalmente con mensaje claro)
       Evidence: .sisyphus/evidence/fase1-t5-qa.txt

     Scenario: Test de regresión de DB pasa
       Tool: Bash
       Steps: cd rift && bun test tests/unit/realtime.test.ts 2>&1
       Expected: output contiene "pass" y 0 "fail"
       Evidence: .sisyphus/evidence/fase1-t5-qa-regression.txt
     ```

Riesgos:
- Riesgo: tests demasiado acoplados a implementación interna.
- Mitigación: afirmar entradas/salidas observables y errores tipados, no detalles de estructura privada.

- Riesgo: bloquear refactors futuros por snapshots frágiles.
- Mitigación: evitar snapshots amplios; preferir assertions específicas.

#### Fase 2: Eliminar casts críticos y centralizar runtime

Objetivo: corregir los anti-patrones de mayor riesgo sin alterar comportamiento externo.

Must NOT Change:
- No cambiar auth JWT, rooms/sessions, lifecycle WS, formato de mensajes, códigos HTTP ni estructura de logs.
- No cambiar el protocolo ni los schemas públicos.
- No convertir errores internos en respuestas más detalladas al cliente.

Tareas:
1. Reemplazar el cast `as Effect.Effect<A, E>` en `serviceEffect`.
   - Criterios de aceptación: `ast_grep_search` no encuentra `as Effect.Effect` en `realtime-service.ts`; `lsp_diagnostics rift/src` no reporta errores.
   - **QA Scenarios**:
     ```
     Scenario: Cast eliminado del código
       Tool: ast_grep_search
       Steps: pattern='as Effect.Effect<A, E>' paths=['rift/src/core/realtime/realtime-service.ts']
       Expected: count == 0
       Evidence: .sisyphus/evidence/fase2-t1-qa-cast.txt

     Scenario: Sin errores de tipo tras el cambio
       Tool: lsp_diagnostics
       Steps: filePath='rift/src/core/realtime/realtime-service.ts' severity='error'
       Expected: count == 0
       Evidence: .sisyphus/evidence/fase2-t1-qa-lsp.txt

     Scenario: Tests existentes siguen pasando
       Tool: Bash
       Steps: cd rift && bun test tests/unit/realtime.test.ts 2>&1
       Expected: output contiene "pass" y 0 "fail"
       Evidence: .sisyphus/evidence/fase2-t1-qa-tests.txt
     ```

2. Cambiar `runRealtime` para usar `Effect.runPromiseExit`.
   - Criterios de aceptación: failures/defects se observan y loguean sin promesas rechazadas no manejadas; tests WS existentes siguen pasando.
   - **QA Scenarios**:
     ```
     Scenario: runRealtime usa runPromiseExit
       Tool: ast_grep_search
       Steps: pattern='runPromise\(' paths=['rift/src/index.ts'] context=2
       Expected: Encontrar solo runPromiseExit para runRealtime; runHttp puede seguir con runPromiseExit existente
       Evidence: .sisyphus/evidence/fase2-t2-qa-pattern.txt

     Scenario: Tests WS pasan sin promesas rechazadas
       Tool: Bash
       Steps: cd rift && bun test tests/integration/websocket-integration.test.ts 2>&1
       Expected: output contiene "pass" y 0 "fail"; no contiene "unhandled promise rejection"
       Evidence: .sisyphus/evidence/fase2-t2-qa-ws.txt

     Scenario: No hay unhandled rejections en logs de test
       Tool: Bash
       Steps: cd rift && bun test 2>&1 | grep -i "unhandled\|rejection"
       Expected: count == 0
       Evidence: .sisyphus/evidence/fase2-t2-qa-rejection.txt
     ```

3. Corregir `DatabaseLive` para ejecutar `initialize` durante adquisición.
   - Criterios de aceptación: el test de Fase 1 para `DatabaseLive` pasa; `close` sigue ejecutándose en release.
   - **QA Scenarios**:
     ```
     Scenario: DatabaseLive inicializa correctamente
       Tool: Bash
       Steps: cd rift && bun test tests/unit/database-live.test.ts 2>&1
       Expected: output contiene "pass" y 0 "fail"
       Evidence: .sisyphus/evidence/fase2-t3-qa-init.txt

     Scenario: Layer ejecuta initialize en adquisición
       Tool: grep
       Steps: pattern='Effect.acquireRelease.*makeDatabaseService' path='rift/src/core/database/database-service.ts' output_mode='content'
       Expected: output contiene 'initialize' o 'Effect.tap' antes de acquireRelease
       Evidence: .sisyphus/evidence/fase2-t3-qa-layer.txt

     Scenario: Tests de integración pasan sin duplicar init
       Tool: Bash
       Steps: cd rift && bun test tests/integration/runtime.test.ts 2>&1
       Expected: output contiene "pass" y 0 "fail"
       Evidence: .sisyphus/evidence/fase2-t3-qa-runtime.txt
     ```

4. Revisar `src/core/effect/runtime.ts`.
   - Criterios de aceptación: si sigue sin uso, eliminarlo o dejarlo claramente no usado; si se conserva, no debe cerrar recursos scoped inmediatamente.
   - **QA Scenarios**:
     ```
     Scenario: Código muerto eliminado o documentado
       Tool: grep
       Steps: pattern='makeRuntime' path='rift/src' output_mode='files_with_matches'
       Expected: count == 0 (eliminado) o count == 1 (solo definición con comentario deprecated)
       Evidence: .sisyphus/evidence/fase2-t4-qa-dead.txt

     Scenario: No hay referencias a runtime.ts desde otros módulos
       Tool: grep
       Steps: pattern='from.*core/effect' path='rift/src' output_mode='files_with_matches'
       Expected: count == 0 (si se elimina) o count >= 1 solo para index.ts
       Evidence: .sisyphus/evidence/fase2-t4-qa-refs.txt

     Scenario: Build pasa tras eliminación
       Tool: Bash
       Steps: cd rift && bun run build 2>&1 | tail -5
       Expected: output no contiene "error TS" ni "Build failed"
       Evidence: .sisyphus/evidence/fase2-t4-qa-build.txt
     ```

5. Ejecutar verificación completa de rift.
   - Criterios de aceptación: `bun test` desde `rift` pasa; `lsp_diagnostics rift/src` sin errores.
   - **QA Scenarios**:
     ```
     Scenario: Toda la suite de tests pasa
       Tool: Bash
       Steps: cd rift && bun test 2>&1
       Expected: output contiene "33 pass" (o count anterior), 0 "fail"
       Evidence: .sisyphus/evidence/fase2-t5-qa-tests.txt

     Scenario: Sin errores de TypeScript
       Tool: lsp_diagnostics
       Steps: filePath='rift/src' severity='error'
       Expected: count == 0
       Evidence: .sisyphus/evidence/fase2-t5-qa-lsp.txt

     Scenario: Build exitoso
       Tool: Bash
       Steps: cd rift && bun run build 2>&1 | tail -5
       Expected: output contiene "Built" o "Done" y no contiene "error TS"
       Evidence: .sisyphus/evidence/fase2-t5-qa-build.txt
     ```

Riesgos:
- Riesgo: cambiar timing de errores realtime y cerrar sockets en momentos distintos.
- Mitigación: mantener handlers existentes y solo cambiar observabilidad del resultado; validar con tests de integración WebSocket.

- Riesgo: inicializar `DatabaseLive` puede duplicar inicialización si algún consumidor ya lo hacía manualmente.
- Mitigación: limitar cambio al Layer y mantener construcción manual existente hasta Fase 3.

#### Fase 3: Modelar dependencias como servicios Effect

Objetivo: reducir construcción manual y hacer explícitas las dependencias sin forzar una reescritura total.

Must NOT Change:
- No reemplazar Elysia, Bun, SQLite, WebSocket ni `jsonwebtoken`.
- No cambiar respuestas HTTP, close codes WS, opcodes ni payloads.
- No cambiar nombres o estructura de logs salvo que tests de caracterización lo permitan explícitamente.

Tareas:
1. Introducir un runtime/layer central para `LoggerService`, `DatabaseService` y `RealtimeStateService`.
   - Criterios de aceptación: las dependencias requeridas aparecen en tipos o Layers, no como casts; `lsp_diagnostics` sin errores.
   - **QA Scenarios**:
     ```
     Scenario: Dependencias aparecen en tipos de servicios
       Tool: ast_grep_search
       Steps: pattern='RealtimeStateService|DatabaseService|LoggerService' paths=['rift/src/index.ts'] output_mode='content'
       Expected: output contiene referencias en tipos o Layers, no solo como parámetros de función
       Evidence: .sisyphus/evidence/fase3-t1-qa-deps.txt

     Scenario: Sin errores de tipo
       Tool: lsp_diagnostics
       Steps: filePath='rift/src' severity='error'
       Expected: count == 0
       Evidence: .sisyphus/evidence/fase3-t1-qa-lsp.txt

     Scenario: Tests unitarios pasan con runtime centralizado
       Tool: Bash
       Steps: cd rift && bun test tests/unit/realtime.test.ts 2>&1
       Expected: output contiene "pass" y 0 "fail"
       Evidence: .sisyphus/evidence/fase3-t1-qa-unit.txt
     ```

2. Reutilizar `LoggerLive` en vez de reconstruir manualmente un logger equivalente en `index.ts`.
   - Criterios de aceptación: logs existentes siguen produciéndose con misma estructura y nivel esperado.
   - **QA Scenarios**:
     ```
     Scenario: LoggerLive se usa en index.ts
       Tool: grep
       Steps: pattern='LoggerLive|Layer\.provide' path='rift/src/index.ts' output_mode='content'
       Expected: output contiene referencia a LoggerLive o Layer.provide
       Evidence: .sisyphus/evidence/fase3-t2-qa-loggerlive.txt

     Scenario: Logs mantienen misma estructura
       Tool: Bash
       Steps: cd rift && bun test tests/integration/runtime.test.ts 2>&1 | grep -i "error\|warn\|info\|debug"
       Expected: count >= 0 (logs siguen apareciendo con niveles esperados)
       Evidence: .sisyphus/evidence/fase3-t2-qa-logs.txt

     Scenario: Tests de runtime pasan
       Tool: Bash
       Steps: cd rift && bun test tests/integration/runtime.test.ts 2>&1
       Expected: output contiene "pass" y 0 "fail"
       Evidence: .sisyphus/evidence/fase3-t2-qa-runtime.txt
     ```

3. Migrar gradualmente construcción de realtime hacia `RealtimeLive` o un Layer equivalente.
   - Criterios de aceptación: `RealtimeStateService` se provee explícitamente; tests unitarios de realtime pasan sin mocks frágiles nuevos.
   - **QA Scenarios**:
     ```
     Scenario: RealtimeStateService se provee explícitamente
       Tool: grep
       Steps: pattern='Effect\.provideService.*RealtimeStateService|RealtimeLive|Layer\.provide' path='rift/src/index.ts' output_mode='content'
       Expected: output contiene al menos una referencia a provision explícita
       Evidence: .sisyphus/evidence/fase3-t3-qa-provide.txt

     Scenario: Tests realtime pasan sin mocks frágiles
       Tool: Bash
       Steps: cd rift && bun test tests/unit/realtime.test.ts 2>&1
       Expected: output contiene "pass" y 0 "fail"
       Evidence: .sisyphus/evidence/fase3-t3-qa-unit.txt

     Scenario: Tests de integración WS pasan
       Tool: Bash
       Steps: cd rift && bun test tests/integration/websocket-integration.test.ts 2>&1
       Expected: output contiene "pass" y 0 "fail"
       Evidence: .sisyphus/evidence/fase3-t3-qa-ws.txt
     ```

4. Mantener el bridge síncrono de database solo como compatibilidad temporal.
   - Criterios de aceptación: su uso queda aislado y documentado; no se agregan nuevos consumidores del bridge.
   - **QA Scenarios**:
     ```
     Scenario: Bridge documentado como legacy
       Tool: grep
       Steps: pattern='@deprecated|legacy bridge|TODO.*remove bridge' path='rift/src/core/database/database.ts' output_mode='content'
       Expected: count >= 1 (documentación de legacy presente)
       Evidence: .sisyphus/evidence/fase3-t4-qa-doc.txt

     Scenario: No hay nuevos consumidores del bridge
       Tool: grep
       Steps: pattern='from.*database\.ts|generateCode|lookup|potentiallyUpdate' path='rift/src' output_mode='files_with_matches'
       Expected: count == consumidores existentes (no aumenta)
       Evidence: .sisyphus/evidence/fase3-t4-qa-consumers.txt

     Scenario: Tests pasan con bridge aislado
       Tool: Bash
       Steps: cd rift && bun test tests/unit/http-smoke.test.ts 2>&1
       Expected: output contiene "pass" y 0 "fail"
       Evidence: .sisyphus/evidence/fase3-t4-qa-tests.txt
     ```

5. Agregar tests de integración para startup/shutdown con el runtime centralizado.
   - Criterios de aceptación: `startRuntime`, `stop()` idempotente y cierre de sockets activos siguen pasando.
   - **QA Scenarios**:
     ```
     Scenario: Startup/shutdown tests pasan
       Tool: Bash
       Steps: cd rift && bun test tests/integration/runtime.test.ts 2>&1
       Expected: output contiene "pass" y 0 "fail"
       Evidence: .sisyphus/evidence/fase3-t5-qa-runtime.txt

     Scenario: Idempotencia de stop verificada
       Tool: Bash
       Steps: cd rift && bun test tests/integration/runtime.test.ts -t "stop" 2>&1
       Expected: output contiene "pass" para casos de stop múltiple
       Evidence: .sisyphus/evidence/fase3-t5-qa-idempotent.txt

     Scenario: Sin sockets activos tras shutdown
       Tool: Bash
       Steps: cd rift && bun test tests/integration/websocket-integration.test.ts -t "disconnect" 2>&1
       Expected: output contiene "pass" y 0 "fail"
       Evidence: .sisyphus/evidence/fase3-t5-qa-sockets.txt
     ```

Riesgos:
- Riesgo: Layer composition puede aumentar complejidad sin beneficio inmediato.
- Mitigación: migrar solo dependencias ya existentes; no crear abstracciones nuevas fuera de Logger/Database/Realtime.

- Riesgo: mezclar construcción manual y Layers durante la transición.
- Mitigación: mantener una frontera clara en `index.ts` y evitar doble inicialización de servicios.

#### Fase 4: Mejoras oportunistas no obligatorias

Objetivo: aprovechar la cobertura para limpiar deuda menor sin cambiar comportamiento observable.

Must NOT Change:
- No introducir cambios de protocolo, schema público o framework.
- No endurecer validaciones HTTP si eso cambia clientes aceptados actualmente, salvo tarea separada aprobada.
- No expandir la taxonomía de errores realtime si los handlers no van a usar esos errores.

Tareas:
1. Migrar errores manuales seleccionados a `Data.TaggedError`.
   - Criterios de aceptación: `_tag` y matching existente siguen funcionando; tests de error-channel pasan.
   - **QA Scenarios**:
     ```
     Scenario: TaggedError usado en lugar de clases manuales
       Tool: ast_grep_search
       Steps: pattern='Data\.TaggedError' paths=['rift/src'] output_mode='files_with_matches'
       Expected: count >= 1
       Evidence: .sisyphus/evidence/fase4-t1-qa-tagged.txt

     Scenario: Matching de _tag sigue funcionando
       Tool: Bash
       Steps: cd rift && bun test tests/unit/realtime.test.ts 2>&1
       Expected: output contiene "pass" y 0 "fail"
       Evidence: .sisyphus/evidence/fase4-t1-qa-matching.txt

     Scenario: Error-channel tests pasan
       Tool: Bash
       Steps: cd rift && bun test tests/unit/realtime.test.ts -t "error" 2>&1
       Expected: output contiene "pass" y 0 "fail"
       Evidence: .sisyphus/evidence/fase4-t1-qa-errors.txt
     ```

2. Consolidar `FrameFormatError` y `FramePayloadError`.
   - Criterios de aceptación: no hay taxonomía duplicada entre schemas y service; mensajes/logs externos no cambian.
   - **QA Scenarios**:
     ```
     Scenario: Sin taxonomía duplicada
       Tool: grep
       Steps: pattern='FrameFormatError|FramePayloadError' path='rift/src' output_mode='files_with_matches'
       Expected: count == 1 (solo un archivo define estos errores)
       Evidence: .sisyphus/evidence/fase4-t2-qa-dedup.txt

     Scenario: Logs externos no cambian
       Tool: Bash
       Steps: cd rift && bun test tests/integration/websocket-integration.test.ts 2>&1 | grep -i "frame\|format\|payload"
       Expected: output contiene los mismos mensajes que antes del cambio
       Evidence: .sisyphus/evidence/fase4-t2-qa-logs.txt

     Scenario: Tests WS pasan
       Tool: Bash
       Steps: cd rift && bun test tests/integration/websocket-integration.test.ts 2>&1
       Expected: output contiene "pass" y 0 "fail"
       Evidence: .sisyphus/evidence/fase4-t2-qa-ws.txt
     ```

3. Eliminar o documentar código muerto confirmado.
   - Criterios de aceptación: `makeRuntime`, Layers no usados o exports infrautilizados quedan eliminados o justificados; `bun test` pasa.
   - **QA Scenarios**:
     ```
     Scenario: Código muerto eliminado o justificado
       Tool: grep
       Steps: pattern='makeRuntime' path='rift/src' output_mode='files_with_matches'
       Expected: count == 0 (eliminado) o count == 1 (definición con comentario justificativo)
       Evidence: .sisyphus/evidence/fase4-t3-qa-dead.txt

     Scenario: No hay exports infrautilizados
       Tool: bash
       Steps: cd rift && grep -r 'from.*core/effect' src/ --include='*.ts' | grep -v 'index.ts'
       Expected: count == 0
       Evidence: .sisyphus/evidence/fase4-t3-qa-exports.txt

     Scenario: Build y tests pasan tras limpieza
       Tool: Bash
       Steps: cd rift && bun run build && bun test 2>&1
       Expected: build exit 0; test output contiene "pass" y 0 "fail"
       Evidence: .sisyphus/evidence/fase4-t3-qa-build.txt
     ```

4. Reducir dualidad de logging.
   - Criterios de aceptación: se conserva una API primaria clara; la fachada síncrona queda solo como compatibilidad si aún tiene consumidores.
   - **QA Scenarios**:
     ```
     Scenario: API primaria de logging es Effect service
       Tool: grep
       Steps: pattern='LoggerService' path='rift/src/index.ts' output_mode='content'
       Expected: output contiene referencia a LoggerService como API principal
       Evidence: .sisyphus/evidence/fase4-t4-qa-primary.txt

     Scenario: Fachada síncrona aislada
       Tool: grep
       Steps: pattern='export const logger|syncLogger' path='rift/src/core/logger/logger-utils.ts' output_mode='content'
       Expected: count == 1 (solo definición) o 0 (eliminada); si existe, tiene comentario deprecated
       Evidence: .sisyphus/evidence/fase4-t4-qa-facade.txt

     Scenario: Logs siguen apareciendo en tests
       Tool: Bash
       Steps: cd rift && bun test tests/integration/runtime.test.ts 2>&1 | grep -c 'info\|warn\|error\|debug'
       Expected: count >= 0 (logs aparecen con estructura esperada)
       Evidence: .sisyphus/evidence/fase4-t4-qa-logs.txt
     ```

5. Evaluar hardening de seguridad como trabajo separado.
   - Criterios de aceptación: CORS, exposición de `Missing RIFT_JWT_SECRET` y validación semántica quedan documentados como próximos cambios, no mezclados con esta migración.
   - **QA Scenarios**:
     ```
     Scenario: Documento de seguridad existe
       Tool: Bash
       Steps: ls docs/rift-security-hardening.md 2>/dev/null || ls docs/rift-plan-migracion.md
       Expected: docs/rift-security-hardening.md existe O el plan de migración contiene sección explícita de seguridad
       Evidence: .sisyphus/evidence/fase4-t5-qa-doc.txt

     Scenario: No hay cambios de CORS en este plan
       Tool: grep
       Steps: pattern='Access-Control-Allow-Origin|CORS' path='rift/src/index.ts' output_mode='content'
       Expected: output contiene '*' (sin cambio) o se documenta explícitamente en plan separado
       Evidence: .sisyphus/evidence/fase4-t5-qa-cors.txt

     Scenario: Validación semántica no se endurece en esta migración
       Tool: grep
       Steps: pattern='Schema\.length\|Schema\.refine\|Schema\.pattern' path='rift/src/core/http/http-schemas.ts' output_mode='content'
       Expected: count == 0 (sin refinamientos nuevos)
       Evidence: .sisyphus/evidence/fase4-t5-qa-validation.txt
     ```

Riesgos:
- Riesgo: convertir errores a `Data.TaggedError` puede alterar serialización o stack traces.
- Mitigación: migrar de a un tipo por vez y validar `_tag`, logs y respuestas externas.

- Riesgo: limpiar código muerto que aún sirva como API futura.
- Mitigación: exigir evidencia de no uso antes de eliminar y preferir documentación si hay duda.

## Verificación global

Después de cada fase:

1. Ejecutar `lsp_diagnostics rift/src`.
2. Ejecutar `bun test` desde `rift`.
3. Revisar que no cambien contratos HTTP/WS cubiertos por tests de integración.
4. Registrar hallazgos en `.sisyphus/notepads/{plan-name}/learnings.md` o `.sisyphus/notepads/{plan-name}/issues.md`.

Verificación de este documento:

```bash
grep -c '#### ' docs/rift-plan-migracion.md
```

El resultado debe ser mayor o igual a `3`.
