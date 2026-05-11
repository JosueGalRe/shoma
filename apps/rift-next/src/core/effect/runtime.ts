import { Effect, Layer, Runtime } from 'effect'

// Runtime helper para ejecutar Effect en boundaries de Elysia
export const makeRuntime = <R>(layer: Layer.Layer<R>): Runtime.Runtime<R> => {
  const runtime = Effect.runSync(Effect.scoped(Layer.toRuntime(layer)))
  return runtime
}
