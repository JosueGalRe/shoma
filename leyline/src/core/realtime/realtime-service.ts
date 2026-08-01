import {
  RelayErrorCode,
  RelayErrorFrameSchema,
  type RelayErrorPayload,
  RelayOpcode,
} from "@shoma/protocol-contract";
import { Context, Effect, Fiber, Layer, Match, Result, Schedule, Schema } from "effect";

import { LoggerService, type LoggerServiceShape } from "../logger/logger-utils";

import {
  CloseFrameSchema,
  ConnectPubkeyFrameSchema,
  MsgFrameSchema,
  OpenFrameSchema,
  ReceiveFrameSchema,
} from "./realtime-schemas";
import { parseFrame, socketKey } from "./realtime-utils";

import type { FrameFormatError, FramePayloadError } from "./realtime-schemas";
import type {
  ConduitRecord,
  RealtimeDatabaseError,
  RealtimeDependencies,
  RealtimeSocket,
} from "./realtime-types";

export class ConduitOpenError extends Schema.TaggedErrorClass<ConduitOpenError>()(
  "ConduitOpenError",
  { reason: Schema.String },
) {}

/** Reserved for future Effect-based message failures; current handlers log and close instead. */
export class ConduitMessageError extends Schema.TaggedErrorClass<ConduitMessageError>()(
  "ConduitMessageError",
  { reason: Schema.String },
) {}

/** Reserved for future Effect-based message failures; current handlers log and close instead. */
export class MobileMessageError extends Schema.TaggedErrorClass<MobileMessageError>()(
  "MobileMessageError",
  { reason: Schema.String },
) {}

export type RealtimeError =
  | ConduitOpenError
  | ConduitMessageError
  | MobileMessageError
  | FrameFormatError
  | FramePayloadError;

export interface RealtimeState {
  conduitConnections: Map<string, RealtimeSocket>;
  conduitSocketToCode: Map<object, string>;
  conduitToMobileMap: Map<object, ConduitRecord[]>;
  mobileToConduitMap: Map<object, ConduitRecord>;
  mobileSockets: Set<RealtimeSocket>;
  conduitSockets: Set<RealtimeSocket>;
  keepAliveInterval: ReturnType<typeof setInterval> | null;
  keepAliveFiber: Fiber.Fiber<void, never> | null;
}

export type RealtimeStateServiceShape = RealtimeState;

export class RealtimeStateService extends Context.Service<
  RealtimeStateService,
  RealtimeStateServiceShape
>()("@shoma/leyline/RealtimeStateService") {}
export class RealtimeService extends Context.Service<RealtimeService, RealtimeServiceShape>()(
  "@shoma/leyline/RealtimeService",
) {}

export const makeRealtimeStateService = (): RealtimeStateServiceShape => ({
  conduitConnections: new Map<string, RealtimeSocket>(),
  conduitSocketToCode: new Map<object, string>(),
  conduitSockets: new Set<RealtimeSocket>(),
  conduitToMobileMap: new Map<object, ConduitRecord[]>(),
  keepAliveFiber: null,
  keepAliveInterval: null,
  mobileSockets: new Set<RealtimeSocket>(),
  mobileToConduitMap: new Map<object, ConduitRecord>(),
});

export const RealtimeStateLive = Layer.sync(RealtimeStateService, makeRealtimeStateService);

const errorReason = (error: unknown) => (error instanceof Error ? error.message : "unknown");

function frameErrorReason(error: FrameFormatError | FramePayloadError) {
  return Match.value(error).pipe(
    Match.tag("FrameFormatError", () => "Invalid websocket frame format."),
    Match.tag("FramePayloadError", (err) =>
      errorReason(err.cause) === "unknown"
        ? "Invalid websocket frame payload."
        : errorReason(err.cause),
    ),
    Match.exhaustive,
  );
}

const safeClose = Effect.fn("Realtime.safeClose")((socket: RealtimeSocket, code?: number) =>
  Effect.sync(() => {
    socket.close(code);
  }).pipe(Effect.ignore),
);

const encodeErrorFrame = Schema.encodeUnknownSync(Schema.fromJsonString(RelayErrorFrameSchema));
const encodeOpenFrame = Schema.encodeUnknownSync(Schema.fromJsonString(OpenFrameSchema));
const encodeConnectPubkeyFrame = Schema.encodeUnknownSync(
  Schema.fromJsonString(ConnectPubkeyFrameSchema),
);
const encodeMsgFrame = Schema.encodeUnknownSync(Schema.fromJsonString(MsgFrameSchema));
const encodeReceiveFrame = Schema.encodeUnknownSync(Schema.fromJsonString(ReceiveFrameSchema));
const encodeCloseFrame = Schema.encodeUnknownSync(Schema.fromJsonString(CloseFrameSchema));

