import { describe, expect, it } from 'bun:test'
import { Effect } from 'effect'

import { parseFrame, socketKey } from '../../src/core/realtime/realtime-utils'

import type { RealtimeSocket } from '../../src/core/realtime/realtime-types'

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
    const result = Effect.runSync(Effect.result(parseFrame('["oops"]')))

    expect(result._tag).toBe('Failure')
  })

  it('fails on an invalid frame array', () => {
    const result = Effect.runSync(Effect.result(parseFrame(['oops'])))

    expect(result._tag).toBe('Failure')
  })

  it('fails on an invalid non-frame format', () => {
    const result = Effect.runSync(Effect.result(parseFrame(123)))

    expect(result._tag).toBe('Failure')
  })

  it('fails on null input', () => {
    const result = Effect.runSync(Effect.result(parseFrame(null)))

    expect(result._tag).toBe('Failure')
  })

  it('returns raw socket object when present', () => {
    const raw = { id: 'raw-socket' }
    const socket = { close() {}, raw, send() {} } as RealtimeSocket

    expect(socketKey(socket)).toBe(raw)
  })

  it('returns the socket itself when raw is absent', () => {
    const socket = { close() {}, send() {} } as RealtimeSocket

    expect(socketKey(socket)).toBe(socket)
  })
})
