import type { ReactNode } from 'react'

import type { SummonerId } from '@/core/types/branded'
import type { LobbyMember, LobbyRole } from '@/features/lobby/lobby-store'
import type { RoleSlot } from '@/features/lobby/utils/compute-role-preferences'

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
  // Opens Select Position on the slot of the local player's tile
  onEditRoles?: (slot: RoleSlot) => void
  onInvite: () => void
  regalia: ReadonlyMap<SummonerId, LobbyMemberRegalia>
  showRoles: boolean
  size: number
}

// A member's banner and challenge tokens as the client draws them
export interface LobbyMemberRegalia {
  bannerUrl?: string
  tokenUrls: string[]
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
