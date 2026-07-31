import { describe, expect, test } from 'vitest'

import { normalizeRankedRoles, rankedRolesToPreferences, swapRankedRole } from './compute-ranked-role-preferences'

import type { LobbyRole } from '../lobby-store'

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

  test('swaps a role into a slot, exchanging it with the slot that held it', () => {
    const order = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as const

    expect(swapRankedRole([...order], 0, 'MIDDLE')).toEqual(['MIDDLE', 'JUNGLE', 'TOP', 'BOTTOM', 'UTILITY'])
  })

  test('returns the same order when the role is already in the slot', () => {
    const order: LobbyRole[] = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY']

    expect(swapRankedRole(order, 0, 'TOP')).toBe(order)
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
