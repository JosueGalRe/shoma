import { Database } from 'bun:sqlite'
import { Context, Effect, Layer, Schema } from 'effect'

import { env } from '../config/env-config'
import type { ConduitInstanceRow, CountRow } from './database-types'

export interface ConduitInstance {
  readonly code: string
  readonly publicKey: string
}

export class DatabaseNotInitializedError extends Error {
  readonly _tag = 'DatabaseNotInitializedError' as const

  constructor() {
    super('Database not initialized')
  }
}

export class DatabaseOpenError extends Schema.TaggedErrorClass<DatabaseOpenError>()('DatabaseOpenError', {
  cause: Schema.Defect,
}) {}

export class DatabaseQueryError extends Schema.TaggedErrorClass<DatabaseQueryError>()('DatabaseQueryError', {
  operation: Schema.String,
  cause: Schema.Defect,
}) {}

export interface DatabaseServiceShape {
  readonly initialize: Effect.Effect<void, DatabaseOpenError | DatabaseQueryError>
  readonly close: Effect.Effect<void>
  readonly generateCode: (pubkey: string) => Effect.Effect<string, DatabaseNotInitializedError | DatabaseQueryError>
  readonly lookup: (code: string) => Effect.Effect<ConduitInstance | null, DatabaseNotInitializedError | DatabaseQueryError>
  readonly updatePublicKey: (code: string, pubkey: string) => Effect.Effect<boolean, DatabaseNotInitializedError | DatabaseQueryError>
}

export class DatabaseService extends Context.Service<DatabaseService, DatabaseServiceShape>()('@mimic/rift/DatabaseService') {}

interface DatabaseState {
  database: Database | null
}

const createTableSql = `
    CREATE TABLE IF NOT EXISTS conduit_instances (
      code TEXT PRIMARY KEY,
      public_key TEXT
    );
  `

const closeCurrentDatabase = (state: DatabaseState) =>
  Effect.sync(() => {
    if (state.database) {
      state.database.close(false)
      state.database = null
    }
  })

const ensureDatabase = (state: DatabaseState) =>
  state.database ? Effect.succeed(state.database) : Effect.fail(new DatabaseNotInitializedError())

export const makeDatabaseService = (databasePath: string = env.RIFT_DB_PATH): DatabaseServiceShape => {
  const state: DatabaseState = { database: null }

  const initialize = Effect.gen(function*() {
    yield* closeCurrentDatabase(state)

    const database = yield* Effect.try({
      try: () => new Database(databasePath, { create: true }),
      catch: (cause) => new DatabaseOpenError({ cause }),
    })

    yield* Effect.try({
      try: () => database.run(createTableSql),
      catch: (cause) => new DatabaseQueryError({ operation: 'initialize', cause }),
    }).pipe(
      Effect.catch((error) =>
        Effect.gen(function*() {
          yield* Effect.sync(() => database.close(false))
          return yield* Effect.fail(error)
        })
      ),
    )

    state.database = database
  })

  return {
    initialize,
    close: closeCurrentDatabase(state),
    generateCode: (pubkey) =>
      Effect.gen(function*() {
        const database = yield* ensureDatabase(state)

        const existing = yield* Effect.try({
          try: () =>
            database
              .query<ConduitInstanceRow, [string]>('SELECT code, public_key FROM conduit_instances WHERE public_key = ? LIMIT 1')
              .get(pubkey),
            catch: (cause) => new DatabaseQueryError({ operation: 'generateCode.findExisting', cause }),
        })

        if (existing) {
          return existing.code
        }

        let code: string
        while (true) {
          code = (Math.floor(Math.random() * 900000) + 100000).toString()

          const existed = yield* Effect.try({
            try: () =>
              database.query<CountRow, [string]>('SELECT COUNT(*) as count FROM conduit_instances WHERE code = ?').get(code),
            catch: (cause) => new DatabaseQueryError({ operation: 'generateCode.checkCode', cause }),
          })

          if (!existed || existed.count === 0) {
            break
          }
        }

        yield* Effect.try({
          try: () => database.query('INSERT INTO conduit_instances (code, public_key) VALUES (?, ?)').run(code, pubkey),
          catch: (cause) => new DatabaseQueryError({ operation: 'generateCode.insert', cause }),
        })

        return code
      }),
    lookup: (code) =>
      Effect.gen(function*() {
        const database = yield* ensureDatabase(state)

        const entry = yield* Effect.try({
          try: () =>
            database
              .query<ConduitInstanceRow, [string]>('SELECT code, public_key FROM conduit_instances WHERE code = ? LIMIT 1')
              .get(code),
          catch: (cause) => new DatabaseQueryError({ operation: 'lookup', cause }),
        })

        return entry ? { code: entry.code, publicKey: entry.public_key } : null
      }),
    updatePublicKey: (code, pubkey) =>
      Effect.gen(function*() {
        const database = yield* ensureDatabase(state)

        const existed = yield* Effect.try({
          try: () => database.query<CountRow, [string]>('SELECT COUNT(*) as count FROM conduit_instances WHERE code = ?').get(code),
          catch: (cause) => new DatabaseQueryError({ operation: 'updatePublicKey.checkCode', cause }),
        })

        if (!existed || existed.count === 0) {
          return false
        }

        yield* Effect.try({
          try: () => database.query('UPDATE conduit_instances SET public_key = ? WHERE code = ?').run(pubkey, code),
          catch: (cause) => new DatabaseQueryError({ operation: 'updatePublicKey.update', cause }),
        })

        return true
      }),
  }
}

export const DatabaseLive = Layer.effect(
  DatabaseService,
  Effect.acquireRelease(
    Effect.gen(function*() {
      const service = makeDatabaseService()
      yield* service.initialize
      return service
    }),
    (service) => service.close,
  ),
)
