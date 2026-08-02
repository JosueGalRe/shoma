import { Context, Effect, Fiber, Layer } from "effect";

import { LoggerService } from "../logger/logger-utils";

import { makeConduitHandlers } from "./conduit-handlers";
import { makeMobileHandlers } from "./mobile-handlers";
import { keepAliveEffect, safeClose } from "./realtime-frame-utils";
import { RealtimeStateService, makeServiceEffect } from "./realtime-state-service";

import type { LoggerServiceShape } from "../logger/logger-utils";
import type {
  RealtimeDependencies,
  RealtimeHandlerContext,
  RealtimeServiceShape,
} from "./realtime-types";
import type { RealtimeStateServiceShape } from "./realtime-state-service";

export class RealtimeService extends Context.Service<RealtimeService, RealtimeServiceShape>()(
  "@shoma/leyline/RealtimeService",
) {}

export function makeRealtimeService(
  deps: RealtimeDependencies,
  log: LoggerServiceShape,
  state: RealtimeStateServiceShape,
): RealtimeServiceShape {
  const serviceEffect = makeServiceEffect(state);
  const context: RealtimeHandlerContext = { deps, log, serviceEffect, state };

  const conduit = makeConduitHandlers(context);
  const mobile = makeMobileHandlers(context);

  const stopKeepAlive = serviceEffect(
    Effect.gen(function* stopKeepAlive() {
      if (!state.keepAliveFiber) {
        return;
      }

      const fiber = state.keepAliveFiber;
      state.keepAliveFiber = null;
      state.keepAliveInterval = null;
      yield* Fiber.interrupt(fiber);
      yield* log.info("keepalive_stopped");
    }),
  );

  const service: RealtimeServiceShape = {
    ...conduit,
    ...mobile,
    shutdown: serviceEffect(
      Effect.gen(function* shutdown() {
        yield* stopKeepAlive;

        for (const socket of state.mobileSockets) {
          yield* safeClose(socket);
        }

        for (const socket of state.conduitSockets) {
          yield* safeClose(socket);
        }

        state.mobileSockets.clear();
        state.conduitSockets.clear();
        state.mobileToConduitMap.clear();
        state.conduitToMobileMap.clear();
        state.conduitSocketToCode.clear();
        state.conduitConnections.clear();
        yield* log.info("realtime_shutdown_complete");
      }),
    ),
    startKeepAlive: (intervalMs = 10_000) =>
      serviceEffect(
        Effect.gen(function* startKeepAlive() {
          yield* stopKeepAlive;
          state.keepAliveFiber = yield* Effect.forkDetach(keepAliveEffect(state, intervalMs));
          yield* log.info("keepalive_started", { intervalMs });
        }),
      ),
    stopKeepAlive,
  };

  return {
    ...service,
    handleConduitClose: Effect.fn("Realtime.handleConduitClose")(service.handleConduitClose),
    handleConduitMessage: Effect.fn("Realtime.handleConduitMessage")(service.handleConduitMessage),
    handleConduitOpen: Effect.fn("Realtime.handleConduitOpen")(service.handleConduitOpen),
    handleMobileClose: Effect.fn("Realtime.handleMobileClose")(service.handleMobileClose),
    handleMobileMessage: Effect.fn("Realtime.handleMobileMessage")(service.handleMobileMessage),
    handleMobileOpen: Effect.fn("Realtime.handleMobileOpen")(service.handleMobileOpen),
    startKeepAlive: Effect.fn("Realtime.startKeepAlive")(service.startKeepAlive),
  };
}

export const RealtimeLive = (deps: RealtimeDependencies) =>
  Layer.effect(
    RealtimeService,
    Effect.gen(function* RealtimeLive() {
      const log = yield* LoggerService;
      const state = yield* RealtimeStateService;

      return makeRealtimeService(deps, log, state);
    }),
  );

export {
  RealtimeStateLive,
  RealtimeStateService,
  makeRealtimeStateService,
} from "./realtime-state-service";
export type { RealtimeServiceShape } from "./realtime-types";
