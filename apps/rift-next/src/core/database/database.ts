import { Effect } from 'effect'

import { env } from '../config/env-config'
import { makeDatabaseService, type DatabaseService } from './database-service'
import type { ConduitInstanceRow } from './database-types'

/**
 * Legacy synchronous bridge to DatabaseService.
 * Prefer using DatabaseService directly with Effect programs.
 * This bridge converts typed Effect errors into thrown exceptions for imperative callers.
 */

let databaseService: DatabaseService | null = null

export function initializeDatabase(databasePath: string = env.RIFT_DB_PATH) {
  const service = makeDatabaseService(databasePath)
  Effect.runSync(service.initialize)
  databaseService = service
}

function getDatabaseService(): DatabaseService {
  if (!databaseService) {
    throw new Error('Database not loaded yet.')
  }

  return databaseService
}

export function generateCode(pubkey: string): string {
  return Effect.runSync(getDatabaseService().generateCode(pubkey))
}

export function lookup(code: string): ConduitInstanceRow | null {
  const entry = Effect.runSync(getDatabaseService().lookup(code))

  return entry ? { code: entry.code, public_key: entry.publicKey } : null
}

export function potentiallyUpdate(code: string, pubkey: string): boolean {
  return Effect.runSync(getDatabaseService().updatePublicKey(code, pubkey))
}
