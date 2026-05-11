import { describe, expect, it } from 'bun:test'
import { Effect } from 'effect'

import type { RealtimeSocket } from '../../src/core/realtime/realtime-types'
import { parseFrame, socketKey } from '../../src/core/realtime/realtime-utils'

describe('realtime-utils', () => {
  it('parses a valid array frame directly', () => {
    expect(Effect.runSync(parseFrame([1, 'hello']))).toEqual([1, 'hello'])
  })

  it('parses a valid JSON string frame', () => {
    expect(Effect.runSync(parseFrame('[1,"hello"]'))).toEqual([1, 'hello'])
  })

  it('parses a valid Uint8Array frame', () => {
    const encoded = new TextEncoder().encode('[1,"hello"]')

    expect(Effect.runSync(parseFrame(encoded))).toEqual([1, 'hello'])
  })

  it('fails on an invalid string payload', () => {
    const result = Effect.runSync(Effect.either(parseFrame('["oops"]')))

    expect(result._tag).toBe('Left')
  })

  it('fails on an invalid frame array', () => {
    const result = Effect.runSync(Effect.either(parseFrame(['oops'])))

    expect(result._tag).toBe('Left')
  })

  it('fails on an invalid non-frame format', () => {
    const result = Effect.runSync(Effect.either(parseFrame(123)))

    expect(result._tag).toBe('Left')
  })

  it('fails on null input', () => {
    const result = Effect.runSync(Effect.either(parseFrame(null)))

    expect(result._tag).toBe('Left')
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
