import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { readElapsedSeconds } from './use-elapsed-time-utils'

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(10_500)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('use-elapsed-time-utils', () => {
  test('reads elapsed seconds from the clock and clamps negative values', () => {
    expect(readElapsedSeconds(8200)).toBe(2)
    expect(readElapsedSeconds(11_000)).toBe(0)
    expect(readElapsedSeconds(null)).toBe(0)
  })
})
