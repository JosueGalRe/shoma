import { Database } from 'bun:sqlite'

import type { ConduitInstanceRow, CountRow } from './database-types'

let database: Database | null = null

export function initializeDatabase(databasePath: string = process.env.RIFT_DB_PATH ?? 'database.db') {
  if (database) {
    database.close(false)
    database = null
  }

  database = new Database(databasePath, { create: true })
  database.run(`
    CREATE TABLE IF NOT EXISTS conduit_instances (
      code TEXT PRIMARY KEY,
      public_key TEXT
    );
  `)
}

function getDatabase(): Database {
  if (!database) {
    throw new Error('Database not loaded yet.')
  }

  return database
}

export function generateCode(pubkey: string): string {
  const db = getDatabase()

  const existing = db
    .query<ConduitInstanceRow, [string]>('SELECT code, public_key FROM conduit_instances WHERE public_key = ? LIMIT 1')
    .get(pubkey)

  if (existing) {
    return existing.code
  }

  let code: string
  while (true) {
    code = (Math.floor(Math.random() * 900000) + 100000).toString()

    const existed = db.query<CountRow, [string]>('SELECT COUNT(*) as count FROM conduit_instances WHERE code = ?').get(code)

    if (!existed || existed.count === 0) {
      break
    }
  }

  db.query('INSERT INTO conduit_instances (code, public_key) VALUES (?, ?)').run(code, pubkey)
  return code
}

export function lookup(code: string): ConduitInstanceRow | null {
  const db = getDatabase()
  const entry = db
    .query<ConduitInstanceRow, [string]>('SELECT code, public_key FROM conduit_instances WHERE code = ? LIMIT 1')
    .get(code)

  return entry ?? null
}

export function potentiallyUpdate(code: string, pubkey: string): boolean {
  const db = getDatabase()

  const existed = db.query<CountRow, [string]>('SELECT COUNT(*) as count FROM conduit_instances WHERE code = ?').get(code)

  if (!existed || existed.count === 0) {
    return false
  }

  db.query('UPDATE conduit_instances SET public_key = ? WHERE code = ?').run(pubkey, code)
  return true
}
