import { Schema } from "effect";

import type { FrameFormatError, FramePayloadError } from "./realtime-schemas";

export class ConduitOpenError extends Schema.TaggedError<ConduitOpenError>()("ConduitOpenError", {
  reason: Schema.String,
}) {}

/** Reserved for future Effect-based message failures; current handlers log and close instead. */
export class ConduitMessageError extends Schema.TaggedError<ConduitMessageError>()(
  "ConduitMessageError",
  { reason: Schema.String },
) {}

/** Reserved for future Effect-based message failures; current handlers log and close instead. */
export class MobileMessageError extends Schema.TaggedError<MobileMessageError>()(
  "MobileMessageError",
  { reason: Schema.String },
) {}

export type RealtimeError =
  | ConduitOpenError
  | ConduitMessageError
  | MobileMessageError
  | FrameFormatError
  | FramePayloadError;
