import { Effect, Schema } from 'effect'

import type { RelayFrame } from './realtime-types'

export class FrameFormatError extends Schema.TaggedErrorClass<FrameFormatError>()(
  'FrameFormatError',
  {}
) {}

export class FramePayloadError extends Schema.TaggedErrorClass<FramePayloadError>()(
  'FramePayloadError',
  { cause: Schema.Unknown }
) {}

export const RelayFrameSchema = Schema.TupleWithRest(Schema.Tuple([Schema.Number]), [Schema.Unknown])

export const decodeRelayFrame = Effect.fn('Realtime.decodeRelayFrame')(
  (value: unknown): Effect.Effect<RelayFrame, FramePayloadError> =>
    Schema.decodeUnknownEffect(RelayFrameSchema)(value).pipe(
      Effect.map((frame): RelayFrame => [...frame]),
      Effect.mapError((cause) => new FramePayloadError({ cause })),
    ))
