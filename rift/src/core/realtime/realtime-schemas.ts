import { Effect, Schema } from 'effect'

import type { RiftFrame } from './realtime-types'

export class FrameFormatError extends Schema.TaggedErrorClass<FrameFormatError>()(
  'FrameFormatError',
  {}
) {
  constructor() {
    super({})
  }
}

export class FramePayloadError extends Schema.TaggedErrorClass<FramePayloadError>()(
  'FramePayloadError',
  { cause: Schema.Unknown }
) {
  constructor(cause: unknown) {
    super({ cause })
  }
}

export const RiftFrameSchema = Schema.TupleWithRest(Schema.Tuple([Schema.Number]), [Schema.Unknown])

export function decodeRiftFrame(value: unknown): Effect.Effect<RiftFrame, FramePayloadError> {
  return Schema.decodeUnknownEffect(RiftFrameSchema)(value).pipe(
    Effect.map((frame): RiftFrame => [...frame]),
    Effect.mapError((cause) => new FramePayloadError(cause)),
  )
}
