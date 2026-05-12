import { Effect, Schema } from 'effect'

import type { RiftFrame } from './realtime-types'

export class FrameFormatError extends Schema.TaggedErrorClass<FrameFormatError>()(
  'FrameFormatError',
  {}
) {}

export class FramePayloadError extends Schema.TaggedErrorClass<FramePayloadError>()(
  'FramePayloadError',
  { cause: Schema.Unknown }
) {}

export const RiftFrameSchema = Schema.TupleWithRest(Schema.Tuple([Schema.Number]), [Schema.Unknown])

export const decodeRiftFrame = Effect.fn('Realtime.decodeRiftFrame')(
  (value: unknown): Effect.Effect<RiftFrame, FramePayloadError> =>
    Schema.decodeUnknownEffect(RiftFrameSchema)(value).pipe(
      Effect.map((frame): RiftFrame => [...frame]),
      Effect.mapError((cause) => new FramePayloadError({ cause })),
    ))
