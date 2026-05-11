# Draft: Evaluación Migración a Effect

## Estado Actual del Código (Hallazgos)

### apps/rift-next (Backend Elysia/Bun)
- **Async/Error handling**: try/catch manual, funciones retornan `null` en lugar de errores tipados (`verifyToken` retorna `null`, `readPubkeyFromBody` retorna `null`, `lookup` retorna `null`)
- **Clases mutables**: `RiftRealtimeManager` maneja estado mutable con Maps/Sets privados
- **Resource management**: Timers (keepAlive), WebSocket lifecycle, DB connections manejados manualmente
- **Testing**: Bun native test runner, pero sin mocks determinísticos de tiempo
- **Schema validation**: Sin validador estructurado (parsing manual con type guards)

### apps/web-next (Frontend React 19)
- **Data fetching**: TanStack Query (caching, deduplication, retries, stale-while-revalidate)
- **State management**: Zustand para estado global
- **HTTP client**: ky con retry configurado
- **Schema validation**: Valibot para parsing de responses LCU
- **Async patterns**: async/await con try/catch en queries
- **Reactivity**: React hooks + TanStack Router

### packages/protocol-contract
- Tipos TypeScript compartidos, sin runtime validation

## Análisis Effect vs Estado Actual

### ¿Qué ofrece Effect que no tenemos?
1. **Error handling estructurado tipado** (`Effect<A, E, R>`) - errores como parte del tipo, no excepciones
2. **Resource safety** - acquire/release automático, incluso en fallos
3. **Composición de efectos** - pipeable, gen syntax para async secuencial
4. **Concurrencia controlada** - fibers, paralelización con límites
5. **Batching/Caching automático** - de requests (solo si hay múltiples calls iguales)
6. **TestClock** - testing determinístico de timers/timeouts
7. **Dependency injection tipado** - Layers/Services
8. **Schema** - validación + derivación de tipos (competidor directo de valibot/zod)
9. **Streams** - para datos async continuos
10. **Tracing/Observability** - logging estructurado integrado

### ¿Dónde hay MATCH?
- **rift-next**: Manejo de errores débil, mucha lógica async compleja, lifecycle management manual, parsing manual sin schemas
- **protocol-contract**: Podría usar Effect Schema para validación runtime + tipos

### ¿Dónde hay FRICTION?
- **web-next**: TanStack Query ya cubre caching/deduplication, Zustand cubre estado global, React Suspense cubre async UI. Integrar Effect con React hooks es verbose.

## Conclusión Preliminar

**SÍ vale la pena para `apps/rift-next` y potencialmente `packages/protocol-contract`. NO vale la pena para `apps/web-next`.**

Valor en rift-next:
- Errores tipados en lugar de `null` / `throw`
- Resource safety para timers y WebSockets
- TestClock para probar reconnection/keepalive determinísticamente
- Schema validation para requests/responses HTTP y WebSocket frames
- Layers para dependency injection (config, DB, logger, JWT)

Fricción en web-next:
- TanStack Query + Zustand + React ya cubren la mayoría de los casos de uso
- El cambio sería mayormente cosmético (async/await → Effect.gen) sin beneficios claros
- Valibot ya cumple la función de schema validation

## Respuestas del Usuario
- **Equipo**: Conoce Effect/FP
- **Objetivo**: Arquitectura/escalabilidad (no hay dolor agudo, quieren mejorar la base para el futuro)
- **Enfoque**: Empezar con módulo piloto, luego escalar

## Estrategia Sugerida (ACTUALIZADA)
1. **Migración completa de `apps/rift-next`** a Effect (el usuario quiere todo, no solo piloto)
2. **Protocol-contract**: Evaluar si agregar Effect.Schema como dual-export (sin romper web-next)
3. **Web-next**: NO migrar. Mantener como está.

## Enfoque de Migración
Dado que el usuario quiere migrar completamente (no piloto), la estrategia será:
- Wave 1: Infraestructura (config, logger, DB) + Effect setup
- Wave 2: HTTP layer (routes, validation, auth)
- Wave 3: WebSocket/realtime layer
- Wave 4: Integración, testing, cleanup

## Preguntas Abiertas
- ¿Qué módulo es mejor candidato para piloto? (esperando exploración de dependencias)
- ¿Blast radius si protocol-contract adopta Effect.Schema? (esperando exploración)
