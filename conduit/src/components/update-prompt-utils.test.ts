import { describe, expect, test } from 'bun:test'

import { formatUpdateDate } from './update-prompt-utils'

describe('formatUpdateDate', () => {
  test('returns null for missing or invalid dates', () => {
    expect(formatUpdateDate(undefined)).toBeNull()
    expect(formatUpdateDate('not-a-date')).toBeNull()
  })

  test('formats a valid ISO date', () => {
    const result = formatUpdateDate('2026-07-31T12:00:00Z')

    expect(result).not.toBeNull()
    expect(result).toContain('2026')
  })
})
