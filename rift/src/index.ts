import { Elysia } from 'elysia'
import { Cause, Data, Effect, Exit, Layer, Option } from 'effect'
import jwt from 'jsonwebtoken'

import { RiftOpcode } from '@mimic/protocol-contract'

import { env, MissingJwtSecretError } from './core/config/env-config'
import {
  DatabaseNotInitializedError,
  DatabaseOpenError,
  DatabaseQueryError,
  DatabaseService,
  makeDatabaseService,
} from './core/database/database-service'
import { decodeCheckQuery, decodeRegisterBody, decodeTokenCode, MissingPublicKeyError, MissingTokenToCheckError, TokenMissingCodeError } from './core/http/http-schemas'
import type { StartRuntimeOptions, TokenPayload } from './core/http/index-types'
import { extractConduitAuth, readConduitOpenData, readTokenCode } from './core/http/index-utils'
import { logger, LoggerLive, LoggerService, pinoLogger } from './core/logger/logger-utils'
import {
  RealtimeLive,
  RealtimeService,
  RealtimeStateLive,
} from './core/realtime/realtime-service'
import type { RealtimeDependencies } from './core/realtime/realtime-types'

const app = new Elysia()
let httpDatabase = makeDatabaseService()
let realtime: RealtimeService | null = null
const HttpLayer = Layer.mergeAll(LoggerLive, Layer.effect(DatabaseService, Effect.sync(() => httpDatabase)))

type HttpOperation = 'register' | 'check' | 'root' | 'health'

type RiftHttpError =
  | MissingPublicKeyError
  | MissingTokenToCheckError
  | (MissingJwtSecretError & { readonly operation?: HttpOperation })
  | DatabaseNotInitializedError
  | DatabaseOpenError
  | DatabaseQueryError
  | TokenSignError
  | InvalidTokenError
  | TokenMissingCodeError

type HttpErrorBody = { readonly ok: false; readonly error: string } | false

interface HttpMappedError {
  readonly status: number
  readonly body: HttpErrorBody
}

class TokenSignError extends Data.TaggedError('TokenSignError')<{ cause: unknown }> {}

class InvalidTokenError extends Data.TaggedError('InvalidTokenError')<{ cause: unknown }> {}

class RealtimeNotInitializedError extends Data.TaggedError('RealtimeNotInitializedError')<{ message: string }> {}

function missingJwtSecret(operation: HttpOperation): MissingJwtSecretError & { readonly operation: HttpOperation } {
  return Object.assign(new MissingJwtSecretError(), { operation })
}

function readJwtSecret(operation: HttpOperation) {
  const secret = env.RIFT_JWT_SECRET

  return secret ? Effect.succeed(secret) : Effect.fail(missingJwtSecret(operation))
}

function signToken(code: string, secret: string) {
  return Effect.try({
    try: () => jwt.sign({ code }, secret),
    catch: (cause) => new TokenSignError({ cause }),
  })
}

function verifyTokenCode(token: string, secret: string) {
  return Effect.gen(function*() {
    const decoded = yield* Effect.try({
      try: () => jwt.verify(token, secret),
      catch: (cause) => new InvalidTokenError({ cause }),
    })

    const code = decodeTokenCode(decoded)
    if (code instanceof TokenMissingCodeError) {
      return yield* Effect.fail(code)
    }

    return code
  })
}

function mapHttpError(error: RiftHttpError, operation: HttpOperation): HttpMappedError {
  switch (error._tag) {
    case 'MissingPublicKeyError':
      return { status: 400, body: { ok: false, error: 'Missing public key.' } }
    case 'MissingTokenToCheckError':
      return { status: 400, body: { ok: false, error: 'Missing a token to check.' } }
    case 'MissingJwtSecretError':
      if ((error.operation ?? operation) === 'check') {
        return { status: 500, body: false }
      }
      return { status: 500, body: { ok: false, error: 'Missing RIFT_JWT_SECRET.' } }
    case 'DatabaseNotInitializedError':
    case 'DatabaseOpenError':
    case 'DatabaseQueryError':
    case 'TokenSignError':
      return { status: 500, body: { ok: false, error: 'Internal server error.' } }
    case 'InvalidTokenError':
    case 'TokenMissingCodeError':
      return { status: 200, body: false }
  }
}

function failureFromCause(cause: Cause.Cause<unknown>): unknown {
  const failure = Cause.failureOption(cause)

  return Option.isSome(failure) ? failure.value : Cause.squash(cause)
}

