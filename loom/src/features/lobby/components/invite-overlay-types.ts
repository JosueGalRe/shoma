import type { SummonerId } from '@/core/types/branded'

export interface InviteOverlayProps {
  canInvite: boolean
  excludeSummonerIds: ReadonlySet<number>
  isActionPending: boolean
  isConnected: boolean
  onClose: () => void
  onInvitePlayers: (summonerIds: SummonerId[]) => Promise<void>
}

export interface SuggestedPlayer {
  summonerId: number
  summonerName: string
}
