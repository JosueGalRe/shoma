import { describe, expect, it } from 'bun:test'

import { MobileOpcode, RelayOpcode } from '../src/index'

describe('protocol contract opcode stability', () => {
  it('keeps Relay opcodes stable', () => {
    expect(RelayOpcode.OPEN).toBe(1)
    expect(RelayOpcode.RECEIVE).toBe(8)
  })

  it('keeps Mobile opcodes stable', () => {
    expect(MobileOpcode.SECRET).toBe(1)
    expect(MobileOpcode.UPDATE).toBe(9)
  })
})
