import type { LobbyRole } from '../lobby-store'

export interface RolePickerProps {
  disabled: boolean
  label: string
  onChange: (role: LobbyRole) => Promise<void>
  value: LobbyRole
}
