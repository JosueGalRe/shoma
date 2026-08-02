import {
  RelayErrorCode,
  RelayErrorFrameSchema,
  type RelayErrorPayload,
  RelayOpcode,
} from "@shoma/protocol-contract";
import { Effect, Match, Schedule, Schema } from "effect";

import {
  CloseFrameSchema,
  ConnectPubkeyFrameSchema,
  MsgFrameSchema,
  OpenFrameSchema,
  ReceiveFrameSchema,
} from "./realtime-schemas";

import type { FrameFormatError, FramePayloadError } from "./realtime-schemas";
import type { RealtimeStateServiceShape } from "./realtime-state-service";
import type { RealtimeSocket } from "./realtime-types";

const errorReason = (error: unknown) => (error instanceof Error ? error.message : "unknown");

export function frameErrorReason(error: FrameFormatError | FramePayloadError) {
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

export const safeClose = Effect.fn("Realtime.safeClose")((socket: RealtimeSocket, code?: number) =>
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

export {
  encodeCloseFrame,
  encodeConnectPubkeyFrame,
  encodeMsgFrame,
  encodeOpenFrame,
  encodeReceiveFrame,
};

export const sendErrorFrame = Effect.fn("Realtime.sendErrorFrame")(
  (socket: RealtimeSocket, payload: RelayErrorPayload) =>
    Effect.sync(() => {
      socket.send(encodeErrorFrame([RelayOpcode.ERROR, payload]));
    }).pipe(Effect.ignore),
);

export const closeCodeForRelayError = (code: RelayErrorPayload["code"]) =>
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

export const closeWithError = Effect.fn("Realtime.closeWithError")(
  (socket: RealtimeSocket, code: RelayErrorPayload["code"]) =>
    Effect.gen(function* closeWithError() {
      yield* sendErrorFrame(socket, { code });
      yield* safeClose(socket, closeCodeForRelayError(code));
    }),
);

export const keepAliveEffect = Effect.fn("Realtime.keepAliveEffect")(
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
