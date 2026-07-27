import type { LobbyRole } from '../lobby-store'

export type RoleSlotStripSlot = 'first' | 'second'

export interface RoleSlotStripProps {
  disabled: boolean
  first: LobbyRole
  onSelect: (slot: RoleSlotStripSlot, role: LobbyRole) => void
  second: LobbyRole
  t: (key: string) => string
}