async function runHttp<A>(
  program: Effect.Effect<A, RiftHttpError, DatabaseService | LoggerService>,
  operation: HttpOperation,
): Promise<{ status: number; body: unknown }> {
  const exit = await Effect.runPromiseExit(Effect.provide(program, HttpLayer))

  return Exit.match(exit, {
    onSuccess: (value) => ({ status: 200, body: value }),
    onFailure: (cause) => {
      const failure = failureFromCause(cause)

      if (isRiftHttpError(failure)) {
        return mapHttpError(failure, operation)
      }

      return { status: 500, body: { ok: false, error: 'Internal server error.' } }
    },
  })
}

function isRiftHttpError(error: unknown): error is RiftHttpError {
  if (typeof error !== 'object' || error === null || !('_tag' in error)) {
    return false
  }

  const tag = error._tag

  return (
    tag === 'MissingPublicKeyError' ||
    tag === 'MissingTokenToCheckError' ||
    tag === 'MissingJwtSecretError' ||
    tag === 'DatabaseNotInitializedError' ||
    tag === 'DatabaseOpenError' ||
    tag === 'DatabaseQueryError' ||
    tag === 'TokenSignError' ||
    tag === 'InvalidTokenError' ||
    tag === 'TokenMissingCodeError'
  )
}

const rootProgram = Effect.succeed('Hai, rifto desu.')

const registerProgram = (body: unknown) =>
  Effect.gen(function*() {
    const pubkey = decodeRegisterBody(body)
    if (pubkey instanceof MissingPublicKeyError) {
      return yield* Effect.fail(pubkey)
    }

    const secret = yield* readJwtSecret('register')
    const database = yield* DatabaseService
    const log = yield* LoggerService
    const code = yield* database.generateCode(pubkey)
    const token = yield* signToken(code, secret)

    yield* log.info('register_success', { code })

    return { ok: true, token } as const
  })

