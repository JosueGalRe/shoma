# Task 4 — Security Review: apps/rift-next

## Alcance

Revisión estática de `apps/rift-next` enfocada en JWT, validación de inputs HTTP, CORS, exposición de errores HTTP y autenticación WebSocket. No se realizó pentesting activo ni se modificó código.

Archivos revisados:

- `apps/rift-next/src/index.ts`
- `apps/rift-next/src/core/http/http-schemas.ts`
- `apps/rift-next/src/core/http/index-utils.ts`
- `apps/rift-next/src/core/realtime/realtime-service.ts`
- `apps/rift-next/src/core/realtime/realtime-types.ts`
- `apps/rift-next/src/core/realtime/realtime-utils.ts`

## Hallazgos

### 1. JWT HTTP y WS tienen semántica consistente, pero la configuración faltante se expone en `/register`

**Severidad:** Medium  
**Ubicación:** `apps/rift-next/src/index.ts:67-94`, `apps/rift-next/src/index.ts:96-115`, `apps/rift-next/src/index.ts:242-265`

`signToken` y `verifyTokenCode` envuelven `jsonwebtoken` con `Effect.try`, por lo que errores de firma/verificación quedan tipados como `TokenSignError` e `InvalidTokenError`. En `/check`, los tokens inválidos o sin `code` se convierten en `false` con HTTP 200, evitando filtrar el motivo exacto al cliente.

El caso débil está en `mapHttpError`: cuando falta `RIFT_JWT_SECRET`, `/check` devuelve `500` con body `false`, pero `/register` devuelve `{ ok: false, error: 'Missing RIFT_JWT_SECRET.' }`. Esto no expone stack traces ni valores secretos, pero sí revela un nombre interno de variable/configuración a clientes externos.

### 2. Los errores 500 generalmente no exponen detalles internos, salvo el caso de `MissingJwtSecretError`

**Severidad:** Medium  
**Ubicación:** `apps/rift-next/src/index.ts:96-115`, `apps/rift-next/src/index.ts:124-141`

Los errores de base de datos, firma JWT, defects no tipados y failures no reconocidos se mapean a `{ ok: false, error: 'Internal server error.' }`, lo cual evita exponer excepciones, queries, causas crudas o stacks al cliente. `failureFromCause` solo se usa internamente para distinguir errores tipados y no serializa `Cause` al response.

Excepción: `MissingJwtSecretError` en operación distinta de `check` devuelve el texto `Missing RIFT_JWT_SECRET.`. Esto revela detalle operacional. No se observó exposición directa de `error.cause`, `cause.message` o stack traces en respuestas HTTP 500.

### 3. `decodeRegisterBody`, `decodeCheckQuery` y `decodeTokenCode` validan forma mínima, no robustez semántica

**Severidad:** Medium  
**Ubicación:** `apps/rift-next/src/core/http/http-schemas.ts:23-29`, `apps/rift-next/src/core/http/http-schemas.ts:45-67`

Las funciones usan `Schema.decodeUnknownEither` sobre structs estrictos en cuanto a campos requeridos de tipo string:

- `decodeRegisterBody` exige `{ pubkey: string }`.
- `decodeCheckQuery` exige `{ token: string }`.
- `decodeTokenCode` exige `{ code: string }`.

Esto es sólido contra tipos no-string, cuerpos ausentes y payloads JWT sin `code`. Sin embargo, la robustez es solo estructural: no hay límites de longitud, rechazo de strings vacíos, formato esperado para `pubkey`, formato esperado para JWT, ni validación de que `code` sea un código de 6 dígitos. Como evaluación estática, esto aumenta superficie para entradas excesivamente grandes o semánticamente inválidas que pasan al flujo de DB/JWT aunque no cambien el protocolo.

### 4. CORS es permisivo con origen comodín

**Severidad:** High  
**Ubicación:** `apps/rift-next/src/index.ts:224-236`

La aplicación añade en todas las respuestas manejadas y preflight:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: content-type, authorization
```

Esto permite llamadas cross-origin desde cualquier sitio. Dado que `/register` emite tokens y `/check` verifica tokens, el diseño queda expuesto a consumo desde orígenes arbitrarios. No se observó `Access-Control-Allow-Credentials: true`, por lo que el riesgo típico de cookies/credenciales ambient no aplica aquí; aun así, `*` es más permisivo de lo necesario si el servicio espera clientes conocidos.

### 5. Autenticación WS del conduit falla cerrado, pero su ejecución async tiene manejo incompleto para defects posteriores

**Severidad:** Medium  
**Ubicación:** `apps/rift-next/src/index.ts:299-315`, `apps/rift-next/src/core/realtime/realtime-service.ts:225-259`

En `open` de `/conduit`, `readConduitOpenData` + `extractConduitAuth` extraen `token` y `publicKey` desde query, headers o URL. `handleConduitOpen` rechaza missing auth, token inválido y código stale antes de registrar el socket en mapas de estado. El caller captura `ConduitOpenError`, cierra el socket y registra solo `_tag`, por lo que la autenticación falla cerrado y no expone detalle al cliente.

No se identificó una race condition evidente en la verificación del token dentro de un único proceso: la secuencia `verifyToken` → `potentiallyUpdate` → actualización de mapas es síncrona dentro del Effect, y el registro del socket ocurre después de pasar auth. Riesgos residuales:

- `runRealtime` usa `Effect.runPromise` y los handlers hacen `void runRealtime(...)`; solo `open` de `/conduit` tiene `Effect.catchAll`. Defects no tipados, interrupciones o excepciones inesperadas en mensajes/cierres WS pueden quedar como promesas rechazadas no observadas.
- La autenticación se realiza solo al abrir el conduit. Si el secreto JWT cambia o el token queda invalidado después, las conexiones existentes permanecen registradas hasta cierre.
- En despliegues multi-proceso, los `Map` locales no coordinan simultaneidad entre instancias; esta revisión solo confirma que no hay carrera obvia dentro del proceso actual.

### 6. Extracción de auth WS acepta múltiples ubicaciones y normaliza parcialmente nombres de clave

**Severidad:** Low  
**Ubicación:** `apps/rift-next/src/core/http/index-utils.ts:28-53`, `apps/rift-next/src/core/http/http-schemas.ts:91-115`

`extractConduitAuth` admite `token` y `publicKey`/`publickey`/`public-key` desde query, headers y URL. Luego valida la forma `{ token: string, publicKey: string }` con `decodeConduitAuth`. Si la validación falla, devuelve los valores parciales para que `handleConduitOpen` los rechace explícitamente como missing auth.

El comportamiento es seguro por defecto para datos faltantes o no-string, pero la amplitud de fuentes aceptadas facilita que credenciales aparezcan en URLs, logs de proxies o historial si el cliente usa query parameters.

## Resumen de criterios solicitados

- **Errores 500:** no exponen causas internas en general; excepción documentada: `/register` puede revelar `Missing RIFT_JWT_SECRET.`.
- **Decoders:** robustos para tipos requeridos mínimos; débiles en validación semántica, longitud y strings vacíos.
- **CORS:** documentado como demasiado permisivo por `Access-Control-Allow-Origin: *`.
- **Auth WS:** falla cerrado en `open`; no hay race intra-proceso evidente, pero hay manejo incompleto de defects/promesas en handlers async posteriores y auth no se revalida tras abrir conexión.
