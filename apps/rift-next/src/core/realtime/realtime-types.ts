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

export interface RealtimeDependencies {
  lookup(code: string): { code: string; public_key: string } | null
  potentiallyUpdate(code: string, pubkey: string): boolean
  verifyToken(token: string): { code?: string } | null
  createConnectionId(): string
}

export type RiftFrame = [number, ...unknown[]]
