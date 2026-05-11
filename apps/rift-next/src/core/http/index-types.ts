export type ConduitOpenData = {
  query?: Record<string, string | undefined>
  headers?: Record<string, string | undefined>
  request?: Request
}

export type StartRuntimeOptions = {
  port?: number
  databasePath?: string
  keepAliveIntervalMs?: number
}

export type TokenPayload = {
  code?: string
}
