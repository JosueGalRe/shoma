import { describe, expect, test } from 'vitest'

import { formatTimer, readDodgePenalty, readQueueType } from './queue-utils'

import type { QueueSearchState } from '@/core/lcu/parsers'

describe('queue utils', () => {
  test('formats timers with zero padding and clamps negatives', () => {
    expect(formatTimer(0)).toBe('00:00')
    expect(formatTimer(61)).toBe('01:01')
    expect(formatTimer(-5)).toBe('00:00')
  })

  test('reads the queue label from queueType, searchState, or a fallback', () => {
    const queueTypeState: QueueSearchState = {
      errors: undefined,
      isCurrentlyInQueue: true,
      lowPriorityData: undefined,
      queueType: 'Ranked Solo',
      searchState: 'Matchmaking',
      timeInQueue: 10,
    }

    const searchStateOnly: QueueSearchState = {
      errors: undefined,
      isCurrentlyInQueue: true,
      lowPriorityData: undefined,
      queueType: undefined,
      searchState: 'Quick Play',
      timeInQueue: 10,
    }

    expect(readQueueType(queueTypeState)).toBe('Ranked Solo')
    expect(readQueueType(searchStateOnly)).toBe('Quick Play')
    expect(readQueueType(null)).toBe('Matchmaking')
  })

  test('reads the highest dodge penalty from queue errors', () => {
    const queueState: QueueSearchState = {
      errors: [
        { errorType: 'LEAVER', penaltyTimeRemaining: 120 },
        { errorType: 'LEAVER', penaltyTimeRemaining: 30 },
        { errorType: 'LEAVER', penaltyTimeRemaining: 0 },
      ],
      isCurrentlyInQueue: true,
      lowPriorityData: undefined,
      queueType: 'Matchmaking',
      searchState: 'Matchmaking',
      timeInQueue: 10,
    }

    expect(readDodgePenalty(queueState)).toBe(120)
    expect(readDodgePenalty(null)).toBe(0)
  })
})
