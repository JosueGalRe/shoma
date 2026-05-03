export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

function parseLogLevel(raw: string | undefined): LogLevel {
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') {
    return raw
  }
  return 'info'
}

function parseBoolean(raw: string | undefined): boolean | undefined {
  if (raw === 'true') return true
  if (raw === 'false') return false
  return undefined
}

function isTestRuntime(): boolean {
  const nodeEnv = Bun.env.NODE_ENV
  const bunEnv = Bun.env.BUN_ENV
  const bunTest = Bun.env.BUN_TEST

  if (nodeEnv === 'test') return true
  if (bunEnv === 'test') return true
  if (bunTest === '1') return true
  return false
}

function parsePort(raw: string | undefined): number {
  const port = raw ? Number(raw) : 51001
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT environment variable: ${raw}`)
  }
  return port
}

export const env = {
  get RIFT_JWT_SECRET(): string | undefined {
    return Bun.env.RIFT_JWT_SECRET
  },
  get PORT(): number {
    return parsePort(Bun.env.PORT)
  },
  get LOG_LEVEL(): LogLevel {
    return parseLogLevel(Bun.env.LOG_LEVEL)
  },
  get LOG_SILENT_IN_TESTS(): boolean {
    return parseBoolean(Bun.env.LOG_SILENT_IN_TESTS) ?? isTestRuntime()
  },
  get RIFT_DB_PATH(): string {
    return Bun.env.RIFT_DB_PATH ?? 'database.db'
  },
}
