import { Config as EffectConfig, Context, Data, Effect, Layer } from 'effect'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export class MissingJwtSecretError extends Data.TaggedError('MissingJwtSecretError')<{
  readonly message: string
}> {
  readonly _tag = 'MissingJwtSecretError' as const

  constructor() {
    super({ message: 'RIFT_JWT_SECRET is required' })
  }
}

export class InvalidPortError extends Data.TaggedError('InvalidPortError')<{
  readonly port: number
  readonly message: string
}> {
  readonly _tag = 'InvalidPortError' as const

  constructor(readonly port: number) {
    super({ port, message: `Invalid PORT environment variable: ${port}` })
  }
}

export interface ConfigServiceShape {
  readonly jwtSecret: string
  readonly databasePath: string
  readonly port: number
  readonly hostname: string
  readonly logLevel: LogLevel
  readonly logSilentInTests: boolean
}

export class ConfigService extends Context.Tag('rift/Config')<ConfigService, ConfigServiceShape>() {}

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

const config = EffectConfig.all({
  jwtSecret: EffectConfig.string('RIFT_JWT_SECRET').pipe(EffectConfig.withDefault('')),
  databasePath: EffectConfig.string('RIFT_DB_PATH').pipe(EffectConfig.withDefault('database.db')),
  port: EffectConfig.number('PORT').pipe(EffectConfig.withDefault(51001)),
  hostname: EffectConfig.string('HOSTNAME').pipe(EffectConfig.withDefault('0.0.0.0')),
  logLevel: EffectConfig.string('LOG_LEVEL').pipe(EffectConfig.withDefault('info')),
  logSilentInTests: EffectConfig.string('LOG_SILENT_IN_TESTS').pipe(EffectConfig.withDefault('')),
})

const configEffect = Effect.gen(function* () {
  const cfg = yield* config

  if (cfg.jwtSecret.length === 0) {
    return yield* new MissingJwtSecretError()
  }

  if (cfg.port < 1 || cfg.port > 65535) {
    return yield* new InvalidPortError(cfg.port)
  }

  return {
    ...cfg,
    logLevel: parseLogLevel(cfg.logLevel),
    logSilentInTests: parseBoolean(cfg.logSilentInTests) ?? isTestRuntime(),
  }
})

export const ConfigLayer = Layer.effect(ConfigService, configEffect)

export const ConfigLive = Layer.effectDiscard(configEffect)

export const env = {
  get RIFT_JWT_SECRET(): string | undefined {
    return Bun.env.RIFT_JWT_SECRET
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
  get RIFT_DB_PATH(): string {
    return Bun.env.RIFT_DB_PATH ?? 'database.db'
  },
}
