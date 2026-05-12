import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { Cause, Effect, Exit, Option } from 'effect'

import {
  ConfigLayer,
  ConfigService,
  InvalidPortError,
  MissingJwtSecretError,
} from '../../src/core/config/env-config'

const envKeys = [
  'BUN_ENV',
  'BUN_TEST',
  'HOSTNAME',
  'LOG_LEVEL',
  'LOG_SILENT_IN_TESTS',
  'NODE_ENV',
  'PORT',
  'RIFT_DB_PATH',
  'RIFT_JWT_SECRET',
] as const

type EnvKey = (typeof envKeys)[number]

const originalEnv = new Map<EnvKey, string | undefined>()

function snapshotEnv() {
  for (const key of envKeys) {
    originalEnv.set(key, Bun.env[key])
  }
}

function restoreEnv() {
  for (const key of envKeys) {
    const value = originalEnv.get(key)

    if (value === undefined) {
      delete Bun.env[key]
    } else {
      Bun.env[key] = value
    }
  }
}

function setEnv(values: Partial<Record<EnvKey, string | undefined>>) {
  for (const key of envKeys) {
    if (key in values) {
      const value = values[key]

      if (value === undefined) {
        delete Bun.env[key]
      } else {
        Bun.env[key] = value
      }
    }
  }
}

const loadConfig = Effect.gen(function* () {
  return yield* ConfigService
})

const runLoadConfig = () => Effect.runPromiseExit(Effect.provide(loadConfig, ConfigLayer))

beforeEach(() => {
  snapshotEnv()
})

afterEach(() => {
  restoreEnv()
})

describe('env-config', () => {
  it('builds ConfigLayer with configured values', async () => {
    setEnv({
      BUN_ENV: undefined,
      BUN_TEST: undefined,
      HOSTNAME: '127.0.0.1',
      LOG_LEVEL: 'warn',
      LOG_SILENT_IN_TESTS: 'false',
      NODE_ENV: 'test',
      PORT: '61234',
      RIFT_DB_PATH: 'custom.db',
      RIFT_JWT_SECRET: 'super-secret',
    })

    const exit = await runLoadConfig()

    expect(exit._tag).toBe('Success')
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toEqual({
        databasePath: 'custom.db',
        hostname: '127.0.0.1',
        jwtSecret: 'super-secret',
        logLevel: 'warn',
        logSilentInTests: false,
        port: 61234,
      })
    }
  })

  it('uses default values when optional env vars are missing', async () => {
    setEnv({
      BUN_ENV: undefined,
      BUN_TEST: undefined,
      HOSTNAME: undefined,
      LOG_LEVEL: undefined,
      LOG_SILENT_IN_TESTS: undefined,
      NODE_ENV: 'test',
      PORT: undefined,
      RIFT_DB_PATH: undefined,
      RIFT_JWT_SECRET: 'super-secret',
    })

    const exit = await runLoadConfig()

    expect(exit._tag).toBe('Success')
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toEqual({
        databasePath: 'database.db',
        hostname: '0.0.0.0',
        jwtSecret: 'super-secret',
        logLevel: 'info',
        logSilentInTests: true,
        port: 51001,
      })
    }
  })

  it('fails with MissingJwtSecretError when the secret is empty', async () => {
    setEnv({
      BUN_ENV: undefined,
      BUN_TEST: undefined,
      HOSTNAME: undefined,
      LOG_LEVEL: undefined,
      LOG_SILENT_IN_TESTS: undefined,
      NODE_ENV: 'test',
      PORT: '51001',
      RIFT_DB_PATH: undefined,
      RIFT_JWT_SECRET: '',
    })

    const exit = await runLoadConfig()

    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit)) {
      const failure = Cause.findErrorOption(exit.cause)
      expect(Option.isSome(failure)).toBe(true)
      if (Option.isSome(failure)) {
        if (!(failure.value instanceof MissingJwtSecretError)) {
          throw new Error('Expected MissingJwtSecretError.')
        }

        expect(failure.value._tag).toBe('MissingJwtSecretError')
        expect(failure.value.message).toBe('RIFT_JWT_SECRET is required')
      }
    }
  })

  it('fails with InvalidPortError when the port is out of range', async () => {
    setEnv({
      BUN_ENV: undefined,
      BUN_TEST: undefined,
      HOSTNAME: undefined,
      LOG_LEVEL: undefined,
      LOG_SILENT_IN_TESTS: undefined,
      NODE_ENV: 'test',
      PORT: '0',
      RIFT_DB_PATH: undefined,
      RIFT_JWT_SECRET: 'super-secret',
    })

    const exit = await runLoadConfig()

    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit)) {
      const failure = Cause.findErrorOption(exit.cause)
      expect(Option.isSome(failure)).toBe(true)
      if (Option.isSome(failure)) {
        if (!(failure.value instanceof InvalidPortError)) {
          throw new Error('Expected InvalidPortError.')
        }

        expect(failure.value._tag).toBe('InvalidPortError')
        expect(failure.value.port).toBe(0)
        expect(failure.value.message).toBe('Invalid PORT environment variable: 0')
      }
    }
  })
})
