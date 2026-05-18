# Reporte de Diagnóstico: leyline

Este documento consolida los hallazgos de la auditoría técnica realizada sobre el componente `leyline`, abarcando arquitectura, uso de Effect-TS, cobertura de pruebas, seguridad y deuda técnica.

## 1. Arquitectura

### 1.1. Cast de borrado de entorno en RealtimeService

- **Severidad:** High
- **Ubicación:** `leyline/src/core/realtime/realtime-service.ts:159-161`
- **Descripción:** La función `serviceEffect` realiza un cast explícito de `Effect.Effect<A, E, RealtimeStateService>` a `Effect.Effect<A, E>`.
- **Impacto:** Oculta requisitos de dependencias al sistema de tipos de Effect, lo que puede provocar errores en tiempo de ejecución si el servicio no se provee correctamente, invalidando la seguridad de tipos que ofrece la librería.
- **Evidencia:** `ast_grep_search` identificó el uso de `as Effect.Effect<A, E>`.

### 1.2. Puente síncrono de Base de Datos (Legacy Bridge)

- **Severidad:** Medium
- **Ubicación:** `leyline/src/core/database/database.ts`
- **Descripción:** El archivo actúa como un wrapper imperativo que utiliza `Effect.runSync` para exponer operaciones de base de datos a llamadores legacy.
- **Impacto:** Convierte errores tipados (como `DatabaseNotInitializedError`) en excepciones lanzadas (`throw`), rompiendo el flujo de control de Effect y forzando a los consumidores a usar `try-catch` tradicionales.
- **Evidencia:** Uso de `Effect.runSync` y `throw new Error('Database not loaded yet.')` en los métodos `generateCode`, `lookup` y `potentiallyUpdate`.

### 1.3. Taxonomía de errores de frames duplicada

- **Severidad:** Low
- **Ubicación:** `src/core/realtime/realtime-schemas.ts` y `src/core/realtime/realtime-service.ts`
- **Descripción:** `FrameFormatError` y `FramePayloadError` están definidos de forma independiente en dos módulos distintos.
- **Impacto:** Dificulta el mantenimiento y la consistencia de los errores. La lógica de parseo en `realtime-utils.ts` lanza errores genéricos que luego son re-mapeados por strings en el servicio.
- **Evidencia:** Definiciones duplicadas de clases de error con el mismo propósito en múltiples archivos.

### 1.4. Helper de runtime scoped potencialmente inseguro e infrautilizado

- **Severidad:** Medium
- **Ubicación:** `src/core/effect/runtime.ts:4-6`
- **Descripción:** `makeRuntime` usa `Effect.runSync(Effect.scoped(Layer.toRuntime(layer)))`, lo que puede finalizar recursos scoped inmediatamente. No se encontraron consumidores en el codebase.
- **Impacto:** Los recursos que dependen de un scope (como conexiones de base de datos o servidores) podrían cerrarse justo después de crear el runtime, invalidando su propósito. Además, añade código muerto al proyecto.
- **Evidencia:** `grep` no encontró consumidores y el análisis de `runtime.ts` muestra la apertura/cierre inmediato del scope.

### 1.5. Reconstrucción manual de servicios en lugar de usar Layers definidos

- **Severidad:** Medium
- **Ubicación:** `src/index.ts:269-275`
- **Descripción:** El código de runtime en `index.ts` reconstruye manualmente `LoggerService` y otros servicios en lugar de usar los Layers definidos (`LoggerLive`, `DatabaseLive`, `RealtimeLive`).
- **Impacto:** Duplicación de lógica de inicialización y pérdida de las ventajas de la inyección de dependencias de Effect. Dificulta el mantenimiento al tener que actualizar la configuración en múltiples lugares.
- **Evidencia:** Comparación entre la definición de Layers en `core/` y la instanciación manual en `index.ts`.

---

## 2. Effect-TS

### 2.1. Límite "Fire-and-Forget" en Realtime descarta fallos

