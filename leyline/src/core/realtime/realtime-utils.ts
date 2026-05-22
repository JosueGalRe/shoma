import { Effect } from 'effect'

import type { RealtimeSocket, RelayFrame } from './realtime-types'
import { decodeRelayFrame, FrameFormatError, FramePayloadError } from './realtime-schemas'

const readRelayFrame = Effect.fn('Realtime.readRelayFrame')(
  (value: unknown): Effect.Effect<RelayFrame, FramePayloadError> => decodeRelayFrame(value))

export const parseFrame = Effect.fn('Realtime.parseFrame')(
  (rawMessage: unknown): Effect.Effect<RelayFrame, FrameFormatError | FramePayloadError> => {
    if (typeof rawMessage === 'string') {
      return Effect.try({
        try: () => JSON.parse(rawMessage) as unknown,
        catch: (cause) => new FramePayloadError({ cause }),
      }).pipe(Effect.flatMap(readRelayFrame))
    }

    if (rawMessage instanceof Uint8Array) {
      return Effect.try({
        try: () => JSON.parse(new TextDecoder().decode(rawMessage)) as unknown,
        catch: (cause) => new FramePayloadError({ cause }),
      }).pipe(Effect.flatMap(readRelayFrame))
    }

    return readRelayFrame(rawMessage).pipe(
      Effect.mapError(() => new FrameFormatError({})),
    )
  }
)

export function socketKey(socket: RealtimeSocket): object {
  return socket.raw ?? socket
}
