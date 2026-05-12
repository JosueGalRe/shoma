import { Effect } from 'effect'

import { env } from '../config/env-config'
import {
  DatabaseNotInitializedError,
  DatabaseOpenError,
  DatabaseQueryError,
  DatabaseService,
  makeDatabaseService,
  type DatabaseServiceShape,
} from './database-service'
import type { ConduitInstanceRow } from './database-types'

/**
 * Effect-first compatibility helpers for DatabaseService.
 * Prefer using DatabaseService directly with Effect programs.
 */

export type DatabaseError = DatabaseNotInitializedError | DatabaseOpenError | DatabaseQueryError

export const initializeDatabase = Effect.fn('Database.initializeDatabase')(
  (databasePath: string = env.RIFT_DB_PATH): Effect.Effect<DatabaseServiceShape, DatabaseOpenError | DatabaseQueryError> => {
    const service = makeDatabaseService(databasePath)

    return service.initialize.pipe(Effect.as(service))
  })

export const generateCode = Effect.fn('Database.generateCode')(
  (pubkey: string): Effect.Effect<string, DatabaseNotInitializedError | DatabaseQueryError, DatabaseService> =>
    Effect.gen(function*() {
      const database = yield* DatabaseService

      return yield* database.generateCode(pubkey)
    }))

export const lookup = Effect.fn('Database.lookup')(
  (code: string): Effect.Effect<ConduitInstanceRow | null, DatabaseNotInitializedError | DatabaseQueryError, DatabaseService> =>
    Effect.gen(function*() {
      const database = yield* DatabaseService
      const entry = yield* database.lookup(code)

      return entry ? { code: entry.code, public_key: entry.publicKey } : null
    }))

export const potentiallyUpdate = Effect.fn('Database.potentiallyUpdate')(
  (code: string, pubkey: string): Effect.Effect<boolean, DatabaseNotInitializedError | DatabaseQueryError, DatabaseService> =>
    Effect.gen(function*() {
      const database = yield* DatabaseService

      return yield* database.updatePublicKey(code, pubkey)
    }))