const sendErrorFrame = Effect.fn("Realtime.sendErrorFrame")(
  (socket: RealtimeSocket, payload: RelayErrorPayload) =>
    Effect.sync(() => {
      socket.send(encodeErrorFrame([RelayOpcode.ERROR, payload]));
    }).pipe(Effect.ignore),
);

const closeCodeForRelayError = (code: RelayErrorPayload["code"]) =>
  Match.value(code).pipe(
    Match.when(RelayErrorCode.INVALID_CODE, () => 1008),
    Match.when(RelayErrorCode.DESKTOP_DENIED, () => 1008),
    Match.when(RelayErrorCode.RELAY_UNREACHABLE, () => 1011),
    Match.when(RelayErrorCode.INVALID_TOKEN, () => 1008),
    Match.when(RelayErrorCode.MISSING_PUBKEY, () => 1008),
    Match.when(RelayErrorCode.SESSION_EXPIRED, () => 1008),
    Match.when(RelayErrorCode.MALFORMED_MESSAGE, () => 1011),
    Match.when(RelayErrorCode.SERVER_ERROR, () => 1011),
    Match.when(RelayErrorCode.UNKNOWN, () => 1011),
    Match.orElse(() => 1011),
  );

const closeWithError = Effect.fn("Realtime.closeWithError")(
  (socket: RealtimeSocket, code: RelayErrorPayload["code"]) =>
    Effect.gen(function* closeWithError() {
      yield* sendErrorFrame(socket, { code });
      yield* safeClose(socket, closeCodeForRelayError(code));
    }),
);

const keepAliveEffect = Effect.fn("Realtime.keepAliveEffect")(
  (state: RealtimeStateServiceShape, intervalMs: number) =>
    Effect.repeat(
      Effect.sync(() => {
        for (const socket of state.mobileSockets) {
          socket.ping?.();
        }

        for (const socket of state.conduitSockets) {
          socket.ping?.();
        }
      }),
      Schedule.fixed(intervalMs),
    ).pipe(Effect.ignore),
);

export interface RealtimeServiceShape {
  readonly handleMobileOpen: (socket: RealtimeSocket) => Effect.Effect<void>;
  readonly handleConduitOpen: (
    socket: RealtimeSocket,
    token: string | undefined,
    publicKey: string | undefined,
  ) => Effect.Effect<void, ConduitOpenError | RealtimeDatabaseError>;
  readonly handleConduitMessage: (
    socket: RealtimeSocket,
    rawMessage: unknown,
  ) => Effect.Effect<void>;
  readonly handleConduitClose: (socket: RealtimeSocket) => Effect.Effect<void>;
  readonly handleMobileMessage: (
    socket: RealtimeSocket,
    rawMessage: unknown,
  ) => Effect.Effect<void, RealtimeDatabaseError>;
  readonly handleMobileClose: (socket: RealtimeSocket) => Effect.Effect<void>;
  readonly startKeepAlive: (intervalMs?: number) => Effect.Effect<void>;
  readonly stopKeepAlive: Effect.Effect<void>;
  readonly shutdown: Effect.Effect<void>;
}

