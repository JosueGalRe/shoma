import { describe, expect, it } from 'bun:test'
import { Schema } from 'effect'

import { MobileOpcode, RelayErrorFrameSchema, RelayErrorPayloadSchema, RelayOpcode, RelayOpcodeSchema } from '../src/index'

describe('protocol contract opcode stability', () => {
  it('keeps Relay opcodes stable', () => {
    expect(RelayOpcode.OPEN).toBe(1)
    expect(RelayOpcode.RECEIVE).toBe(8)
    expect(RelayOpcode.ERROR).toBe(9)
  })

  it('keeps Mobile opcodes stable', () => {
    expect(MobileOpcode.SECRET).toBe(1)
    expect(MobileOpcode.UPDATE).toBe(9)
  })

  it('exposes the shared relay error contract', () => {
    expect(
      Schema.decodeUnknownSync(RelayErrorPayloadSchema)({
        code: 'invalid_token',
        message: 'token expired',
      }),
    ).toEqual({
      code: 'invalid_token',
      message: 'token expired',
    })

    expect(Schema.decodeUnknownSync(RelayErrorFrameSchema)([RelayOpcode.ERROR, { code: 'unknown' }])).toEqual([
      RelayOpcode.ERROR,
      { code: 'unknown' },
    ])
  })

  it('rejects unknown relay opcodes', () => {
    expect(() => {
      return Schema.decodeUnknownSync(RelayOpcodeSchema)(99)
    }).toThrow()
  })
})
