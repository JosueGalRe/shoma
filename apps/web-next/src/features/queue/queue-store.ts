import { create } from 'zustand'

export type QueueStoreState = {
  dodgePenalty: number
  isInQueue: boolean
  queueType: string
  timer: number
}

export type QueueStoreActions = {
  cancelQueue: () => void
  setDodgePenalty: (dodgePenalty: number) => void
  setTimer: (timer: number) => void
  startQueue: (queueType?: string) => void
}

export type QueueStore = QueueStoreState & QueueStoreActions

export const initialQueueState: QueueStoreState = {
  dodgePenalty: 0,
  isInQueue: false,
  queueType: 'Matchmaking',
  timer: 0,
}

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

export const useQueueStore = createQueueStore()
