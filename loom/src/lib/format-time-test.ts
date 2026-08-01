import { describe, expect, test } from 'vitest'

import { formatMinutesSeconds, formatPaddedMinutesSeconds } from './format-time'

describe('formatMinutesSeconds', () => {
  test('formats as M:SS, flooring fractions and clamping negatives', () => {
    expect(formatMinutesSeconds(0)).toBe('0:00')
    expect(formatMinutesSeconds(5)).toBe('0:05')
    expect(formatMinutesSeconds(61)).toBe('1:01')
    expect(formatMinutesSeconds(600)).toBe('10:00')
    expect(formatMinutesSeconds(125.9)).toBe('2:05')
    expect(formatMinutesSeconds(-5)).toBe('0:00')
  })
})

describe('formatPaddedMinutesSeconds', () => {
  test('formats as MM:SS, flooring fractions and clamping negatives', () => {
    expect(formatPaddedMinutesSeconds(0)).toBe('00:00')
    expect(formatPaddedMinutesSeconds(5)).toBe('00:05')
    expect(formatPaddedMinutesSeconds(61)).toBe('01:01')
    expect(formatPaddedMinutesSeconds(600)).toBe('10:00')
    expect(formatPaddedMinutesSeconds(125.9)).toBe('02:05')
    expect(formatPaddedMinutesSeconds(-5)).toBe('00:00')
  })
})
