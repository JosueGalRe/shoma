import { describe, expect, it } from 'bun:test'

import { parseFrame, socketKey } from '../../src/core/realtime/realtime-utils'
import type { RealtimeSocket } from '../../src/core/realtime/realtime-types'

describe('realtime-utils', () => {
  it('parses a valid array frame directly', () => {
    expect(parseFrame([1, 'hello'])).toEqual([1, 'hello'])
  })

  it('parses a valid JSON string frame', () => {
    expect(parseFrame('[1,"hello"]')).toEqual([1, 'hello'])
  })

  it('parses a valid Uint8Array frame', () => {
    const encoded = new TextEncoder().encode('[1,"hello"]')

    expect(parseFrame(encoded)).toEqual([1, 'hello'])
  })

  it('throws on an invalid string payload', () => {
    expect(() => parseFrame('["oops"]')).toThrow('Invalid websocket frame payload.')
  })

  it('throws on an invalid frame array', () => {
    expect(() => parseFrame(['oops'])).toThrow('Invalid websocket frame format.')
  })

  it('throws on an invalid non-frame format', () => {
    expect(() => parseFrame(123)).toThrow('Invalid websocket frame format.')
  })

  it('throws on null input', () => {
    expect(() => parseFrame(null)).toThrow('Invalid websocket frame format.')
  })

  it('returns raw socket object when present', () => {
    const raw = { id: 'raw-socket' }
    const socket = { raw, send() {}, close() {} } as RealtimeSocket

    expect(socketKey(socket)).toBe(raw)
  })

  it('returns the socket itself when raw is absent', () => {
    const socket = { send() {}, close() {} } as RealtimeSocket

    expect(socketKey(socket)).toBe(socket)
  })
})
