export interface InviteOverlayProps {
  canInvite: boolean
  isActionPending: boolean
  isConnected: boolean
  onClose: () => void
  onInvite: (summonerName: string) => Promise<void>
}

export interface SuggestedPlayer {
  summonerId: number
  summonerName: string
}
