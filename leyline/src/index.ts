import { Elysia } from 'elysia'
import { Cause, Effect, Exit, Layer, Match, Option, Schema } from 'effect'
import jwt from 'jsonwebtoken'

import { RelayOpcode } from '@shoma/protocol-contract'

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
  type RealtimeServiceShape,
  RealtimeStateLive,
} from './core/realtime/realtime-service'
import type { RealtimeDependencies } from './core/realtime/realtime-types'

const app = new Elysia()
let httpDatabase = makeDatabaseService()
let realtime: RealtimeServiceShape | null = null
const HttpLayer = Layer.mergeAll(LoggerLive, Layer.effect(DatabaseService, Effect.sync(() => httpDatabase)))

type HttpOperation = 'register' | 'check' | 'root' | 'health'

type RelayHttpError =
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

const HttpMappedErrorSchema = Schema.Struct({
  status: Schema.Number,
  body: Schema.Union([
    Schema.Struct({ ok: Schema.Literal(false), error: Schema.String }),
    Schema.Literal(false),
  ]),
})
type HttpMappedError = typeof HttpMappedErrorSchema.Type

class TokenSignError extends Schema.TaggedErrorClass<TokenSignError>()('TokenSignError', {
  cause: Schema.Defect,
}) {}

class InvalidTokenError extends Schema.TaggedErrorClass<InvalidTokenError>()('InvalidTokenError', {
  cause: Schema.Defect,
}) {}

function missingJwtSecret(operation: HttpOperation): MissingJwtSecretError & { readonly operation: HttpOperation } {
  return Object.assign(new MissingJwtSecretError({ message: 'LEYLINE_JWT_SECRET is required' }), { operation })
}

const readJwtSecret = Effect.fn('Relay.readJwtSecret')(
  (operation: HttpOperation): Effect.Effect<string, MissingJwtSecretError & { readonly operation: HttpOperation }> => {
    const secret = env.LEYLINE_JWT_SECRET

    return secret ? Effect.succeed(secret) : Effect.fail(missingJwtSecret(operation))
  })

const signToken = Effect.fn('Relay.signToken')((code: string, secret: string) =>
  Effect.try({
    try: () => jwt.sign({ code }, secret),
    catch: (cause) => new TokenSignError({ cause }),
  }))

const verifyTokenCode = Effect.fn('Relay.verifyTokenCode')((token: string, secret: string) =>
  Effect.gen(function*() {
    const decoded = yield* Effect.try({
      try: () => jwt.verify(token, secret),
      catch: (cause) => new InvalidTokenError({ cause }),
    })

    const code = decodeTokenCode(decoded)
    const validated = yield* Match.value(code).pipe(
      Match.when((c): c is TokenMissingCodeError => c instanceof TokenMissingCodeError, (err) => Effect.fail(err)),
      Match.orElse((c: string) => Effect.succeed(c)),
    )

    return validated
  }))

const mapHttpError = (error: RelayHttpError, operation: HttpOperation): HttpMappedError =>
  Match.value(error).pipe(
    Match.tag('MissingPublicKeyError', (): HttpMappedError => ({ status: 400, body: { ok: false, error: 'Missing public key.' } })),
    Match.tag('MissingTokenToCheckError', (): HttpMappedError => ({ status: 400, body: { ok: false, error: 'Missing a token to check.' } })),
    Match.tag('MissingJwtSecretError', (err): HttpMappedError =>
      (err.operation ?? operation) === 'check'
        ? { status: 500, body: false }
        : { status: 500, body: { ok: false, error: 'Missing LEYLINE_JWT_SECRET.' } }
    ),
    Match.tag('DatabaseNotInitializedError', (): HttpMappedError => ({ status: 500, body: { ok: false, error: 'Internal server error.' } })),
    Match.tag('DatabaseOpenError', (): HttpMappedError => ({ status: 500, body: { ok: false, error: 'Internal server error.' } })),
    Match.tag('DatabaseQueryError', (): HttpMappedError => ({ status: 500, body: { ok: false, error: 'Internal server error.' } })),
    Match.tag('TokenSignError', (): HttpMappedError => ({ status: 500, body: { ok: false, error: 'Internal server error.' } })),
    Match.tag('InvalidTokenError', (): HttpMappedError => ({ status: 200, body: false })),
    Match.tag('TokenMissingCodeError', (): HttpMappedError => ({ status: 200, body: false })),
    Match.exhaustive,
  )

