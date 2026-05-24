import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest'

import { formatElapsedSeconds, readElapsedSeconds } from './use-elapsed-time-utils'

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(10_500)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('use-elapsed-time-utils', () => {
  test('reads elapsed seconds from the clock and clamps negative values', () => {
    expect(readElapsedSeconds(8_200)).toBe(2)
    expect(readElapsedSeconds(11_000)).toBe(0)
    expect(readElapsedSeconds(null)).toBe(0)
  })

  test('formats elapsed seconds as a padded mm:ss string', () => {
    expect(formatElapsedSeconds(0)).toBe('00:00')
    expect(formatElapsedSeconds(125.9)).toBe('02:05')
    expect(formatElapsedSeconds(-5)).toBe('00:00')
  })
})
