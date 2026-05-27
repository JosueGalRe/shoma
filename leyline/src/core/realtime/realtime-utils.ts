import { Effect, Schema } from "effect";

import { decodeRelayFrame, FrameFormatError, FramePayloadError } from "./realtime-schemas";

import type { RealtimeSocket, RelayFrame } from "./realtime-types";

const readRelayFrame = Effect.fn("Realtime.readRelayFrame")(
  (value: unknown): Effect.Effect<RelayFrame, FramePayloadError> => decodeRelayFrame(value),
);

const parseJsonString = Schema.decodeUnknownEffect(Schema.UnknownFromJsonString);

export const parseFrame = Effect.fn("Realtime.parseFrame")((
  rawMessage: unknown,
): Effect.Effect<RelayFrame, FrameFormatError | FramePayloadError> => {
  if (typeof rawMessage === "string") {
    return parseJsonString(rawMessage).pipe(
      Effect.mapError((cause) => new FramePayloadError({ cause })),
      Effect.flatMap(readRelayFrame),
    );
  }

  if (rawMessage instanceof Uint8Array) {
    return parseJsonString(new TextDecoder().decode(rawMessage)).pipe(
      Effect.mapError((cause) => new FramePayloadError({ cause })),
      Effect.flatMap(readRelayFrame),
    );
  }

  return readRelayFrame(rawMessage).pipe(Effect.mapError(() => new FrameFormatError({})));
});

export function socketKey(socket: RealtimeSocket): object {
  return socket.raw ?? socket;
}
