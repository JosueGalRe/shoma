import type { LobbyMember } from '@/features/lobby/lobby-store'

export interface LobbyMembersGridProps {
  members: LobbyMember[]
  isSearching: boolean
  showSecondaryRole: boolean
  canInvite: boolean
  invitesCount: number
  onOpenInvites: () => void
  t: (key: string) => string
}
