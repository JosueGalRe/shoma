import { beforeEach, describe, expect, test } from 'vitest'

import {
  initialQueueState,
  selectIsMatchmakingQueue,
  selectIsQueueType,
  useQueueStore,
} from '../../src/features/queue/queue-store'

beforeEach(() => {
  useQueueStore.setState(initialQueueState)
})

describe('queue store', () => {
  test('does not use persist middleware', () => {
    const useQueueStoreWithPersist: typeof useQueueStore & { persist?: unknown } = useQueueStore
    expect(useQueueStoreWithPersist.persist).toBeUndefined()
  })

  test('exposes memoized queue-type selectors', () => {
    expect(selectIsMatchmakingQueue).toBe(selectIsQueueType('Matchmaking'))
    expect(selectIsMatchmakingQueue(useQueueStore.getState())).toBe(true)
  })

  test('updates queue state', () => {
    useQueueStore.getState().startQueue('Ranked Solo')
    useQueueStore.getState().setTimer(12)
    useQueueStore.getState().setDodgePenalty(30)

    expect(useQueueStore.getState()).toMatchObject({
      dodgePenalty: 30,
      isInQueue: true,
      queueType: 'Ranked Solo',
      timer: 12,
    })

    useQueueStore.getState().cancelQueue()
    expect(useQueueStore.getState()).toMatchObject(initialQueueState)
  })
})
