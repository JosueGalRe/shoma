# Draft: Evaluación de Migración a Effect

## Contexto del Proyecto Actual

### apps/web-next (Frontend)

- **Stack**: React 19, TanStack Router, TanStack Query, Zustand, ky, valibot, Tailwind v4
- **Patrones async**: async/await con try/catch tradicional
- **Data fetching**: TanStack Query con queryOptions/queryFn
- **State management**: Zustand para estado global
- **Validación**: valibot para schemas
- **HTTP client**: ky con manejo manual de errores

### apps/rift-next (Backend)

- **Stack**: Elysia, Bun, SQLite (bun:sqlite), JWT
- **Patrones async**: async/await con try/catch, funciones que retornan null en errores
- **WebSocket**: Clase manual RiftRealtimeManager con Map/Sets para tracking de conexiones
- **Errores**: throw/catch sin tipado, funciones retornan null o booleanos de éxito
- **Testing**: Bun native test runner

### packages/protocol-contract

- Tipos compartidos entre frontend y backend
- Usado por ambas apps

## Hallazgos de Effect

### Qué ofrece Effect

1. **Error handling estructurado**: Errores como parte del tipo `Effect<A, E, R>`
2. **Composición funcional**: pipe, gen syntax para async/await-like con mejor tipado
3. **Resource safety**: acquire/release automático (brackets, scopes)
4. **Concurrencia**: Fibers, paralelización controlada, races
5. **Batching/Caching**: Automático de requests con RequestResolver
6. **Schema**: Validación + derivación de tipos (competidor de valibot/zod)
7. **Testing**: TestClock para testing determinístico de tiempo
8. **Dependency Injection**: Layer system para servicios tipados
9. **Observability**: Logging, metrics, tracing integrados
10. **Streams**: Para datos asíncronos continuos

## Análisis por App

### apps/rift-next - ALTO VALOR

**Problemas actuales que Effect resolvería:**

- Error handling inconsistente: funciones retornan `null` (lookup), `boolean` (potentiallyUpdate), o `throw` (database)
- WebSocket lifecycle complejo sin resource safety garantizada
- Testing de timers (keepalive) requiere mocks manuales
- Dependency injection es ad-hoc (objeto deps pasado a constructor)

**Valor específico:**

- Tipado de errores forzaría manejo explícito en compile time
- `Effect.acquireRelease` para lifecycle de sockets y DB
- `TestClock` para testing determinístico de keepalive intervals
- `Layer` para inyectar config, DB, logger de forma tipada
- `Effect.tryPromise` + `Effect.catchAll` para operaciones async seguras

### apps/web-next - BAJO VALOR / ALTA FRICCIÓN

**Herramientas existentes que cubren lo que ofrece Effect:**

- TanStack Query: caching, deduplication, retries, background refetch (reemplaza batching/caching de Effect)
- Zustand: state management global (Ref/SubscriptionRef de Effect no es tan ergonómico para UI)
- React Suspense/Transitions: manejo de estados de carga y concurrencia UI
- valibot: schema validation (cambiar a Effect.Schema sería marginal)

**Fricción:**

- Integrar Effect con React hooks requiere wrappers verbose
- Perdería el ecosistema de devtools de TanStack Query

### packages/protocol-contract - VALOR MODERADO

- Effect.Schema podría reemplazar valibot para validación + tipos
- Beneficio: unificación de schema validation en toda la codebase
- Costo: refactor de todos los parsers

## Recomendación Preliminar

**Migrar apps/rift-next a Effect. Dejar apps/web-next como está.**

Rift-next se beneficiaría enormemente porque:

1. No hay framework UI que compita (Elysia es HTTP/WebSocket, no state management)
2. Mayor densidad de lógica async compleja
3. Error handling actual es el punto más débil
4. Testing mejoraría drásticamente con TestClock

Web-next no se beneficiaría suficientemente porque TanStack Query + Zustand ya cubren el 80% de lo que Effect ofrece para frontend.

## Preguntas Abiertas

- ¿Problemas específicos que quieren resolver?
- ¿Familiaridad del equipo con FP/Effect?
- ¿Estrategia de migración (big bang vs módulo piloto)?
