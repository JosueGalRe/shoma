export interface LobbyQueueCardProps {
  queueStatus: { isSearching: boolean }
  gameMode: {
    isSwiftplay: boolean
    isSwiftplayConfigured: boolean
  }
  session: {
    isConnected: boolean
    isActionPending: boolean
  }
  canJoinQueue: boolean
  dodgePenalty: {
    isActive: boolean
    remainingSeconds: number
  }
  onJoinQueue: () => void
  onLeaveQueue: () => void
}
