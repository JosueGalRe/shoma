import type { Effect } from 'effect'

import type { DatabaseNotInitializedError, DatabaseQueryError } from '../database/database-service'
import type { TokenPayload } from '../http/index-types'

export interface RealtimeSocket {
  send(data: string): void
  close(code?: number, reason?: string): void
  ping?(): void
  raw?: object
}

export interface ConduitRecord {
  uuid: string
  socket: RealtimeSocket
  conduitSocket: RealtimeSocket
}

export type RealtimeDatabaseError = DatabaseNotInitializedError | DatabaseQueryError

export interface RealtimeDependencies {
  lookup(code: string): Effect.Effect<{ code: string; public_key: string } | null, RealtimeDatabaseError>
  potentiallyUpdate(code: string, pubkey: string): Effect.Effect<boolean, RealtimeDatabaseError>
  verifyToken(token: string): Effect.Effect<TokenPayload | null, never>
  createConnectionId(): string
}

export type RelayFrame = [number, ...unknown[]]
