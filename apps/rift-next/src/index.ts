import { Elysia } from 'elysia'
import jwt from 'jsonwebtoken'

import { RiftOpcode } from '@mimic/protocol-contract'

import { env } from './core/config/env-config'
import { generateCode, initializeDatabase, lookup, potentiallyUpdate } from './core/database/database'
import type { StartRuntimeOptions, TokenPayload } from './core/http/index-types'
import { extractConduitAuth, readConduitOpenData, readPubkeyFromBody, readTokenCode } from './core/http/index-utils'
import { logger, pinoLogger } from './core/logger/logger-utils'
import { RiftRealtimeManager } from './core/realtime/realtime'

const app = new Elysia()

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

export { extractConduitAuth } from './core/http/index-utils'

const realtime = new RiftRealtimeManager({
  lookup,
  potentiallyUpdate,
  verifyToken: (token: string) => {
    const secret = env.RIFT_JWT_SECRET
    if (!secret) {
      logger.error('missing_jwt_secret_for_token_verification')
      return null
    }

    try {
      const decoded = jwt.verify(token, secret)
      const code = readTokenCode(decoded)
      if (!code) {
        return null
      }

      const payload: TokenPayload = { code }
      return payload
    } catch {
      logger.warn('token_verification_failed')
      return null
    }
  },
  createConnectionId: () => crypto.randomUUID(),
})

export function initializeApp(databasePath?: string) {
  initializeDatabase(databasePath)
}

app.get('/', () => 'Hai, rifto desu.')

app.post('/register', (ctx) => {
  const pubkey = readPubkeyFromBody(ctx.body)

  if (!pubkey) {
    ctx.set.status = 400
    return { ok: false, error: 'Missing public key.' }
  }

  if (!env.RIFT_JWT_SECRET) {
    ctx.set.status = 500
    return { ok: false, error: 'Missing RIFT_JWT_SECRET.' }
  }

  const code = generateCode(pubkey)
  const token = jwt.sign({ code }, env.RIFT_JWT_SECRET)

  logger.info('register_success', { code })

  return { ok: true, token }
})

app.get('/check', (ctx) => {
  const query = ctx.query
  if (typeof query.token !== 'string') {
    ctx.set.status = 400
    return { ok: false, error: 'Missing a token to check.' }
  }

  if (!env.RIFT_JWT_SECRET) {
    ctx.set.status = 500
    return false
  }

  try {
    const decoded = jwt.verify(query.token, env.RIFT_JWT_SECRET)
    const code = readTokenCode(decoded)
    if (!code) {
      return false
    }

    return Boolean(lookup(code))
  } catch {
    return false
  }
})

app.get('/health/protocol', () => ({
  riftOpcodesLoaded: RiftOpcode.RECEIVE === 8,
}))

app.ws('/conduit', {
  open(ws) {
    const data = readConduitOpenData(ws.data)
    const { token, publicKey } = extractConduitAuth(data)

    const ok = realtime.handleConduitOpen(ws, token, publicKey)
    if (!ok) {
      ws.close()
    }
  },
  message(ws, message) {
    realtime.handleConduitMessage(ws, message)
  },
  close(ws) {
    realtime.handleConduitClose(ws)
  },
})

app.ws('/mobile', {
  open(ws) {
    realtime.handleMobileOpen(ws)
  },
  message(ws, message) {
    realtime.handleMobileMessage(ws, message)
  },
  close(ws) {
    realtime.handleMobileClose(ws)
  },
})

const port = env.PORT

export function startRuntime(options: StartRuntimeOptions = {}) {
  const runtimePort = options.port ?? port
  initializeApp(options.databasePath)
  realtime.startKeepAlive(options.keepAliveIntervalMs)

  const hostname = env.HOSTNAME
  const server = app.listen({ port: runtimePort, hostname })
  let stopped = false

  return {
    port: runtimePort,
    hostname,
    stop() {
      if (stopped) {
        return
      }

      stopped = true
      realtime.shutdown()
      server.stop()
      logger.info('runtime_stopped', { port: runtimePort, hostname })
    },
  }
}

if (import.meta.main) {
  const runtime = startRuntime()
  logger.info('runtime_started', { port: runtime.port, hostname: runtime.hostname })

  const shutdown = () => runtime.stop()
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}

export { app }
