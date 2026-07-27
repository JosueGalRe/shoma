import { ROLE_ICONS } from '@/features/lobby/constants/role-icons'

import { rolePickerButtonStyles, rolePickerIconStyles } from './role-picker-styles'

import type { RoleSlotButtonProps } from './role-slot-button-types'

export function RoleSlotButton({ disabled, isOpen, label, onToggle, value }: RoleSlotButtonProps) {
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-label={label}
      disabled={disabled}
      className={rolePickerButtonStyles({ selected: isOpen })}
      onClick={onToggle}
    >
      <img alt="" className={rolePickerIconStyles({ selected: value !== 'UNSELECTED' })} src={ROLE_ICONS[value]} />
    </button>
  )
}