const checkProgram = (query: unknown) =>
  Effect.gen(function*() {
    const token = decodeCheckQuery(query)
    if (token instanceof MissingTokenToCheckError) {
      return yield* Effect.fail(token)
    }

    const secret = yield* readJwtSecret('check')
    const code = yield* verifyTokenCode(token, secret).pipe(
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
  })

const healthProtocolProgram = Effect.succeed({
  riftOpcodesLoaded: RiftOpcode.RECEIVE === 8,
})

async function replyFromEffect<A>(
  set: { status?: number | string },
  program: Effect.Effect<A, RiftHttpError, DatabaseService | LoggerService>,
  operation: HttpOperation,
) {
  const response = await runHttp(program, operation)

  set.status = response.status
  return response.body
}

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

const realtimeDeps: RealtimeDependencies = {
  lookup: (code) =>
    Effect.provideService(
      Effect.gen(function*() {
        const database = yield* DatabaseService
        const entry = yield* database.lookup(code)

        return entry ? { code: entry.code, public_key: entry.publicKey } : null
      }),
      DatabaseService,
      httpDatabase,
    ),
  potentiallyUpdate: (code, pubkey) =>
    Effect.provideService(
      Effect.gen(function*() {
        const database = yield* DatabaseService

        return yield* database.updatePublicKey(code, pubkey)
      }),
      DatabaseService,
      httpDatabase,
    ),
  verifyToken: (token: string) =>
    Effect.gen(function*() {
      const secret = env.RIFT_JWT_SECRET
      const log = yield* LoggerService

      if (!secret) {
        yield* log.error('missing_jwt_secret_for_token_verification')
        return null
      }

      const decoded = yield* Effect.try({
        try: () => jwt.verify(token, secret),
        catch: (cause) => new InvalidTokenError({ cause }),
      }).pipe(
        Effect.catchAll(() =>
          log.warn('token_verification_failed').pipe(Effect.as(null))
        ),
      )

      if (!decoded) {
        return null
      }

      const code = readTokenCode(decoded)
      if (!code) {
        return null
      }

      const payload: TokenPayload = { code }
      return payload
    }).pipe(Effect.provide(LoggerLive)),
  createConnectionId: () => crypto.randomUUID(),
}

const RealtimeDependenciesLayer = Layer.mergeAll(LoggerLive, RealtimeStateLive)
const RealtimeLayer = RealtimeLive(realtimeDeps)
const realtimeServiceProgram = Effect.provide(
  Effect.provide(RealtimeService, RealtimeLayer),
  RealtimeDependenciesLayer,
)

function runRealtime<A, E>(program: Effect.Effect<A, E>) {
  Effect.runPromiseExit(program).then((exit) => {
    Exit.match(exit, {
      onSuccess: () => {},
      onFailure: (cause) => {
        logger.error('realtime_effect_failed', { cause: Cause.squash(cause) })
      },
    })
  })
}

function withRealtimeService<A, E>(
  useService: (realtime: RealtimeService) => Effect.Effect<A, E>,
): Effect.Effect<A, E | RealtimeNotInitializedError> {
  const currentRealtime = realtime

  if (!currentRealtime) {
    return Effect.fail(new RealtimeNotInitializedError({ message: 'Realtime service not initialized' }))
  }

  return useService(currentRealtime)
}

export function initializeApp(databasePath?: string) {
  return Effect.gen(function*() {
    const previousDatabase = httpDatabase
    const previousRealtime = realtime
    const database = makeDatabaseService(databasePath)
    yield* database.initialize
    const nextRealtime = yield* realtimeServiceProgram

    if (previousRealtime) {
      yield* previousRealtime.shutdown
    }

    yield* previousDatabase.close

    httpDatabase = database
    realtime = nextRealtime
  })
}

app.get('/', ({ set }) => replyFromEffect(set, rootProgram, 'root'))

app.post('/register', ({ body, set }) => replyFromEffect(set, registerProgram(body), 'register'))

app.get('/check', ({ query, set }) => replyFromEffect(set, checkProgram(query), 'check'))

app.get('/health/protocol', ({ set }) => replyFromEffect(set, healthProtocolProgram, 'health'))

app.ws('/conduit', {
  open(ws) {
    const data = readConduitOpenData(ws.data)
    const { token, publicKey } = extractConduitAuth(data)

    void runRealtime(
      withRealtimeService((realtime) =>
        realtime.handleConduitOpen(ws, token, publicKey).pipe(
          Effect.catchAll((error) =>
            Effect.sync(() => {
              ws.close()
              logger.warn('conduit_open_error', { reason: error._tag })
            }),
          ),
        )
      ),
    )
  },
  message(ws, message) {
    void runRealtime(withRealtimeService((realtime) => realtime.handleConduitMessage(ws, message)))
  },
  close(ws) {
    void runRealtime(withRealtimeService((realtime) => realtime.handleConduitClose(ws)))
  },
})

app.ws('/mobile', {
  open(ws) {
    void runRealtime(withRealtimeService((realtime) => realtime.handleMobileOpen(ws)))
  },
  message(ws, message) {
    void runRealtime(withRealtimeService((realtime) => realtime.handleMobileMessage(ws, message)))
  },
  close(ws) {
    void runRealtime(withRealtimeService((realtime) => realtime.handleMobileClose(ws)))
  },
})

const port = env.PORT

export async function startRuntime(options: StartRuntimeOptions = {}) {
  const runtimePort = options.port ?? port
  await Effect.runPromise(
    initializeApp(options.databasePath).pipe(
      Effect.flatMap(() => withRealtimeService((realtime) => realtime.startKeepAlive(options.keepAliveIntervalMs))),
    ),
  )

  const hostname = env.HOSTNAME
  const server = app.listen({ port: runtimePort, hostname })
  let stopped = false

  return {
    port: runtimePort,
    hostname,
    async stop() {
      if (stopped) {
        return
      }

      stopped = true
      const currentRealtime = realtime
      if (currentRealtime) {
        await Effect.runPromise(currentRealtime.shutdown)
      }
      await Effect.runPromise(httpDatabase.close)
      const ignoreAlreadyStopped = (cause: unknown) => {
        if (!(cause instanceof Error && cause.message.includes("Elysia isn't running"))) {
          throw cause
        }
      }

      if (app.server) {
        try {
          const serverStopped = Promise.resolve(server.stop()).catch(ignoreAlreadyStopped)
          await Promise.race([serverStopped, Bun.sleep(100)])
        } catch (cause) {
          ignoreAlreadyStopped(cause)
        }
      }
      logger.info('runtime_stopped', { port: runtimePort, hostname })
    },
  }
}

if (import.meta.main) {
  void startRuntime().then((runtime) => {
    logger.info('runtime_started', { port: runtime.port, hostname: runtime.hostname })

    const shutdown = () => {
      void runtime.stop()
    }
    process.once('SIGINT', shutdown)
    process.once('SIGTERM', shutdown)
  }).catch((cause: unknown) => {
    logger.error('runtime_start_failed', { cause })
    process.exit(1)
  })
}

export { app }
