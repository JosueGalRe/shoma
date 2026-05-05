import { useTranslation } from 'react-i18next'

import { lobbyRoles } from '@/core/lcu/parsers/lobby'

import type { LobbyRole } from '../lobby-store'

export type RolePickerProps = {
  disabled: boolean
  label: string
  onChange: (role: LobbyRole) => Promise<void>
  value: LobbyRole
}

export function RolePicker({ disabled, label, onChange, value }: RolePickerProps) {
  const { t } = useTranslation()

  return (
    <label className="space-y-1 text-sm text-lol-text-secondary">
      <span>{label}</span>
      <select
        className="h-10 w-full rounded-md border border-lol-border-subtle bg-lol-navy-950 px-3 text-sm text-lol-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold disabled:opacity-50"
        disabled={disabled}
        onChange={(event) => {
          void onChange(event.target.value as LobbyRole)
        }}
        value={value}
      >
        {lobbyRoles.map((role) => (
          <option key={role} value={role}>
            {t(`lobby.roles.${role.toLowerCase()}`)}
          </option>
        ))}
      </select>
    </label>
  )
}