- **Severidad:** High
- **Ubicación:** `leyline/src/index.ts:277-279` (y sus usos en handlers de WS)
- **Descripción:** `runRealtime` utiliza `Effect.runPromise(program)` sin capturar el resultado ni manejar el canal de error/defecto.
- **Impacto:** Los fallos o defectos en la lógica de tiempo real pueden convertirse en "unhandled promise rejections", dificultando la observabilidad y estabilidad del servidor de websockets.
- **Evidencia:** Uso de `void runRealtime(...)` en múltiples puntos de `index.ts` (líneas 304, 318, 321, etc.).

### 2.2. DatabaseLive no ejecuta inicialización

- **Severidad:** High
- **Ubicación:** `leyline/src/core/database/database-service.ts:164-170`
- **Descripción:** El Layer `DatabaseLive` adquiere el servicio y define el cierre, pero nunca invoca el método `initialize`.
- **Impacto:** Cualquier consumidor que use este Layer recibirá un servicio en estado no inicializado, provocando fallos inmediatos al intentar realizar operaciones.
- **Evidencia:** El código del Layer solo contiene `Effect.acquireRelease(makeDatabaseService(), service => service.close)`. Confirmado por tests unitarios que fallan si no se inicializa manualmente.

### 2.3. Uso de clases de error manuales en lugar de Data.TaggedError

- **Severidad:** Medium
- **Ubicación:** Múltiples archivos (e.g., `database-service.ts`, `realtime-service.ts`, `http-schemas.ts`)
- **Descripción:** Se definen errores usando clases manuales con un campo `_tag` en lugar de la utilidad idiomática `Data.TaggedError`.
- **Impacto:** Comportamiento inconsistente de los objetos `Error`, debilidad en la captura de stack traces y falta de integración nativa con las utilidades de inspección de Effect.
- **Evidencia:** Declaraciones como `class DatabaseNotInitializedError { readonly _tag = 'DatabaseNotInitializedError' }`.

### 2.4. Aserción de tipo post-decodificación de frame

- **Severidad:** Low
- **Ubicación:** `src/core/realtime/realtime-schemas.ts:20`
- **Descripción:** `([...result.right] as RiftFrame)` fuerza el tipo del tuple decodificado a `RiftFrame`, bypassando el sistema de tipos después del decoding de Schema.
- **Impacto:** Debilita la garantía de tipos que ofrece `Schema`. Si el esquema cambia pero el cast permanece, TypeScript no detectará la inconsistencia, lo que puede llevar a errores en tiempo de ejecución.
- **Evidencia:** Código fuente en `realtime-schemas.ts` línea 20.

### 2.5. Clases de error declaradas pero no utilizadas como fallas tipadas

- **Severidad:** Medium
- **Ubicación:** `src/core/realtime/realtime-service.ts:15-72`
- **Descripción:** Múltiples variantes de `RealtimeError` están declaradas (ConduitMessageError, MobileMessageError, InvalidOpcodeError, etc.) pero los handlers actualmente loguean/cierran/retornan en lugar de fallar con ellas.
- **Impacto:** Se pierde la capacidad de manejar errores de forma granular en el canal de error de Effect. El flujo se vuelve imperativo y menos predecible, dificultando la recuperación de errores específica.
- **Evidencia:** Declaración de errores en `realtime-service.ts` vs. su falta de uso en `Effect.fail` dentro de los handlers.

---

## 3. Tests

### 3.1. Baja cobertura directa en utilidades core

- **Severidad:** Medium
- **Ubicación:** `src/core/config/`, `src/core/effect/`, `src/core/http/http-schemas.ts`
- **Descripción:** Muchos archivos core solo tienen cobertura indirecta a través de los tests de integración de las rutas.
- **Impacto:** Regresiones en utilidades de bajo nivel (como decodificadores de esquemas o parsing de config) pueden pasar desapercibidas si no afectan el flujo principal de las rutas probadas.
- **Evidencia:** 10 archivos fuente no tienen importaciones directas en la suite de pruebas.

### 3.2. Predominio de pruebas imperativas "Black-Box"