export function makeRealtimeService(
  deps: RealtimeDependencies,
  log: LoggerServiceShape,
  state: RealtimeStateServiceShape,
): RealtimeServiceShape {
  const serviceEffect = Effect.fn("Realtime.serviceEffect")(
    <A, E>(effect: Effect.Effect<A, E, RealtimeStateService>): Effect.Effect<A, E> =>
      Effect.provideService(effect, RealtimeStateService, state),
  );

  const handleConduitClose = (socket: RealtimeSocket) =>
    serviceEffect(
      Effect.gen(function* handleConduitClose() {
        const conduitIdentity = socketKey(socket);
        const code = state.conduitSocketToCode.get(conduitIdentity);
        const peers = state.conduitToMobileMap.get(conduitIdentity) ?? [];

        state.conduitSockets.delete(socket);

        for (const peer of peers) {
          state.mobileToConduitMap.delete(socketKey(peer.socket));
          yield* safeClose(peer.socket);
        }

        state.conduitToMobileMap.delete(conduitIdentity);
        if (code) {
          state.conduitConnections.delete(code);
          state.conduitSocketToCode.delete(conduitIdentity);
        }

        const connLog = code === undefined ? log : log.child({ code });
        yield* connLog.info("conduit_close", {
          conduitCount: state.conduitSockets.size,
          detachedPeers: peers.length,
        });
      }),
    );

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
    handleConduitClose,
    handleConduitMessage: (socket, rawMessage) =>
      serviceEffect(
        Effect.gen(function* handleConduitMessage() {
          const frameResult = yield* Effect.result(parseFrame(rawMessage));

          const code = state.conduitSocketToCode.get(socketKey(socket));
          const connLog = code === undefined ? log : log.child({ code });

          if (Result.isFailure(frameResult)) {
            yield* connLog.warn("conduit_message_error", {
              reason: frameErrorReason(frameResult.failure),
            });
            yield* closeWithError(socket, RelayErrorCode.MALFORMED_MESSAGE);
            return;
          }

          const frame = frameResult.success;

          const [op, ...args] = frame;

          if (op === RelayOpcode.REPLY) {
            const [peerId] = args;
            if (typeof peerId !== "string") {
              yield* connLog.warn("conduit_message_error", {
                reason: "Conduit sent invalid peer id.",
              });
              yield* closeWithError(socket, RelayErrorCode.MALFORMED_MESSAGE);
              return;
            }

            const peers = state.conduitToMobileMap.get(socketKey(socket)) ?? [];
            const peer = peers.find((entry) => entry.uuid === peerId);
            const peerLog = connLog.child({ peerId });
            if (!peer) {
              yield* peerLog.debug("conduit_reply_ignored_unknown_peer");
              return;
            }

            yield* Effect.sync(() => {
              peer.socket.send(encodeReceiveFrame([RelayOpcode.RECEIVE, args[1]]));
            });
            return;
          }

          if (op === RelayOpcode.DISCONNECT_PEER) {
            const [peerId] = args;
            if (typeof peerId !== "string") {
              yield* connLog.warn("conduit_disconnect_peer_invalid", {
                reason: "Missing peer id.",
              });
              return;
            }

            const conduitIdentity = socketKey(socket);
            const peers = state.conduitToMobileMap.get(conduitIdentity) ?? [];
            const index = peers.findIndex((entry) => entry.uuid === peerId);
            const peerLog = connLog.child({ peerId });
            if (index === -1) {
              yield* peerLog.debug("conduit_disconnect_peer_unknown");
              return;
            }

            const peer = peers[index];
            peers.splice(index, 1);
            state.mobileToConduitMap.delete(socketKey(peer.socket));
            yield* safeClose(peer.socket);
            yield* peerLog.info("conduit_disconnect_peer");
            return;
          }

          yield* connLog.warn("conduit_message_error", { reason: "Conduit sent invalid opcode." });
          yield* closeWithError(socket, RelayErrorCode.MALFORMED_MESSAGE);
        }),
      ),
    handleConduitOpen: (socket, token, pubkey) =>
      serviceEffect(
        Effect.gen(function* handleConduitOpen() {
          if (!token) {
            yield* log.warn("conduit_open_rejected_missing_auth", {
              hasPublicKey: Boolean(pubkey),
              hasToken: false,
            });
            return yield* new ConduitOpenError({ reason: RelayErrorCode.INVALID_TOKEN });
          }

          if (!pubkey) {
            yield* log.warn("conduit_open_rejected_missing_auth", {
              hasPublicKey: false,
              hasToken: true,
            });
            return yield* new ConduitOpenError({ reason: RelayErrorCode.MISSING_PUBKEY });
          }

          const decoded = yield* deps.verifyToken(token);
          if (!decoded || typeof decoded.code !== "string") {
            yield* log.warn("conduit_open_rejected_invalid_token");
            return yield* new ConduitOpenError({ reason: RelayErrorCode.INVALID_TOKEN });
          }

          const { code } = decoded;
          const connLog = log.child({ code });
          if (!(yield* deps.potentiallyUpdate(code, pubkey))) {
            yield* connLog.warn("conduit_open_rejected_stale_code");
            return yield* new ConduitOpenError({ reason: RelayErrorCode.INVALID_CODE });
          }

          const existing = state.conduitConnections.get(code);
          if (existing && existing !== socket) {
            yield* handleConduitClose(existing);
            yield* safeClose(existing);
            yield* connLog.info("conduit_connection_evicted");
          }

          const conduitIdentity = socketKey(socket);
          state.conduitSockets.add(socket);
          state.conduitConnections.set(code, socket);
          state.conduitSocketToCode.set(conduitIdentity, code);
          state.conduitToMobileMap.set(conduitIdentity, []);
          yield* connLog.info("conduit_open", { conduitCount: state.conduitSockets.size });
        }),
      ),
    handleMobileClose: (socket) =>
      serviceEffect(
        Effect.gen(function* handleMobileClose() {
          state.mobileSockets.delete(socket);

          const mobileIdentity = socketKey(socket);
          const peer = state.mobileToConduitMap.get(mobileIdentity);
          if (!peer) {
            yield* log.debug("mobile_close_no_peer", { mobileCount: state.mobileSockets.size });
            return;
          }

          state.mobileToConduitMap.delete(mobileIdentity);

          const conduitPeers = state.conduitToMobileMap.get(socketKey(peer.conduitSocket));
          if (conduitPeers) {
            const index = conduitPeers.findIndex((entry) => entry.uuid === peer.uuid);
            if (index !== -1) {
              conduitPeers.splice(index, 1);
            }
          }

          yield* Effect.sync(() => {
            peer.conduitSocket.send(encodeCloseFrame([RelayOpcode.CLOSE, peer.uuid]));
          });
          const peerLog = log.child({ peerId: peer.uuid });
          yield* peerLog.info("mobile_close", {
            mobileCount: state.mobileSockets.size,
          });
        }),
      ),
    handleMobileMessage: (socket, rawMessage) =>
      serviceEffect(
        Effect.gen(function* handleMobileMessage() {
          const frameResult = yield* Effect.result(parseFrame(rawMessage));

          if (Result.isFailure(frameResult)) {
            yield* log.warn("mobile_message_error", {
              reason: frameErrorReason(frameResult.failure),
            });
            yield* closeWithError(socket, RelayErrorCode.MALFORMED_MESSAGE);
            return;
          }

          const frame = frameResult.success;

          const [op, ...args] = frame;
          if (op === RelayOpcode.CONNECT) {
            const mobileIdentity = socketKey(socket);
            if (state.mobileToConduitMap.has(mobileIdentity)) {
              yield* log.warn("mobile_connect_duplicate_session");
              yield* closeWithError(socket, RelayErrorCode.MALFORMED_MESSAGE);
              return;
            }

            const [code] = args;
            if (typeof code !== "string") {
              yield* log.warn("mobile_message_error", { reason: "Mobile sent invalid code." });
              yield* closeWithError(socket, RelayErrorCode.MALFORMED_MESSAGE);
              return;
            }

            const entry = yield* deps.lookup(code);
            const conduit = state.conduitConnections.get(code);
            const connLog = log.child({ code });

            if (!entry) {
              yield* closeWithError(socket, RelayErrorCode.INVALID_CODE);
              yield* connLog.info("mobile_connect_invalid_code");
              return;
            }

            if (!conduit) {
              yield* closeWithError(socket, RelayErrorCode.RELAY_UNREACHABLE);
              yield* connLog.info("mobile_connect_no_conduit");
              return;
            }

            const uuid = deps.createConnectionId();
            const peer: ConduitRecord = { conduitSocket: conduit, socket, uuid };
            const conduitIdentity = socketKey(conduit);
            const conduitPeers = state.conduitToMobileMap.get(conduitIdentity);

            if (conduitPeers) {
              conduitPeers.push(peer);
            } else {
              state.conduitToMobileMap.set(conduitIdentity, [peer]);
            }

            state.mobileToConduitMap.set(mobileIdentity, peer);
            yield* Effect.sync(() => {
              conduit.send(encodeOpenFrame([RelayOpcode.OPEN, uuid]));
              socket.send(encodeConnectPubkeyFrame([RelayOpcode.CONNECT_PUBKEY, entry.public_key]));
            });
            yield* connLog.child({ peerId: uuid }).info("mobile_connect_attached");
            return;
          }

          if (op === RelayOpcode.SEND) {
            const peer = state.mobileToConduitMap.get(socketKey(socket));
            if (!peer) {
              yield* log.warn("mobile_send_without_peer");
              yield* closeWithError(socket, RelayErrorCode.RELAY_UNREACHABLE);
              return;
            }

            yield* Effect.sync(() => {
              peer.conduitSocket.send(encodeMsgFrame([RelayOpcode.MSG, peer.uuid, args[0]]));
            });
            return;
          }

          yield* log.warn("mobile_message_error", { reason: "Mobile sent invalid opcode." });
          yield* closeWithError(socket, RelayErrorCode.MALFORMED_MESSAGE);
        }),
      ),
    handleMobileOpen: (socket) =>
      serviceEffect(
        Effect.gen(function* handleMobileOpen() {
          state.mobileSockets.add(socket);
          yield* log.debug("mobile_open", { mobileCount: state.mobileSockets.size });
        }),
      ),
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
