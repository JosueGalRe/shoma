import { describe, expect, test } from 'vitest'

import { readDodgePenalty, readQueueType } from './queue-utils'

import type { QueueSearchState } from '@/core/lcu/parsers'

describe('queue utils', () => {
  test('reads the queue label from searchState or a fallback', () => {
    const searchingState: QueueSearchState = {
      errors: undefined,
      isCurrentlyInQueue: true,
      lowPriorityData: undefined,
      queueId: 420,
      searchState: 'Searching',
      timeInQueue: 10,
    }

    expect(readQueueType(searchingState)).toBe('Searching')
    expect(readQueueType({ isCurrentlyInQueue: true })).toBe('Matchmaking')
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
      queueId: 420,
      searchState: 'Searching',
      timeInQueue: 10,
    }

    expect(readDodgePenalty(queueState)).toBe(120)
    expect(readDodgePenalty(null)).toBe(0)
  })
})
