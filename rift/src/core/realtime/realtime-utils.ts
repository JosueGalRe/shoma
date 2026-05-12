import { Effect } from 'effect'

import type { RealtimeSocket, RiftFrame } from './realtime-types'
import { decodeRiftFrame, FrameFormatError, FramePayloadError } from './realtime-schemas'

function readRiftFrame(value: unknown): Effect.Effect<RiftFrame, FramePayloadError> {
  return decodeRiftFrame(value)
}

export function parseFrame(rawMessage: unknown): Effect.Effect<RiftFrame, FrameFormatError | FramePayloadError> {
  if (typeof rawMessage === 'string') {
    return Effect.try({
      try: () => JSON.parse(rawMessage) as unknown,
      catch: (cause) => new FramePayloadError(cause),
    }).pipe(Effect.flatMap(readRiftFrame))
  }

  if (rawMessage instanceof Uint8Array) {
    return Effect.try({
      try: () => JSON.parse(new TextDecoder().decode(rawMessage)) as unknown,
      catch: (cause) => new FramePayloadError(cause),
    }).pipe(Effect.flatMap(readRiftFrame))
  }

  return readRiftFrame(rawMessage).pipe(
    Effect.mapError(() => new FrameFormatError()),
  )
}

export function socketKey(socket: RealtimeSocket): object {
  return socket.raw ?? socket
}
