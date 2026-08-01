import { describe, expect, test } from 'vitest'

import { isRecord } from './type-guards'

describe('isRecord', () => {
  test('accepts plain objects and rejects non-objects', () => {
    expect(isRecord({})).toBe(true)
    expect(isRecord({ a: 1 })).toBe(true)
    expect(isRecord(null)).toBe(false)
    expect(isRecord(undefined)).toBe(false)
    expect(isRecord('str')).toBe(false)
    expect(isRecord(42)).toBe(false)
    expect(isRecord(true)).toBe(false)
  })
})
