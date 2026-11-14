import type { ReactNode } from 'react'

import type { LobbyMember, LobbyRole } from '@/features/lobby/lobby-store'

export interface LobbyTitleProps {
  iconUrl?: string
  label: string
  // Owners change the mode from the title; without it the title is plain text
  onChangeMode?: () => void
}

export interface LobbyPartyProps {
  canInvite: boolean
  // Under the focused member's roles: the party switch, or the queue timer while searching
  children?: ReactNode
  members: LobbyMember[]
  // Opens Select Position from the local player's role tiles
  onEditRoles?: () => void
  onInvite: () => void
  showRoles: boolean
  size: number
}

export interface LobbyRoleTileProps {
  onClick?: () => void
  priority: 'primary' | 'secondary'
  role: LobbyRole
}

export interface LobbyQueueTimerProps {
  estimatedTime: number | null
  time: number
}
