import { describe, expect, test } from 'vitest'

import { normalizeRankedRoles, rankedRolesToPreferences } from './compute-ranked-role-preferences'

describe('compute-ranked-role-preferences', () => {
  test('keeps the stored order and fills gaps with remaining roles', () => {
    expect(normalizeRankedRoles({ fifth: 'UTILITY', first: 'JUNGLE', second: 'MIDDLE' })).toEqual([
      'JUNGLE',
      'MIDDLE',
      'TOP',
      'BOTTOM',
      'UTILITY',
    ])
  })

  test('dedupes and skips fill or unselected slots', () => {
    expect(normalizeRankedRoles({ first: 'TOP', fourth: 'UNSELECTED', second: 'TOP', third: 'FILL' })).toEqual([
      'TOP',
      'JUNGLE',
      'MIDDLE',
      'BOTTOM',
      'UTILITY',
    ])
  })

  test('maps an order back to the five preference slots', () => {
    expect(rankedRolesToPreferences(['JUNGLE', 'MIDDLE', 'TOP', 'BOTTOM', 'UTILITY'])).toEqual({
      fifth: 'UTILITY',
      first: 'JUNGLE',
      fourth: 'BOTTOM',
      second: 'MIDDLE',
      third: 'TOP',
    })
  })
})
