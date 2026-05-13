import { createPinoLogger } from '@bogeychan/elysia-logger'
import { Context, Effect, Layer } from 'effect'

import { env } from '../config/env-config'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

type LogContext = Record<string, unknown>

export interface LoggerServiceShape {
  readonly info: (event: string, context?: Record<string, unknown>) => Effect.Effect<void>
  readonly warn: (event: string, context?: Record<string, unknown>) => Effect.Effect<void>
  readonly error: (event: string, context?: Record<string, unknown>) => Effect.Effect<void>
  readonly debug: (event: string, context?: Record<string, unknown>) => Effect.Effect<void>
}

export class LoggerService extends Context.Service<LoggerService, LoggerServiceShape>()('relay/Log') {}

const LOG_LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

function shouldLog(level: LogLevel): boolean {
  if (env.LOG_SILENT_IN_TESTS) {
    return false
  }

  const currentWeight = LOG_LEVEL_WEIGHT[env.LOG_LEVEL]
  const levelWeight = LOG_LEVEL_WEIGHT[level]

  return levelWeight >= currentWeight
}

const pinoLogger = createPinoLogger({
  level: env.LOG_LEVEL,
  base: { scope: 'relay' },
  ...(env.LOG_SILENT_IN_TESTS
    ? { enabled: false }
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'hostname,pid',
            translateTime: 'HH:MM:ss.l',
          },
        },
      }),
})

const emit = Effect.fn('Logger.emit')(
  (level: LogLevel, event: string, context: LogContext = {}) => {
    if (!shouldLog(level)) {
      return Effect.sync(() => undefined)
    }

    return Effect.sync(() => {
      pinoLogger[level]({ event, ...context })
    })
  })

export const LoggerLive = Layer.succeed(LoggerService, {
  info: (event, context) => emit('info', event, context),
  warn: (event, context) => emit('warn', event, context),
  error: (event, context) => emit('error', event, context),
  debug: (event, context) => emit('debug', event, context),
})

/**
 * @deprecated Legacy sync compatibility facade.
 * Prefer `LoggerService` and `LoggerLive` with Effect-based logging.
 */
export const logger = {
  info(event: string, context?: LogContext) {
    return Effect.runSync(emit('info', event, context))
  },
  warn(event: string, context?: LogContext) {
    return Effect.runSync(emit('warn', event, context))
  },
  error(event: string, context?: LogContext) {
    return Effect.runSync(emit('error', event, context))
  },
  debug(event: string, context?: LogContext) {
    return Effect.runSync(emit('debug', event, context))
  },
}

export { pinoLogger }
