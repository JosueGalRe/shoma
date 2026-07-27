import { useTranslation } from 'react-i18next'

import { lobbyRoles } from '@/core/lcu/parsers/lobby'
import { ROLE_ICONS } from '@/features/lobby/constants/role-icons'

import { rolePickerButtonStyles, rolePickerContainerStyles, rolePickerIconStyles } from './role-picker-styles'

import type { RolePickerProps } from './role-picker-types'

export function RolePicker({ disabled, label, onChange, value }: RolePickerProps) {
  const { t } = useTranslation()

  return (
    <div className="text-muted space-y-1 text-sm">
      <span>{label}</span>

      <div aria-label={label} className={rolePickerContainerStyles({ disabled })} role="radiogroup">
        {lobbyRoles.map((role) => {
          const isSelected = value === role
          const iconUrl = ROLE_ICONS[role]

          return (
            <button
              key={role}
              aria-checked={isSelected}
              aria-label={t(`lobby.roles.${role.toLowerCase()}`)}
              className={rolePickerButtonStyles({ selected: isSelected })}
              role="radio"
              type="button"
              onClick={() => {
                void onChange(role)
              }}
            >
              <img alt="" className={rolePickerIconStyles({ selected: isSelected })} src={iconUrl} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
