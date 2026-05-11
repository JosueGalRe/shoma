# T5: Reporte de Diagnóstico — Causa Raíz Confirmada

## Hipótesis Evaluadas

### Hipótesis 1: rift-next no está corriendo
- **Estado**: DESCARTADA
- **Evidencia**: T1 confirma rift-next corriendo en 0.0.0.0:51001. Health check OK.

### Hipótesis 2: Configuración de URL/Host incorrecta
- **Estado**: DESCARTADA
- **Evidencia**: T3 confirma que todos los componentes usan localhost:51001. rift-next escucha en 0.0.0.0. curl funciona desde 127.0.0.1.

### Hipótesis 3: Handshake WebSocket falla silenciosamente
- **Estado**: PARCIALMENTE CORRECTA (pero no por transporte)
- **Evidencia**: T2 confirma que WS funciona perfectamente. Recibe `[5,null]` correctamente. El problema es cómo web-next maneja esta respuesta.

### Hipótesis 4: No hay conduit conectado
- **Estado**: CONFIRMADA (síntoma)
- **Evidencia**: T2 muestra `[5,null]` = CONNECT_PUBKEY sin conduit. T1 confirma ningún proceso de conduit-next.

### Hipótesis 5: Bug de race condition en manejo de estado/error
- **Estado**: CONFIRMADA (causa raíz del silencio)
- **Evidencia**: 
  - T4 muestra console vacío, ningún error visible
  - Código `rift-store.ts:93-99` (`reduceDisconnect`) limpia `error: null` sin condición
  - Código `use-connection-flow.ts:60-68` llama `disconnect()` en `FAILED_NO_DESKTOP` Y luego de nuevo cuando el socket cierra y el estado pasa a `DISCONNECTED`
  - `rift-client.ts:406-407` (`#handleClose`) siempre setea `DISCONNECTED` sin importar el estado anterior

## Causa Raíz

**Race condition en el manejo de estados del RiftClient:**

Cuando no hay conduit conectado:
1. web-next abre WS, envía `[4, "CODIGO"]`
2. rift-next responde `[5, null]` (CONNECT_PUBKEY sin public key)
3. `RiftClient.#processFrame` recibe opcode 5 con `null`, lanza `RiftHandshakeError`
4. Catch en `#handleMessage` setea estado `FAILED_NO_DESKTOP`
5. `useConnectionFlow` detecta `FAILED_NO_DESKTOP`:
   - Llama `disconnect()` → `reduceDisconnect` limpia `error: null`
   - Llama `setError('connection.errors.riftUnreachable')` → setea `error` correctamente
6. Socket se cierra → `#handleClose` setea estado `DISCONNECTED`
7. `useConnectionFlow` detecta `DISCONNECTED`:
   - Llama `disconnect()` de nuevo → `reduceDisconnect` limpia `error: null` ← **EL ERROR DESAPARECE**

Resultado: la UI pasa a estado "disconnected" sin mostrar error alguno. El usuario ve "no conecta" sin explicación.

## Fixes Necesarios

### Fix 1 (Crítico): Preservar error en `reduceDisconnect`
- Archivo: `apps/web-next/src/core/state/rift-store.ts:93-99`
- Cambio: No limpiar `error` si el estado actual es `'error'`

### Fix 2 (UX): Mejorar mensaje cuando no hay conduit
- Archivo: `apps/web-next/src/i18n/translations/en.ts` y `es.ts`
- El mensaje actual "riftUnreachable" es correcto pero podría ser más específico

### Fix 3 (Opcional): No setear DISCONNECTED después de fallo
- Archivo: `apps/web-next/src/core/rift/rift-client.ts:406-407`
- Cambio: `#handleClose` no debería sobrescribir `FAILED_NO_DESKTOP`/`FAILED_DESKTOP_DENY`

## Scope de Implementación
- **NO aplica T7** (fix de URL): URLs están correctas
- **NO aplica T8** (fix de handshake WS): WS funciona perfectamente
- **SÍ aplica T9** (mejora UX): Bug de race condition + mejorar mensaje de error
