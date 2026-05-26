import { RelayOpcode } from "@shoma/protocol-contract";
import { Effect, Schema } from "effect";

import type { RelayFrame } from "./realtime-types";

export class FrameFormatError extends Schema.TaggedErrorClass<FrameFormatError>()(
  "FrameFormatError",
  {},
) {}

export class FramePayloadError extends Schema.TaggedErrorClass<FramePayloadError>()(
  "FramePayloadError",
  { cause: Schema.Unknown },
) {}

export const RelayFrameSchema = Schema.TupleWithRest(Schema.Tuple([Schema.Number]), [
  Schema.Unknown,
]);

export const decodeRelayFrame = Effect.fn("Realtime.decodeRelayFrame")(
  (value: unknown): Effect.Effect<RelayFrame, FramePayloadError> =>
    Schema.decodeUnknownEffect(RelayFrameSchema)(value).pipe(
      Effect.map((frame): RelayFrame => [...frame]),
      Effect.mapError((cause) => new FramePayloadError({ cause })),
    ),
);

export const OpenFrameSchema = Schema.Tuple([Schema.Literal(RelayOpcode.OPEN), Schema.String]);
export const ConnectPubkeyFrameSchema = Schema.Tuple([
  Schema.Literal(RelayOpcode.CONNECT_PUBKEY),
  Schema.String,
]);
export const MsgFrameSchema = Schema.Tuple([
  Schema.Literal(RelayOpcode.MSG),
  Schema.String,
  Schema.Unknown,
]);
export const ReceiveFrameSchema = Schema.Tuple([
  Schema.Literal(RelayOpcode.RECEIVE),
  Schema.Unknown,
]);
export const CloseFrameSchema = Schema.Tuple([Schema.Literal(RelayOpcode.CLOSE), Schema.String]);
