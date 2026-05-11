import { useTranslation } from 'react-i18next'

import { lobbyRoles } from '@/core/lcu/parsers/lobby'
import { ROLE_ICONS, ROLE_ICONS_SELECTED } from '@/features/lobby/constants/role-icons'

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
    <div className="space-y-1 text-sm text-lol-text-secondary">
      <span>{label}</span>
      <div
        aria-label={label}
        className={`flex flex-row gap-2 ${disabled ? 'pointer-events-none opacity-50' : ''}`}
        role="radiogroup"
      >
        {lobbyRoles.map((role) => {
          const isSelected = value === role
          const iconUrl = isSelected ? ROLE_ICONS_SELECTED[role] : ROLE_ICONS[role]

          return (
            <button
              key={role}
              aria-checked={isSelected}
              aria-label={t(`lobby.roles.${role.toLowerCase()}`)}
              className={`flex h-11 w-11 items-center justify-center rounded-full border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold ${
                isSelected
                  ? 'border-lol-border-gold bg-lol-navy-900/60 shadow-lol-glow-gold'
                  : 'border-lol-border-subtle bg-lol-navy-950'
              }`}
              role="radio"
              type="button"
              onClick={() => {
                void onChange(role)
              }}
            >
              <img alt="" className="h-6 w-6 object-contain" src={iconUrl} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
