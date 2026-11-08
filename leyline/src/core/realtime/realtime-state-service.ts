import { Context, Effect, Layer } from "effect";

import type { ConduitRecord, RealtimeSocket } from "./realtime-types";
import type { Fiber } from "effect";

export interface RealtimeState {
  conduitConnections: Map<string, RealtimeSocket>;
  conduitSocketToCode: Map<object, string>;
  conduitToMobileMap: Map<object, ConduitRecord[]>;
  mobileToConduitMap: Map<object, ConduitRecord>;
  mobileSockets: Map<object, RealtimeSocket>;
  conduitSockets: Map<object, RealtimeSocket>;
  keepAliveInterval: ReturnType<typeof setInterval> | null;
  keepAliveFiber: Fiber.Fiber<void, never> | null;
}

export type RealtimeStateServiceShape = RealtimeState;

export class RealtimeStateService extends Context.Service<
  RealtimeStateService,
  RealtimeStateServiceShape
>()("@shoma/leyline/RealtimeStateService") {}

export const makeRealtimeStateService = (): RealtimeStateServiceShape => ({
  conduitConnections: new Map<string, RealtimeSocket>(),
  conduitSocketToCode: new Map<object, string>(),
  conduitSockets: new Map<object, RealtimeSocket>(),
  conduitToMobileMap: new Map<object, ConduitRecord[]>(),
  keepAliveFiber: null,
  keepAliveInterval: null,
  mobileSockets: new Map<object, RealtimeSocket>(),
  mobileToConduitMap: new Map<object, ConduitRecord>(),
});

export const RealtimeStateLive = Layer.sync(RealtimeStateService, makeRealtimeStateService);

export const makeServiceEffect = (state: RealtimeStateServiceShape) =>
  Effect.fn("Realtime.serviceEffect")(
    <A, E>(effect: Effect.Effect<A, E, RealtimeStateService>): Effect.Effect<A, E> =>
      Effect.provideService(effect, RealtimeStateService, state),
  );
