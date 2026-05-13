import { Context, Effect, Layer, Schema } from 'effect'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface MissingJwtSecretError {
  readonly _tag: 'MissingJwtSecretError'
  readonly message: string
}
export const MissingJwtSecretError = Schema.TaggedErrorClass<MissingJwtSecretError>()('MissingJwtSecretError', {
  message: Schema.String,
})

export interface InvalidPortError {
  readonly _tag: 'InvalidPortError'
  readonly port: number
  readonly message: string
}
export const InvalidPortError = Schema.TaggedErrorClass<InvalidPortError>()('InvalidPortError', {
  port: Schema.Number,
  message: Schema.String,
})

const missingJwtSecretError = () => new MissingJwtSecretError({ message: 'LEYLINE_JWT_SECRET is required' })

const invalidPortError = (port: number) => new InvalidPortError({
  port,
  message: `Invalid PORT environment variable: ${port}`,
})

export interface ConfigServiceShape {
  readonly jwtSecret: string
  readonly databasePath: string
  readonly port: number
  readonly hostname: string
  readonly logLevel: LogLevel
  readonly logSilentInTests: boolean
}

export class ConfigService extends Context.Service<ConfigService, ConfigServiceShape>()('rift/Config') {}

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

const configEffect = Effect.fn('Config.loadConfig')(() =>
  Effect.gen(function* () {
    const rawPort = Bun.env.PORT
    const port = rawPort ? Number(rawPort) : 51001
    const cfg = {
      jwtSecret: Bun.env.LEYLINE_JWT_SECRET ?? '',
      databasePath: Bun.env.LEYLINE_DB_PATH ?? 'database.db',
      port,
      hostname: Bun.env.HOSTNAME ?? '0.0.0.0',
      logLevel: Bun.env.LOG_LEVEL ?? 'info',
      logSilentInTests: Bun.env.LOG_SILENT_IN_TESTS ?? '',
    }

    if (cfg.jwtSecret.length === 0) {
      return yield* missingJwtSecretError()
    }

    if (Number.isNaN(cfg.port) || cfg.port < 1 || cfg.port > 65535) {
      return yield* invalidPortError(cfg.port)
    }

    return {
      ...cfg,
      logLevel: parseLogLevel(cfg.logLevel),
      logSilentInTests: parseBoolean(cfg.logSilentInTests) ?? isTestRuntime(),
    }
  }))

export const ConfigLayer = Layer.effect(ConfigService, configEffect())

export const env = {
  get LEYLINE_JWT_SECRET(): string | undefined {
    return Bun.env.LEYLINE_JWT_SECRET
  },
  get PORT(): number {
    const raw = Bun.env.PORT
    const port = raw ? Number(raw) : 51001

    if (Number.isNaN(port) || port < 1 || port > 65535) {
      throw new Error(`Invalid PORT environment variable: ${raw}`)
    }

    return port
  },
  get HOSTNAME(): string {
    return Bun.env.HOSTNAME ?? '0.0.0.0'
  },
  get LOG_LEVEL(): LogLevel {
    return parseLogLevel(Bun.env.LOG_LEVEL)
  },
  get LOG_SILENT_IN_TESTS(): boolean {
    return parseBoolean(Bun.env.LOG_SILENT_IN_TESTS) ?? isTestRuntime()
  },
  get LEYLINE_DB_PATH(): string {
    return Bun.env.LEYLINE_DB_PATH ?? 'database.db'
  },
}
