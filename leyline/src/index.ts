import { Elysia } from "elysia";
import { websocket } from "elysia/websocket";

import { makeDatabaseService } from "./core/database/database-service";
import { setupHttpRoutes } from "./core/http/http-routes";
import { logger } from "./core/logger/logger-utils";
import { startRuntime as _startRuntime, createInitializeApp } from "./core/runtime";

import type { StartRuntimeOptions } from "./core/http/http-types";
import type { RealtimeServiceShape } from "./core/realtime/realtime-service";

export { extractConduitAuth } from "./core/http/http-decoders";

const app = new Elysia().use(websocket());
let httpDatabase = makeDatabaseService();
let realtime: RealtimeServiceShape | null = null;

export { app };

export const initializeApp = createInitializeApp({
  getDatabase: () => httpDatabase,
  getRealtime: () => realtime,
  setDatabase: (db) => {
    httpDatabase = db;
  },
  setRealtime: (rt) => {
    realtime = rt;
  },
});

export async function startRuntime(options: StartRuntimeOptions = {}) {
  return _startRuntime({
    app,
    getDatabase: () => httpDatabase,
    getRealtime: () => realtime,
    initializeApp,
    options,
  });
}

// Set on request because 404s and parse errors skip onAfterHandle.
app.onRequest(({ set }) => {
  set.headers["Access-Control-Allow-Origin"] = "*";
  set.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
  set.headers["Access-Control-Allow-Headers"] = "content-type, authorization";
});

setupHttpRoutes(
  app,
  () => httpDatabase,
  () => realtime,
);

app.options("*", ({ set }) => {
  set.status = 204;
  return "";
});

if (import.meta.main) {
  void startRuntime()
    .then((runtime) => {
      logger.info("runtime_started", { hostname: runtime.hostname, port: runtime.port });

      const shutdown = () => {
        void runtime.stop();
      };
      process.once("SIGINT", shutdown);
      process.once("SIGTERM", shutdown);
    })
    .catch((error: unknown) => {
      logger.error("runtime_start_failed", { err: error });
      process.exit(1);
    });
}