function failureFromCause(cause: Cause.Cause<unknown>): unknown {
  const failure = Cause.findErrorOption(cause)

  return Option.isSome(failure) ? failure.value : Cause.squash(cause)
}

async function runHttp<A>(
  program: Effect.Effect<A, RelayHttpError, DatabaseService | LoggerService>,
  operation: HttpOperation,
): Promise<{ status: number; body: unknown }> {
  const exit = await Effect.runPromiseExit(
    Effect.provide(program, HttpLayer).pipe(Effect.timeout('30 seconds'))
  )

  return Exit.match(exit, {
    onSuccess: (value) => ({ status: 200, body: value }),
    onFailure: (cause) => {
      const failure = failureFromCause(cause)

      if (isRelayHttpError(failure)) {
        return mapHttpError(failure, operation)
      }

      return { status: 500, body: { ok: false, error: 'Internal server error.' } }
    },
  })
}

const isRelayHttpError = (error: unknown): error is RelayHttpError => {
  if (typeof error !== 'object' || error === null || !('_tag' in error)) {
    return false
  }

  const tag = (error as { _tag: string })._tag
  return Match.value(tag).pipe(
    Match.when('MissingPublicKeyError', () => true),
    Match.when('MissingTokenToCheckError', () => true),
    Match.when('MissingJwtSecretError', () => true),
    Match.when('DatabaseNotInitializedError', () => true),
    Match.when('DatabaseOpenError', () => true),
    Match.when('DatabaseQueryError', () => true),
    Match.when('TokenSignError', () => true),
    Match.when('InvalidTokenError', () => true),
    Match.when('TokenMissingCodeError', () => true),
    Match.orElse(() => false),
  )
}

const rootProgram = Effect.succeed('Hai, relayo desu.')

const registerProgram = Effect.fn('Relay.register')((body: unknown) =>
  Effect.gen(function*() {
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

    return { ok: true, token } as const
  }))

const checkProgram = Effect.fn('Relay.check')((query: unknown) =>
  Effect.gen(function*() {
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

const healthProtocolProgram = Effect.succeed({
  relayOpcodesLoaded: RelayOpcode.RECEIVE === 8,
})

async function replyFromEffect<A>(
  set: { status?: number | string },
  program: Effect.Effect<A, RelayHttpError, DatabaseService | LoggerService>,
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
      const secret = env.LEYLINE_JWT_SECRET
      const log = yield* LoggerService

      if (!secret) {
        yield* log.error('missing_jwt_secret_for_token_verification')
        return null
      }

      const decoded = yield* Effect.try({
        try: () => jwt.verify(token, secret),
        catch: (cause) => new InvalidTokenError({ cause }),
      }).pipe(
        Effect.catch(() =>
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
  Effect.gen(function*() {
    return yield* RealtimeService
  }),
  RealtimeLayer,
).pipe(
  Effect.provide(RealtimeDependenciesLayer),
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
  useService: (realtime: RealtimeServiceShape) => Effect.Effect<A, E>,
): Effect.Effect<A, E | Error> {
  const currentRealtime = realtime

  if (!currentRealtime) {
    return Effect.fail(new Error('Realtime service not initialized'))
  }

  return useService(currentRealtime)
}

export const initializeApp = Effect.fn('Relay.initializeApp')((databasePath?: string) =>
  Effect.gen(function*() {
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
  }))

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
          Effect.catch((error) =>
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
