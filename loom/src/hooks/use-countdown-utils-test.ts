import { describe, expect, test } from 'vitest'

import { normalizeSeconds } from './use-countdown-utils'

describe('normalizeSeconds', () => {
  test('rounds fractional values up to the next whole second', () => {
    expect(normalizeSeconds(1.01)).toBe(2)
  })

  test('clamps zero and negative values to zero', () => {
    expect(normalizeSeconds(0)).toBe(0)
    expect(normalizeSeconds(-2.2)).toBe(0)
  })
})
