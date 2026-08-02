import { Schema } from "effect";

import type { FrameFormatError, FramePayloadError } from "./realtime-schemas";

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
