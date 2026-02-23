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

export type ReadyCheckState = {
  timer: number
  state: string
  playerResponse: string
}

export type ReceivedInvite = {
  invitationId: string
  canAcceptInvitation: boolean
  fromSummonerId: number
  state: string
  gameConfig: {
    queueId?: number
    mapId?: number
  }
}

export type ChampSelectState = {
  phase: string
  timeLeftInPhaseMs: number | null
  myTeamCount: number
  theirTeamCount: number
  localPlayerCellId: number | null
  localPlayerChampionId: number | null
  isLocalPlayerTurn: boolean
  currentActionType: string | null
  currentActionChampionId: number | null
  hasLockedChampion: boolean
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
