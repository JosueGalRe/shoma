import { create } from 'zustand'

// @knip
export type QueueStoreState = {
  dodgePenalty: number
  isInQueue: boolean
  queueType: string
  timer: number
}

// @knip
export type QueueStoreActions = {
  cancelQueue: () => void
  setDodgePenalty: (dodgePenalty: number) => void
  setTimer: (timer: number) => void
  startQueue: (queueType?: string) => void
}

// @knip
export type QueueStore = QueueStoreState & QueueStoreActions

type QueueStoreSelector<T> = (state: QueueStore) => T

const queueTypeSelectorCache = new Map<string, QueueStoreSelector<boolean>>()

// @knip
export const initialQueueState: QueueStoreState = {
  dodgePenalty: 0,
  isInQueue: false,
  queueType: 'Matchmaking',
  timer: 0,
}

export const selectDodgePenalty: QueueStoreSelector<number> = (state) => state.dodgePenalty

export const selectIsInQueue: QueueStoreSelector<boolean> = (state) => state.isInQueue

export const selectQueueType: QueueStoreSelector<string> = (state) => state.queueType

export const selectTimer: QueueStoreSelector<number> = (state) => state.timer

export function selectIsQueueType(queueType: string): QueueStoreSelector<boolean> {
  const cachedSelector = queueTypeSelectorCache.get(queueType)

  if (cachedSelector) {
    return cachedSelector
  }

  const selector: QueueStoreSelector<boolean> = (state) => state.queueType === queueType
  queueTypeSelectorCache.set(queueType, selector)
  return selector
}

export const selectIsMatchmakingQueue = selectIsQueueType('Matchmaking')

// @knip
export function createQueueStore() {
  return create<QueueStore>()((set) => ({
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
  }))
}

// @knip
export const useQueueStore = createQueueStore()
