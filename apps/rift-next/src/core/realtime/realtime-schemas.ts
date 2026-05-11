import { Either, Schema } from 'effect'

import type { RiftFrame } from './realtime-types'

export class FrameFormatError {
  readonly _tag = 'FrameFormatError' as const
}

export class FramePayloadError {
  readonly _tag = 'FramePayloadError' as const

  constructor(readonly cause: unknown) {}
}

export const RiftFrameSchema = Schema.Tuple([Schema.Number], Schema.Unknown)

export function decodeRiftFrame(value: unknown): RiftFrame | FramePayloadError {
  const result = Schema.decodeUnknownEither(RiftFrameSchema)(value)

  return Either.isRight(result) ? ([...result.right] as RiftFrame) : new FramePayloadError(result.left)
}
