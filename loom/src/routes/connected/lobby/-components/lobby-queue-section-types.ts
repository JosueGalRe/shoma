import type { LobbyRole } from '@/features/lobby/lobby-store'

export interface LobbyQueueRoleStrip {
  disabled: boolean
  first: LobbyRole
  second: LobbyRole
  handleSelect: (slot: 'first' | 'second', role: LobbyRole) => void
}

export interface LobbyQueueSectionProps {
  isSearching: boolean
  canJoinQueue: boolean
  isLowPriorityQueue: boolean
  onCancelQueue: () => void
  onJoinQueue: () => void
  searchLabel: string
  roleStrip: LobbyQueueRoleStrip | null
  t: (key: string) => string
}
