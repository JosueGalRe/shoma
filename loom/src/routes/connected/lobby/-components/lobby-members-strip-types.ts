import type { LobbyMember } from '@/features/lobby/lobby-store'

export interface LobbyMembersStripProps {
  members: LobbyMember[]
  modeRules: { requiresRoleSelection: boolean }
  sessionState: {
    isOwner: boolean
    isLoading: boolean
    isConnected: boolean
    isActionPending: boolean
  }
  onPromotePlayer: (member: LobbyMember) => Promise<void>
  onKickPlayer: (member: LobbyMember) => Promise<void>
}
