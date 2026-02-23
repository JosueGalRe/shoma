type LogContext = Record<string, unknown>;

export function logEvent(event: string, context?: LogContext): void {
  if (context) {
    console.info(`[web-next] ${event}`, context);
    return;
  }

  console.info(`[web-next] ${event}`);
}

export function logError(event: string, error: unknown, context?: LogContext): void {
  const normalized = error instanceof Error
    ? { message: error.message, stack: error.stack }
    : { value: error };

  console.error(`[web-next] ${event}`, {
    ...context,
    error: normalized
  });
}
