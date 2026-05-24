import type { LobbyRole } from '../lobby-store'

export type RolePickerProps = {
  disabled: boolean
  label: string
  onChange: (role: LobbyRole) => Promise<void>
  value: LobbyRole
}
