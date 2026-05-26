import { RelayOpcode } from '@shoma/protocol-contract'
import { Effect, Exit, Layer, Match } from 'effect'

import { readJwtSecret, signToken, verifyTokenCode } from '../auth'
import { DatabaseService, type DatabaseServiceShape } from '../database/database-service'
import { logger, LoggerLive, LoggerService } from '../logger/logger-utils'
import {
  conduitOpenCloseCode,
  conduitOpenErrorCode,
  runRealtime,
  sendErrorFrame,
  withRealtimeService,
} from '../runtime'

import { extractConduitAuth, readConduitOpenData } from './http-decoders'
import { failureFromCause, type HttpOperation, isRelayHttpError, mapHttpError, type RelayHttpError } from './http-errors'
import {
  decodeCheckQuery,
  decodeRegisterBody,
  MissingPublicKeyError,
  MissingTokenToCheckError,
} from './http-schemas'

import type { RealtimeServiceShape } from '../realtime/realtime-service'
import type { Elysia } from 'elysia'

export async function runHttp<A>(
  program: Effect.Effect<A, RelayHttpError, DatabaseService | LoggerService>,
  operation: HttpOperation,
  getHttpDatabase: () => DatabaseServiceShape,
): Promise<{ status: number; body: unknown }> {
  const HttpLayer = Layer.mergeAll(LoggerLive, Layer.effect(DatabaseService, Effect.sync(() => getHttpDatabase())))
  const exit = await Effect.runPromiseExit(
    Effect.provide(program, HttpLayer).pipe(Effect.timeout('30 seconds'))
  )

  return Exit.match(exit, {
    onFailure: (cause) => {
      const failure = failureFromCause(cause)

      if (isRelayHttpError(failure)) {
        return mapHttpError(failure, operation)
      }

      return { body: { error: 'Internal server error.', ok: false }, status: 500 }
    },
    onSuccess: (value) => ({ body: value, status: 200 }),
  })
}

export async function replyFromEffect<A>(
  set: { status?: number | string },
  program: Effect.Effect<A, RelayHttpError, DatabaseService | LoggerService>,
  operation: HttpOperation,
  getHttpDatabase: () => DatabaseServiceShape,
) {
  const response = await runHttp(program, operation, getHttpDatabase)

  set.status = response.status

  return response.body
}

export const rootProgram = Effect.succeed('Hai, relayo desu.')

export const registerProgram = Effect.fn('Relay.register')((body: unknown) =>
  Effect.gen(function* registerProgram() {
    const pubkey = decodeRegisterBody(body)
    const validated = yield* Match.value(pubkey).pipe(
      Match.when((p): p is MissingPublicKeyError => p instanceof MissingPublicKeyError, (err) => Effect.fail(err)),
      Match.orElse((p: string) => Effect.succeed(p)),
    )

    const secret = yield* readJwtSecret('register')
    const database = yield* DatabaseService
    const log = yield* LoggerService
    const code = yield* database.generateCode(validated)
    const token = yield* signToken(code, secret)

    yield* log.info('register_success', { code })

    const response: { ok: true; token: string } = { ok: true, token }

    return response
  }))

export const checkProgram = Effect.fn('Relay.check')((query: unknown) =>
  Effect.gen(function* checkProgram() {
    const token = decodeCheckQuery(query)
    const validated = yield* Match.value(token).pipe(
      Match.when((t): t is MissingTokenToCheckError => t instanceof MissingTokenToCheckError, (err) => Effect.fail(err)),
      Match.orElse((t: string) => Effect.succeed(t)),
    )

    const secret = yield* readJwtSecret('check')
    const code = yield* verifyTokenCode(validated, secret).pipe(
      Effect.catchTags({
        InvalidTokenError: () => Effect.succeed(null),
        TokenMissingCodeError: () => Effect.succeed(null),
      }),
    )

    if (!code) {
      return false
    }

    const database = yield* DatabaseService
    const entry = yield* database.lookup(code)

    return Boolean(entry)
  }))

export const healthProtocolProgram = Effect.succeed({
  relayOpcodesLoaded: RelayOpcode.RECEIVE === 8,
})

export function setupHttpRoutes(
  app: Elysia,
  getHttpDatabase: () => DatabaseServiceShape,
  getRealtime: () => RealtimeServiceShape | null,
) {
  app.get('/', ({ set }) => replyFromEffect(set, rootProgram, 'root', getHttpDatabase))

  app.post('/register', ({ body, set }) => replyFromEffect(set, registerProgram(body), 'register', getHttpDatabase))

  app.get('/check', ({ query, set }) => replyFromEffect(set, checkProgram(query), 'check', getHttpDatabase))

  app.get('/health/protocol', ({ set }) => replyFromEffect(set, healthProtocolProgram, 'health', getHttpDatabase))

  app.ws('/conduit', {
    close(ws) {
      void runRealtime(withRealtimeService(getRealtime(), (realtime) => realtime.handleConduitClose(ws)))
    },
    message(ws, message) {
      void runRealtime(withRealtimeService(getRealtime(), (realtime) => realtime.handleConduitMessage(ws, message)))
    },
    open(ws) {
      const data = readConduitOpenData(ws.data)
      const { token, publicKey } = extractConduitAuth(data)

      void runRealtime(
        withRealtimeService(getRealtime(), (realtime) =>
          realtime.handleConduitOpen(ws, token, publicKey).pipe(
            Effect.catch((error) =>
              Effect.sync(() => {
                sendErrorFrame(ws, { code: conduitOpenErrorCode(error) })
                setTimeout(() => ws.close(conduitOpenCloseCode(error)), 0)
                logger.warn('conduit_open_error', { error: String(error) })
              }),
            ),
          )
        ),
      )
    },
  })

  app.ws('/mobile', {
    close(ws) {
      void runRealtime(withRealtimeService(getRealtime(), (realtime) => realtime.handleMobileClose(ws)))
    },
    message(ws, message) {
      void runRealtime(withRealtimeService(getRealtime(), (realtime) => realtime.handleMobileMessage(ws, message)))
    },
    open(ws) {
      void runRealtime(withRealtimeService(getRealtime(), (realtime) => realtime.handleMobileOpen(ws)))
    },
  })
}
