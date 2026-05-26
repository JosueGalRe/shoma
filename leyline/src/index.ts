import { Elysia } from 'elysia'

import { makeDatabaseService } from './core/database/database-service'
import { setupHttpRoutes } from './core/http/http-routes'
import { logger, pinoLogger } from './core/logger/logger-utils'
import { startRuntime as _startRuntime, createInitializeApp } from './core/runtime'

import type { StartRuntimeOptions } from './core/http/http-types'
import type { RealtimeServiceShape } from './core/realtime/realtime-service'

export { extractConduitAuth } from './core/http/http-decoders'

const app = new Elysia()
let httpDatabase = makeDatabaseService()
let realtime: RealtimeServiceShape | null = null

export { app }

export const initializeApp = createInitializeApp(
  () => httpDatabase,
  (db) => { httpDatabase = db },
  () => realtime,
  (rt) => { realtime = rt },
)

export async function startRuntime(options: StartRuntimeOptions = {}) {
  return _startRuntime(app, initializeApp, () => httpDatabase, () => realtime, options)
}

setupHttpRoutes(app, () => httpDatabase, () => realtime)

app.onAfterHandle(({ set }) => {
  set.headers['Access-Control-Allow-Origin'] = '*'
  set.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
  set.headers['Access-Control-Allow-Headers'] = 'content-type, authorization'
})

app.options('*', ({ set }) => {
  set.headers['Access-Control-Allow-Origin'] = '*'
  set.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
  set.headers['Access-Control-Allow-Headers'] = 'content-type, authorization'
  set.status = 204
  return ''
})

app.use(pinoLogger.into())


if (import.meta.main) {
  void startRuntime().then((runtime) => {
    logger.info('runtime_started', { hostname: runtime.hostname, port: runtime.port })

    const shutdown = () => {
      void runtime.stop()
    }
    process.once('SIGINT', shutdown)
    process.once('SIGTERM', shutdown)
  }).catch((error: unknown) => {
    logger.error('runtime_start_failed', { error })
    process.exit(1)
  })
}
