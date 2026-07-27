import type { LobbyRole } from '../lobby-store'

export interface RoleSlotButtonProps {
  disabled: boolean
  isOpen: boolean
  label: string
  onToggle: () => void
  value: LobbyRole
}
