import type { RealtimeSocket, RiftFrame } from './realtime-types'
import { decodeRiftFrame, FramePayloadError } from './realtime-schemas'

function readRiftFrame(value: unknown): RiftFrame | null {
  const result = decodeRiftFrame(value)

  return result instanceof FramePayloadError ? null : result
}

export function parseFrame(rawMessage: unknown): RiftFrame {
  const frame = readRiftFrame(rawMessage)
  if (frame) {
    return frame
  }

  if (typeof rawMessage === 'string') {
    const parsed: unknown = JSON.parse(rawMessage)
    const parsedFrame = readRiftFrame(parsed)
    if (parsedFrame) {
      return parsedFrame
    }

    throw new Error('Invalid websocket frame payload.')
  }

  if (rawMessage instanceof Uint8Array) {
    const decoded = new TextDecoder().decode(rawMessage)
    const parsed: unknown = JSON.parse(decoded)
    const parsedFrame = readRiftFrame(parsed)
    if (parsedFrame) {
      return parsedFrame
    }

    throw new Error('Invalid websocket frame payload.')
  }

  throw new Error('Invalid websocket frame format.')
}

export function socketKey(socket: RealtimeSocket): object {
  return socket.raw ?? socket
}
