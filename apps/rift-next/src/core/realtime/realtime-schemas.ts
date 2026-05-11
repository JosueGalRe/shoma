import { Effect, Schema } from 'effect'

import type { RiftFrame } from './realtime-types'

export class FrameFormatError {
  readonly _tag = 'FrameFormatError' as const
}

export class FramePayloadError {
  readonly _tag = 'FramePayloadError' as const

  constructor(readonly cause: unknown) {}
}

export const RiftFrameSchema = Schema.Tuple([Schema.Number], Schema.Unknown)

export function decodeRiftFrame(value: unknown): Effect.Effect<RiftFrame, FramePayloadError> {
  return Schema.decodeUnknown(RiftFrameSchema)(value).pipe(
    Effect.map((frame): RiftFrame => [...frame]),
    Effect.mapError((cause) => new FramePayloadError(cause)),
  )
}
