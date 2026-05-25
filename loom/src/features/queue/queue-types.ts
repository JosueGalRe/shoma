export interface QueueStoreState {
  dodgePenalty: number
  isInQueue: boolean
  queueType: string
  timer: number
}

export interface QueueStoreActions {
  cancelQueue: () => void
  setDodgePenalty: (dodgePenalty: number) => void
  setTimer: (timer: number) => void
  startQueue: (queueType?: string) => void
}

export type QueueStore = QueueStoreState & QueueStoreActions

export interface UseQueueResult {
  cancelQueue: () => Promise<boolean>
  dodgePenalty: number
  gameflowPhase: string | null
  isInQueue: boolean
  isLoading: boolean
  isLowPriorityQueue: boolean
  queueType: string
  timer: number
}
