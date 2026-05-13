type LogContext = Record<string, unknown>

export function logEvent(event: string, context?: LogContext): void {
  if (context) {
    console.info(`[web] ${event}`, context)
    return
  }

  console.info(`[web] ${event}`)
}

export function logError(event: string, error: unknown, context?: LogContext): void {
  const normalized = error instanceof Error ? { message: error.message, stack: error.stack } : { value: error }

  console.error(`[web] ${event}`, {
    ...context,
    error: normalized,
  })
}
