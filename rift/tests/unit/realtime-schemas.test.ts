import { describe, expect, it } from 'bun:test'
import { Effect, Result } from 'effect'

import {
  decodeRiftFrame,
  FrameFormatError,
  FramePayloadError,
} from '../../src/core/realtime/realtime-schemas'

describe('realtime schemas', () => {
  it('decodes valid rift frames', () => {
    expect(Effect.runSync(decodeRiftFrame([1, 'hello']))).toEqual([1, 'hello'])
    expect(Effect.runSync(decodeRiftFrame([42, { foo: 'bar' }]))).toEqual([42, { foo: 'bar' }])
  })

  it('returns FramePayloadError for invalid frame values', () => {
    for (const value of [['string', 'hello'], null, undefined, 'not an array']) {
      const result = Effect.runSync(Effect.result(decodeRiftFrame(value)))

      expect(result._tag).toBe('Failure')

      if (Result.isFailure(result)) {
        expect(result.failure).toBeInstanceOf(FramePayloadError)
        expect(result.failure._tag).toBe('FramePayloadError')
      }
    }
  })

  it('FramePayloadError stores its cause', () => {
    const cause = new Error('decode failed')
    const error = new FramePayloadError(cause)

    expect(error._tag).toBe('FramePayloadError')
    expect(error.cause).toBe(cause)
  })

  it('FrameFormatError has the correct tag', () => {
    const error = new FrameFormatError()

    expect(error._tag).toBe('FrameFormatError')
  })
})
