export type RiftLcuResult = {
  status: number
  content: unknown
}

export type RiftObserver = (result: RiftLcuResult) => void | Promise<void>

export type QueueState = {
  isCurrentlyInQueue: boolean
  estimatedQueueTime?: number
  timeInQueue?: number
  searchState?: string
  errors?: {
    errorType?: string
    penaltyTimeRemaining?: number
  }[]
}

export type LobbyState = {
  members?: unknown[]
  invitations?: unknown[]
  gameConfig?: {
    queueId?: number
    mapId?: number
  }
}

export type LobbyDetails = {
  memberCount: number
  inviteCount: number
  queueId: number | null
  mapId: number | null
  queueName: string | null
  mapName: string | null
}
