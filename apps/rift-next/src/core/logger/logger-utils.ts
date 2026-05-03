import { createPinoLogger } from '@bogeychan/elysia-logger'

import { env } from '../config/env-config'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

type LogContext = Record<string, unknown>

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
  base: { scope: 'rift-next' },
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

function emit(level: LogLevel, event: string, context: LogContext = {}) {
  if (!shouldLog(level)) {
    return
  }

  pinoLogger[level]({ event, ...context })
}

export const logger = {
  info(event: string, context?: LogContext) {
    emit('info', event, context)
  },
  warn(event: string, context?: LogContext) {
    emit('warn', event, context)
  },
  error(event: string, context?: LogContext) {
    emit('error', event, context)
  },
  debug(event: string, context?: LogContext) {
    emit('debug', event, context)
  },
}

export { pinoLogger }
