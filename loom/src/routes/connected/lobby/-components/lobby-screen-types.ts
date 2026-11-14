import type { ReactNode } from 'react'

import type { QuickPlaySlot } from '@/core/lcu/parsers/lobby'
import type { SummonerId } from '@/core/types/branded'
import type { LobbyMember, LobbyRole } from '@/features/lobby/lobby-store'
import type { RoleSlot } from '@/features/lobby/utils/compute-role-preferences'
import type { QuickPlayPart } from '@/features/lobby/utils/quick-play-slots'
import type { IconName } from '@shoma/ui/icon'
import type { StyleXStyles } from '@stylexjs/stylex'

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
  // Swift Play: opens the picker of a part of one of the local player's two options
  onEditQuickPlay?: (option: 0 | 1, part: QuickPlayPart) => void
  // Swift Play shows each member's two options, and their party ready, instead of the roles and tokens
  quickPlay: boolean
  regalia: ReadonlyMap<SummonerId, LobbyMemberRegalia>
  showRoles: boolean
  size: number
}

export interface LobbyQuickPlaySlotsProps {
  onEdit?: (option: 0 | 1, part: QuickPlayPart) => void
  slots: QuickPlaySlot[]
}

export interface LobbySlotProps {
  icon?: IconName
  image?: string
  picked: boolean
  size?: 'large' | 'small'
  style?: StyleXStyles
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

// Figma "Invite": a friend the sheet offers, with their status line
export interface LobbyInviteFriend {
  iconUrl?: string
  name: string
  status: string
  summonerId: SummonerId
}

export interface LobbyInviteGroupProps {
  friends: LobbyInviteFriend[]
  name: string
  onToggle: (summonerId: SummonerId) => void
  selectedIds: ReadonlySet<SummonerId>
}

export interface LobbyInviteSheetProps {
  // The party, which the friend list leaves out
  memberIds: ReadonlySet<SummonerId>
  onInviteFriends: (summonerIds: SummonerId[]) => Promise<void>
  onInviteRiotId: (riotId: string) => Promise<void>
  onOpenChange: (open: boolean) => void
  open: boolean
}

export interface LobbyQueueTimerProps {
  estimatedTime: number | null
  time: number
}
