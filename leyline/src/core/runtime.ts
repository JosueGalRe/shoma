import { RelayErrorCode, RelayErrorFrameSchema, type RelayErrorPayload, RelayOpcode } from '@shoma/protocol-contract'
import { Cause, Effect, Exit, Layer, Match, Schema } from 'effect'
import jwt from 'jsonwebtoken'

import { InvalidTokenError } from './auth'
import { env } from './config/env-config'
import { DatabaseService, type DatabaseServiceShape, makeDatabaseService } from './database/database-service'
import { readTokenCode } from './http/http-decoders'
import { logger, LoggerLive, LoggerService } from './logger/logger-utils'
import {
  RealtimeLive,
  RealtimeService,
  type RealtimeServiceShape,
  RealtimeStateLive,
} from './realtime/realtime-service'

import type { StartRuntimeOptions } from './http/index-types'
import type { RealtimeDependencies } from './realtime/realtime-types'
import type { Elysia } from 'elysia'

export function runRealtime<A, E>(program: Effect.Effect<A, E>) {
  Effect.runPromiseExit(program).then((exit) => {
    Exit.match(exit, {
      onFailure: (cause) => {
        logger.error('realtime_effect_failed', { cause: Cause.squash(cause) })
      },
      onSuccess: () => {},
    })
  })
}

const encodeErrorFrame = Schema.encodeUnknownSync(Schema.fromJsonString(RelayErrorFrameSchema))

export function sendErrorFrame(ws: { send(data: string): void }, payload: RelayErrorPayload) {
  ws.send(encodeErrorFrame([RelayOpcode.ERROR, payload]))
}

const ignoreAlreadyStopped = (cause: unknown) => {
  if (!(cause instanceof Error && cause.message.includes("Elysia isn't running"))) {
    throw cause
  }
}

export function conduitOpenErrorCode(error: unknown): RelayErrorPayload['code'] {
  if (typeof error !== 'object' || error === null || !('reason' in error)) {
    return RelayErrorCode.SERVER_ERROR
  }

  const { reason } = error

  return Match.value(reason).pipe(
    Match.when(RelayErrorCode.INVALID_TOKEN, () => RelayErrorCode.INVALID_TOKEN),
    Match.when(RelayErrorCode.MISSING_PUBKEY, () => RelayErrorCode.MISSING_PUBKEY),
    Match.when(RelayErrorCode.INVALID_CODE, () => RelayErrorCode.INVALID_CODE),
    Match.orElse(() => RelayErrorCode.SERVER_ERROR),
  )
}

export function conduitOpenCloseCode(error: unknown): number {
  return Match.value(conduitOpenErrorCode(error)).pipe(
    Match.when(RelayErrorCode.INVALID_TOKEN, () => 1008),
    Match.when(RelayErrorCode.MISSING_PUBKEY, () => 1008),
    Match.when(RelayErrorCode.INVALID_CODE, () => 1008),
    Match.orElse(() => 1011),
  )
}

export class RealtimeServiceNotInitialized extends Schema.TaggedErrorClass<RealtimeServiceNotInitialized>()(
  'RealtimeServiceNotInitialized',
  {}
) {}

export function withRealtimeService<A, E>(
  currentRealtime: RealtimeServiceShape | null,
  useService: (realtime: RealtimeServiceShape) => Effect.Effect<A, E>,
): Effect.Effect<A, E | RealtimeServiceNotInitialized> {
  if (!currentRealtime) {
    return Effect.fail(new RealtimeServiceNotInitialized({}))
  }

  return useService(currentRealtime)
}

export function createInitializeApp(
  getDatabase: () => DatabaseServiceShape,
  setDatabase: (db: DatabaseServiceShape) => void,
  getRealtime: () => RealtimeServiceShape | null,
  setRealtime: (rt: RealtimeServiceShape | null) => void,
) {
  return Effect.fn('Relay.initializeApp')((databasePath?: string) =>
    Effect.gen(function*() {
      const previousDatabase = getDatabase()
      const previousRealtime = getRealtime()
      const database = makeDatabaseService(databasePath)

      yield* database.initialize

      const realtimeDeps: RealtimeDependencies = {
        createConnectionId: () => crypto.randomUUID(),
        lookup: (code) =>
          Effect.provideService(
            Effect.gen(function* lookup() {
              const db = yield* DatabaseService
              const entry = yield* db.lookup(code)

              return entry ? { code: entry.code, public_key: entry.publicKey } : null
            }),
            DatabaseService,
            database,
          ),
        potentiallyUpdate: (code, pubkey) =>
          Effect.provideService(
            Effect.gen(function* potentiallyUpdate() {
              const db = yield* DatabaseService

              return yield* db.updatePublicKey(code, pubkey)
            }),
            DatabaseService,
            database,
          ),
        verifyToken: (token: string) =>
          Effect.gen(function* verifyToken() {
            const secret = env.LEYLINE_JWT_SECRET
            const log = yield* LoggerService

            if (!secret) {
              yield* log.error('missing_jwt_secret_for_token_verification')
              return null
            }

            const decoded = yield* Effect.try({
              catch: (cause) => new InvalidTokenError({ cause }),
              try: () => jwt.verify(token, secret),
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

            return { code }
          }).pipe(Effect.provide(LoggerLive)),
      }

      const RealtimeDependenciesLayer = Layer.mergeAll(LoggerLive, RealtimeStateLive)
      const RealtimeLayer = RealtimeLive(realtimeDeps)
      const realtimeServiceProgram = Effect.provide(
        Effect.gen(function* realtimeServiceProgram() {
          return yield* RealtimeService
        }),
        RealtimeLayer,
      ).pipe(
        Effect.provide(RealtimeDependenciesLayer),
      )

      const nextRealtime = yield* realtimeServiceProgram

      if (previousRealtime) {
        yield* previousRealtime.shutdown
      }

      yield* previousDatabase.close

      setDatabase(database)
      setRealtime(nextRealtime)
    }))
}

export async function startRuntime(
  app: Elysia,
  initializeApp: (databasePath?: string) => Effect.Effect<void, unknown, never>,
  getDatabase: () => DatabaseServiceShape,
  getRealtime: () => RealtimeServiceShape | null,
  options: StartRuntimeOptions = {},
) {
  const port = env.PORT
  const runtimePort = options.port ?? port

  await Effect.runPromise(
    initializeApp(options.databasePath).pipe(
      Effect.flatMap(() => withRealtimeService(getRealtime(), (realtime) => realtime.startKeepAlive(options.keepAliveIntervalMs))),
    ),
  )

  const hostname = env.HOSTNAME
  const server = app.listen({ hostname, port: runtimePort })
  let stopped = false

  return {
    hostname,
    port: runtimePort,
    async stop() {
      if (stopped) {
        return
      }

      stopped = true

      const currentRealtime = getRealtime()

      if (currentRealtime) {
        await Effect.runPromise(currentRealtime.shutdown)
      }

      await Effect.runPromise(getDatabase().close)


      if (app.server) {
        try {
          const serverStopped = Promise.resolve(server.stop()).catch(ignoreAlreadyStopped)

          await Promise.race([serverStopped, Bun.sleep(100)])
        } catch (error) {
          ignoreAlreadyStopped(error)
        }
      }

      logger.info('runtime_stopped', { hostname, port: runtimePort })
    },
  }
}
