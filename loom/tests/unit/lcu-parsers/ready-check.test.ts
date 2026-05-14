
import { describe, expect, test } from 'bun:test'

import { parseReadyCheck } from '../../../src/core/lcu/parsers/ready-check'

describe('lcu ready-check parser', () => {
  test('parses ready check snapshots with optional fields', () => {
    expect(parseReadyCheck({ playerResponse: 'None', state: 'InProgress', timer: 8 })).toEqual({
      playerResponse: 'None',
      state: 'InProgress',
      timer: 8,
    })
    expect(parseReadyCheck({ timer: 0 })).toEqual({
      playerResponse: undefined,
      state: undefined,
      timer: 0,
    })
  })

  test('returns null when timer is missing, invalid, or content is not an object', () => {
    expect(parseReadyCheck({ playerResponse: 'Accepted', state: 'EveryoneReady' })).toBeNull()
    expect(parseReadyCheck({ timer: '8' })).toBeNull()
    expect(parseReadyCheck({ timer: Number.NaN })).toBeNull()
    expect(parseReadyCheck(null)).toBeNull()
    expect(parseReadyCheck(undefined)).toBeNull()
    expect(parseReadyCheck('bad')).toBeNull()
  })
})