- **Severidad:** Medium
- **Ubicación:** `leyline/tests/`
- **Descripción:** La mayoría de los tests interactúan con la aplicación como una caja negra imperativa, ignorando las capacidades de testing de Effect (salvo en `realtime.test.ts`).
- **Impacto:** No se verifican los canales de error tipados de Effect de forma granular, limitándose a observar efectos secundarios en HTTP/WS.
- **Evidencia:** Solo 1 de 5 archivos de test utiliza activamente utilidades de Effect como `TestContext` o `TestClock`.

### 3.3. Utilidades de efecto y runtime completamente sin tests

- **Severidad:** Medium
- **Ubicación:** `src/core/effect/runtime.ts`, `src/core/effect/index.ts`
- **Descripción:** Los archivos `src/core/effect/runtime.ts` e `src/core/effect/index.ts` no tienen importaciones ni ejercicios directos en la suite de tests. `makeRuntime` aparece completamente sin ejercitar.
- **Impacto:** Falta de validación para la infraestructura base de Effect en el proyecto. Cambios en la forma en que se gestionan los runtimes o los efectos core podrían romper la aplicación sin que los tests lo detecten.
- **Evidencia:** Reporte de cobertura y mapeo de archivos de test en `.sisyphus/evidence/task-2-test-coverage.md`.

---

## 4. Seguridad

### 4.1. CORS excesivamente permisivo

- **Severidad:** High
- **Ubicación:** `leyline/src/index.ts:224-236`
- **Descripción:** La aplicación utiliza un origen comodín (`*`) para todas las respuestas.
- **Impacto:** Permite que cualquier sitio web realice peticiones cross-origin a los endpoints de registro y verificación, aumentando la superficie de exposición.
- **Evidencia:** Cabecera `Access-Control-Allow-Origin: *` configurada en el middleware de Elysia.

### 4.2. Exposición de nombres de configuración interna

- **Severidad:** Medium
- **Ubicación:** `leyline/src/index.ts:96-115`
- **Descripción:** El endpoint `/register` devuelve el nombre exacto de la variable de entorno faltante en caso de error.
- **Impacto:** Revela detalles de la infraestructura y configuración interna (`Missing LEYLINE_JWT_SECRET.`) a clientes externos.
- **Evidencia:** Lógica en `mapHttpError` que serializa el mensaje del error `MissingJwtSecretError`.

### 4.3. Validación semántica débil en decodificadores

- **Severidad:** Medium
- **Ubicación:** `leyline/src/core/http/http-schemas.ts`
- **Descripción:** Los decodificadores validan la estructura (que sea string) pero no el contenido (longitud, formato de pubkey, formato de código de 6 dígitos).
- **Impacto:** Permite el paso de payloads semánticamente inválidos o excesivamente grandes hacia las capas de base de datos y JWT.
- **Evidencia:** Uso de `Schema.Struct({ pubkey: Schema.String })` sin refinamientos adicionales.

---

## 5. Deuda Técnica

### 5.1. Código muerto o infrautilizado

- **Severidad:** Low
- **Ubicación:** `src/core/effect/runtime.ts`, `src/core/database/database-service.ts` (DatabaseLive)
- **Descripción:** Existen helpers de runtime y Layers definidos que no son utilizados por la aplicación principal, la cual opta por construcción manual.
- **Impacto:** Aumenta la carga cognitiva y el tamaño del bundle innecesariamente.
- **Evidencia:** `grep` no encontró consumidores para `makeRuntime` ni uso de `DatabaseLive` en `index.ts`.

### 5.2. Dualidad de APIs de Logging

- **Severidad:** Low
- **Ubicación:** `src/core/logger/logger-utils.ts`
- **Descripción:** Coexisten dos formas de loguear: a través del servicio de Effect y mediante una fachada síncrona que usa `Effect.runSync`.
- **Impacto:** Confusión sobre qué API utilizar y anidamiento innecesario de Effects (e.g., `Effect.sync` llamando a un logger que hace `runSync`).
- **Evidencia:** Presencia de `LoggerService` y el objeto exportado `logger`.
