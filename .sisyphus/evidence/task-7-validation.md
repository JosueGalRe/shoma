# Task 7 Validation: Rift Next Effect Migration Plan

## Resultado

VALIDADO. El plan en `docs/rift-next-plan-migracion.md` es técnicamente consistente con:

- Skill Effect-TS: `~/.agents/skills/effect-ts/references/critical-rules.md`
- Skill Services/Layers: `~/.agents/skills/effect-ts/references/services-layers.md`
- Effect source: `~/.effect/packages/effect/src/Data.ts`
- Patrón existente: `apps/rift-next/src/core/database/database-service.ts`

## Evidencia

### 1. Eliminar casts críticos

El plan recomienda eliminar `as Effect.Effect` en `serviceEffect`.

Consistencia:

- `critical-rules.md` líneas 43-65 recomienda evitar assertions como `as any`, `as never`, `as unknown` y resolver el tipo subyacente.
- Aunque el cast actual es `as Effect.Effect<A, E>`, tiene el mismo problema: oculta el requerimiento `RealtimeStateService`.
- Código actual: `apps/rift-next/src/core/realtime/realtime-service.ts:159-160`.

Conclusión: consistente. Debe reemplazarse por provisión explícita del servicio o por una firma que no mienta sobre `R`.

### 2. Usar `Effect.runPromiseExit` en realtime

El plan recomienda cambiar `runRealtime` de `Effect.runPromise` a `Effect.runPromiseExit`.

Consistencia:

- `index.ts:124-141` ya usa `Effect.runPromiseExit` en `runHttp` y luego interpreta `Exit`.
- `critical-rules.md` líneas 26-41 recomienda `Effect.result`, `catchAll` o inspección explícita de failures en vez de asumir excepciones.
- Effect source contiene referencias/export de `runPromiseExit` en `~/.effect/packages/effect/src/Effect.ts`.

Conclusión: consistente. Riesgo principal: no basta con cambiar la función; los callsites que hacen `void runRealtime(...)` deben loguear `Exit.Failure` para no convertir fallos en silencio.

### 3. Inicializar `DatabaseLive` durante adquisición

El plan recomienda corregir `DatabaseLive` para ejecutar `initialize` durante adquisición.

Consistencia:

- Código actual `database-service.ts:164-170` crea el servicio con `Effect.sync(() => makeDatabaseService())` y registra release con `service.close`, pero no ejecuta `initialize`.
- El propio `DatabaseService` expone `initialize` como efecto requerido antes de uso (`database-service.ts:31-37`).
- `services-layers.md` líneas 5-23 valida el patrón de servicios provistos por Layer.
- Effect source expone `Effect.acquireRelease`, consistente con adquirir recurso inicializado y liberar con `close`.

Conclusión: consistente. Cambio recomendado: adquisición debe crear el servicio y ejecutar `service.initialize` antes de retornarlo; release debe mantener `service.close`.

### 4. Revisar `makeRuntime`

El plan recomienda eliminarlo si no se usa o corregirlo si se conserva.

Consistencia:

- Código actual `apps/rift-next/src/core/effect/runtime.ts:4-6` devuelve un `Runtime` obtenido dentro de `Effect.scoped(Layer.toRuntime(layer))`.
- Esto es riesgoso para recursos scoped porque el scope puede cerrarse al terminar la adquisición del runtime.
- El plan exige que, si se conserva, "no debe cerrar recursos scoped inmediatamente".

Conclusión: consistente. Riesgo real confirmado.

### 5. Modelar dependencias como Services/Layers

El plan recomienda introducir runtime/layer central para `LoggerService`, `DatabaseService` y `RealtimeStateService`.

Consistencia:

- El proyecto ya usa `Context.GenericTag` en `DatabaseService` (`database-service.ts:39`) y `RealtimeStateService`.
- `services-layers.md` muestra `Context.Tag` + `Layer.succeed`/`Layer.effect` como patrón canónico.
- No es necesario migrar a `Effect.Service`, porque el skill solo lo presenta como alternativa; además la variante con parámetros requiere 3.16.0+, mientras el proyecto declara `effect: ^3.14.0`.

Conclusión: consistente. Recomendación: mantener `Context.GenericTag`/`Layer.*` para minimizar cambio.

### 6. `Data.TaggedError` y versión `effect: ^3.14.0`

Verificado:

- `apps/rift-next/package.json` declara `"effect": "^3.14.0"`.
- `bun.lock` resuelve `effect@3.21.2`.
- `~/.effect/packages/effect/src/Data.ts:580-590` exporta `TaggedError`.
- La definición de `Data.TaggedError` está marcada `@since 2.0.0`.
- Verificación adicional contra `effect@3.14.0` en unpkg confirma `export declare const TaggedError`.

Conclusión: `Data.TaggedError` está disponible y es compatible con el rango declarado.

### 7. Migrar errores manuales a `Data.TaggedError`

Consistencia:

- `critical-rules.md` recomienda errores yieldables y retorno explícito con `return yield*`.
- `Data.TaggedError` produce errores con `_tag` y `Cause.YieldableError`.
- El plan lo ubica en Fase 4 como oportunista, no como prerrequisito, lo cual reduce riesgo.

Riesgos:

- Puede cambiar serialización, `name`, stack traces o shape observable.
- Hay lógica con `instanceof FrameFormatError` / `FramePayloadError`; al migrar debe mantenerse `class X extends Data.TaggedError("X")` para conservar `instanceof`.
- Existen errores duplicados entre realtime schemas/service; consolidar antes o durante la migración evita confusión de clases con mismo `_tag`.

Conclusión: consistente con riesgo correctamente documentado.

## Inconsistencias encontradas

No se encontraron inconsistencias técnicas que requieran modificar el plan.

## Riesgos de versión

- Evitar recomendaciones del skill que requieren versiones posteriores si no están explícitas en el plan:
  - `Effect.Service` con parámetros: 3.16.0+
  - `Context.ReadonlyTag`: 3.18.0+
- El plan actual no depende de esas APIs, por lo que no hay bloqueo de versión.
- `Data.TaggedError` sí es seguro para `^3.14.0`.

## Verificación grep

Comando esperado:

```bash
grep -E 'critical-rules|services-layers|Data.ts|database-service.ts|runPromiseExit|Data.TaggedError' .sisyphus/evidence/task-7-validation.md
```
