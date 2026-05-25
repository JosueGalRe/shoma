import { create } from 'zustand'

import type { QueueStore, QueueStoreState } from './queue-types'

type QueueStoreSelector<T> = (state: QueueStore) => T

const queueTypeSelectorCache = new Map<string, QueueStoreSelector<boolean>>()

export const initialQueueState: QueueStoreState = {
  dodgePenalty: 0,
  isInQueue: false,
  queueType: 'Matchmaking',
  timer: 0,
}

export function selectDodgePenalty(state: QueueStore): number {
  return state.dodgePenalty
}

export function selectIsInQueue(state: QueueStore): boolean {
  return state.isInQueue
}

export function selectQueueType(state: QueueStore): string {
  return state.queueType
}

export function selectTimer(state: QueueStore): number {
  return state.timer
}

export function selectIsQueueType(queueType: string): QueueStoreSelector<boolean> {
  const cachedSelector = queueTypeSelectorCache.get(queueType)

  if (cachedSelector) {
    return cachedSelector
  }

  function selector(state: QueueStore): boolean {
    return state.queueType === queueType
  }

  queueTypeSelectorCache.set(queueType, selector)

  return selector
}

export const selectIsMatchmakingQueue = selectIsQueueType('Matchmaking')

export function createQueueStore() {
  return create<QueueStore>()((set) => {
    return {
      ...initialQueueState,
      cancelQueue() {
        set({ ...initialQueueState })
      },
      setDodgePenalty(dodgePenalty) {
        set({ dodgePenalty: Math.max(0, dodgePenalty) })
      },
      setTimer(timer) {
        set({ timer: Math.max(0, timer) })
      },
      startQueue(queueType = 'Matchmaking') {
        set({
          dodgePenalty: 0,
          isInQueue: true,
          queueType,
          timer: 0,
        })
      },
    }
  })
}

export const useQueueStore = createQueueStore()
