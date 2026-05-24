export type InviteOverlayProps = {
  canInvite: boolean
  isActionPending: boolean
  isConnected: boolean
  onClose: () => void
  onInvite: (summonerName: string) => Promise<void>
}

export type SuggestedPlayer = {
  summonerId: number
  summonerName: string
}
