import { describe, expect, test } from 'vitest'

import { parseQueueSearchState, readDodgePenalty, readQueueType } from '../../../src/core/lcu/parsers/queue'

describe('lcu queue parsers', () => {
  describe('parseQueueSearchState', () => {
    test('parses queue state and valid errors', () => {
      expect(
        parseQueueSearchState({
          errors: [
            { errorType: 'DODGE_WARNING', penaltyTimeRemaining: 30 },
            { errorType: 123, penaltyTimeRemaining: Number.NaN },
            null,
          ],
          isCurrentlyInQueue: true,
          queueType: 'RANKED_SOLO_5x5',
          searchState: 'Searching',
          timeInQueue: 15,
        }),
      ).toEqual({
        errors: [
          { errorType: 'DODGE_WARNING', penaltyTimeRemaining: 30 },
          { errorType: undefined, penaltyTimeRemaining: undefined },
        ],
        isCurrentlyInQueue: true,
        queueType: 'RANKED_SOLO_5x5',
        searchState: 'Searching',
        timeInQueue: 15,
      })
    })

    test('returns null for non-objects and undefined fields for wrong types', () => {
      expect(parseQueueSearchState(null)).toBeNull()
      expect(parseQueueSearchState(undefined)).toBeNull()
      expect(parseQueueSearchState('bad')).toBeNull()
      expect(parseQueueSearchState([])).toBeNull()

      expect(
        parseQueueSearchState({
          errors: 'bad',
          isCurrentlyInQueue: 'true',
          queueType: 400,
          searchState: null,
          timeInQueue: Number.POSITIVE_INFINITY,
        }),
      ).toEqual({
        errors: undefined,
        isCurrentlyInQueue: undefined,
        queueType: undefined,
        searchState: undefined,
        timeInQueue: undefined,
      })
    })
  })

  describe('readQueueType', () => {
    test('prefers queue type, then search state, then fallback label', () => {
      expect(readQueueType({ queueType: 'ARAM', searchState: 'Searching' })).toBe('ARAM')
      expect(readQueueType({ searchState: 'Searching' })).toBe('Searching')
      expect(readQueueType({})).toBe('Matchmaking')
      expect(readQueueType(null)).toBe('Matchmaking')
    })
  })

  describe('readDodgePenalty', () => {
    test('returns the largest penalty and clamps missing penalties to zero', () => {
      expect(readDodgePenalty({ errors: [{ penaltyTimeRemaining: 20 }, { penaltyTimeRemaining: 45 }] })).toBe(45)
      expect(readDodgePenalty({ errors: [{ errorType: 'Other' }] })).toBe(0)
      expect(readDodgePenalty({})).toBe(0)
      expect(readDodgePenalty(null)).toBe(0)
    })
  })
})
