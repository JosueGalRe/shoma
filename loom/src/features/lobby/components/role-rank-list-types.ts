import type { LobbyRole } from '../lobby-store'

export interface RoleRankListProps {
  disabled: boolean
  fill: boolean
  onFillToggle: (fill: boolean) => void
  onSwap: (slotIndex: number, role: LobbyRole) => void
  order: LobbyRole[]
  t: (key: string) => string
}
