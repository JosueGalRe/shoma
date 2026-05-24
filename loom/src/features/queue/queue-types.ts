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

export type UseQueueResult = {
  cancelQueue: () => Promise<boolean>
  dodgePenalty: number
  gameflowPhase: string | null
  isInQueue: boolean
  isLoading: boolean
  isLowPriorityQueue: boolean
  queueType: string
  timer: number
}
