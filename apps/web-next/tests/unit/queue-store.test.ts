/// <reference types="bun" />

import { beforeEach, describe, expect, it } from 'bun:test'

import { useGameflowStore } from '../../src/core/state/gameflow-store'
import { createQueueStore } from '../../src/features/queue/queue-store'

describe('queue store', () => {
  beforeEach(() => {
    useGameflowStore.getState().reset()
  })

  it('starts queue and transitions gameflow state', async () => {
    const store = createQueueStore()

    const started = await store.getState().startQueue(async () => Promise.resolve())

    expect(started).toBe(true)
    expect(store.getState().isInQueue).toBe(true)
    expect(store.getState().queueState?.searchState).toBe('Searching')
    expect(useGameflowStore.getState().phase).toBe('queue')
  })

  it('cancels queue and clears queue state', async () => {
    const store = createQueueStore()
    store.getState().setQueueState({
      estimatedQueueTime: 90,
      isCurrentlyInQueue: true,
      searchState: 'Searching',
      timeInQueue: 12,
    })

    const cancelled = await store.getState().cancelQueue(async () => Promise.resolve())

    expect(cancelled).toBe(true)
    expect(store.getState().isInQueue).toBe(false)
    expect(store.getState().queueState).toBeNull()
    expect(store.getState().estimatedTime).toBeNull()
    expect(useGameflowStore.getState().phase).toBe('lobby')
  })

  it('blocks start while dodge timer is active', async () => {
    const store = createQueueStore()
    store.getState().setQueueState({
      errors: [{ errorType: 'QUEUE_DODGER', penaltyTimeRemaining: 120 }],
      isCurrentlyInQueue: false,
    })

    const started = await store.getState().startQueue(async () => {
      throw new Error('should not request queue start')
    })

    expect(started).toBe(false)
    expect(store.getState().isInQueue).toBe(false)
    expect(store.getState().dodgeTimer).toBe(120)
    expect(store.getState().errors[0]).toEqual({ errorType: 'DodgePenaltyActive', penaltyTimeRemaining: 120 })
  })

  it('captures request failures as queue errors', async () => {
    const store = createQueueStore()

    const started = await store.getState().startQueue(async () => {
      throw new Error('LCU unavailable')
    })

    expect(started).toBe(false)
    expect(store.getState().isInQueue).toBe(false)
    expect(store.getState().errors[0]).toEqual({ errorType: 'LCU unavailable', penaltyTimeRemaining: 0 })
  })
})
