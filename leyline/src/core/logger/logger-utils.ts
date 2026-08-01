import { createPinoLogger } from "@bogeychan/elysia-logger";
import { Context, Effect, Layer } from "effect";

import { env } from "../config/env-config";

type LogLevel = "info" | "warn" | "error" | "debug";

type LogContext = Record<string, unknown>;

export interface LoggerServiceShape {
  readonly info: (event: string, context?: Record<string, unknown>) => Effect.Effect<void>;
  readonly warn: (event: string, context?: Record<string, unknown>) => Effect.Effect<void>;
  readonly error: (event: string, context?: Record<string, unknown>) => Effect.Effect<void>;
  readonly debug: (event: string, context?: Record<string, unknown>) => Effect.Effect<void>;
  readonly child: (bindings: LogContext) => LoggerServiceShape;
}

export class LoggerService extends Context.Service<LoggerService, LoggerServiceShape>()(
  "relay/Log",
) {}

// Narrow structural subset of pino.Logger — keeps makeShape independent of pino's generics
// and lets child() results (plain pino loggers, without elysia's into()) flow through.
interface PinoLike {
  debug(obj: object, msg?: string): void;
  error(obj: object, msg?: string): void;
  info(obj: object, msg?: string): void;
  warn(obj: object, msg?: string): void;
  child(bindings: Record<string, unknown>): PinoLike;
}

// Railway's Log Explorer parses one JSON object per line and filters on TOP-LEVEL attributes
// only (@level:error, @code:ABC123) — the pretty transport stays dev-only, the level is
// emitted as a string, and the event name doubles as `message` (required by Railway).
const isProduction = Bun.env.RAILWAY_ENVIRONMENT !== undefined || Bun.env.NODE_ENV === "production";

const deploymentContext: Record<string, string> = {
  ...(Bun.env.RAILWAY_ENVIRONMENT === undefined ? {} : { env: Bun.env.RAILWAY_ENVIRONMENT }),
  ...(Bun.env.RAILWAY_GIT_COMMIT_SHA === undefined
    ? {}
    : { commit: Bun.env.RAILWAY_GIT_COMMIT_SHA.slice(0, 7) }),
  ...(Bun.env.RAILWAY_REPLICA_ID === undefined ? {} : { replica: Bun.env.RAILWAY_REPLICA_ID }),
};

const pinoLogger = createPinoLogger({
  base: { scope: "relay", service: "leyline", ...deploymentContext },
  enabled: !env.LOG_SILENT_IN_TESTS,
  formatters: {
    level: (label) => ({ level: label }),
  },
  level: env.LOG_LEVEL,
  messageKey: "message",
  redact: ["req.headers.authorization"],
  ...(env.LOG_SILENT_IN_TESTS || isProduction
    ? {}
    : {
        transport: {
          options: {
            colorize: true,
            ignore: "hostname,pid",
            translateTime: "HH:MM:ss.l",
          },
          target: "pino-pretty",
        },
      }),
});

const emit = Effect.fn("Logger.emit")((
  instance: PinoLike,
  level: LogLevel,
  event: string,
  context: LogContext = {},
) => {
  return Effect.sync(() => {
    instance[level]({ event, ...context }, event);
  });
});

function makeShape(instance: PinoLike): LoggerServiceShape {
  return {
    child: (bindings) => makeShape(instance.child(bindings)),
    debug: (event, context) => emit(instance, "debug", event, context),
    error: (event, context) => emit(instance, "error", event, context),
    info: (event, context) => emit(instance, "info", event, context),
    warn: (event, context) => emit(instance, "warn", event, context),
  };
}

export const LoggerLive = Layer.succeed(LoggerService, makeShape(pinoLogger));

/**
 * @deprecated Legacy sync compatibility facade.
 * Prefer `LoggerService` and `LoggerLive` with Effect-based logging.
 */
export const logger = {
  debug(event: string, context?: LogContext) {
    return Effect.runSync(emit(pinoLogger, "debug", event, context));
  },
  error(event: string, context?: LogContext) {
    return Effect.runSync(emit(pinoLogger, "error", event, context));
  },
  info(event: string, context?: LogContext) {
    return Effect.runSync(emit(pinoLogger, "info", event, context));
  },
  warn(event: string, context?: LogContext) {
    return Effect.runSync(emit(pinoLogger, "warn", event, context));
  },
};

export { pinoLogger };
