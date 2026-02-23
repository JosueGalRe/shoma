import pino from "pino";

type LogLevel = "info" | "warn" | "error" | "debug";

type LogContext = Record<string, unknown>;

const LOG_LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

function parseLogLevel(raw: string | undefined): LogLevel {
  if (!raw) {
    return "info";
  }

  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }

  return "info";
}

function isTestRuntime(): boolean {
  const nodeEnv = Bun.env.NODE_ENV;
  const bunEnv = Bun.env.BUN_ENV;
  const bunTest = Bun.env.BUN_TEST;

  if (nodeEnv === "test") {
    return true;
  }

  if (bunEnv === "test") {
    return true;
  }

  if (bunTest === "1") {
    return true;
  }

  return false;
}

function shouldSilenceLogs(): boolean {
  const configured = Bun.env.LOG_SILENT_IN_TESTS;
  if (configured === "true") {
    return true;
  }

  if (configured === "false") {
    return false;
  }

  return isTestRuntime();
}

function shouldLog(level: LogLevel): boolean {
  if (shouldSilenceLogs()) {
    return false;
  }

  const currentLevel = parseLogLevel(Bun.env.LOG_LEVEL);
  const currentWeight = LOG_LEVEL_WEIGHT[currentLevel];
  const levelWeight = LOG_LEVEL_WEIGHT[level];

  return levelWeight >= currentWeight;
}

const pinoLogger = pino({
  enabled: !shouldSilenceLogs(),
  level: parseLogLevel(Bun.env.LOG_LEVEL),
  base: { scope: "rift-next" },
  timestamp: pino.stdTimeFunctions.isoTime
});

function emit(level: LogLevel, event: string, context: LogContext = {}) {
  if (!shouldLog(level)) {
    return;
  }

  pinoLogger[level]({ event, ...context });
}

export const logger = {
  info(event: string, context?: LogContext) {
    emit("info", event, context);
  },
  warn(event: string, context?: LogContext) {
    emit("warn", event, context);
  },
  error(event: string, context?: LogContext) {
    emit("error", event, context);
  },
  debug(event: string, context?: LogContext) {
    emit("debug", event, context);
  }
};
