import { useState } from 'react'

import { lobbyRoles } from '@/core/lcu/parsers/lobby'
import { ROLE_ICONS } from '@/features/lobby/constants/role-icons'

import { rolePickerIconStyles, roleSlotStripStyles } from './role-picker-styles'
import { RoleSlotButton } from './role-slot-button'

import type { LobbyRole } from '../lobby-store'
import type { RoleSlotStripProps, RoleSlotStripSlot } from './role-slot-strip-types'

const STRIP_ROLES = lobbyRoles.filter((role) => {
  return role !== 'UNSELECTED'
})

export function RoleSlotStrip({ disabled, first, onSelect, second, t }: RoleSlotStripProps) {
  const [openSlot, setOpenSlot] = useState<RoleSlotStripSlot | null>(null)
  const styles = roleSlotStripStyles()
  const showSecondSlot = first !== 'FILL'

  const handlePick = (role: LobbyRole) => {
    if (!openSlot) {
      return
    }

    onSelect(openSlot, role)
    setOpenSlot(null)
  }

  return (
    <div className="relative flex items-center gap-2">
      {openSlot ? (
        <div aria-label={t('lobby.rolePreferences')} className={styles.strip()} role="radiogroup">
          {STRIP_ROLES.map((role) => {
            const isSelected = (openSlot === 'first' ? first : second) === role

            return (
              <button
                key={role}
                type="button"
                aria-checked={isSelected}
                aria-label={t(`lobby.roles.${role.toLowerCase()}`)}
                className={styles.stripButton()}
                onClick={() => {
                  return handlePick(role)
                }}
                role="radio"
              >
                <img alt="" className={rolePickerIconStyles({ selected: isSelected })} src={ROLE_ICONS[role]} />
              </button>
            )
          })}
        </div>
      ) : null}

      <RoleSlotButton
        disabled={disabled}
        isOpen={openSlot === 'first'}
        label={t('lobby.primaryRole')}
        onToggle={() => {
          setOpenSlot(openSlot === 'first' ? null : 'first')
        }}
        value={first}
      />

      {showSecondSlot ? (
        <RoleSlotButton
          disabled={disabled}
          isOpen={openSlot === 'second'}
          label={t('lobby.secondaryRole')}
          onToggle={() => {
            setOpenSlot(openSlot === 'second' ? null : 'second')
          }}
          value={second}
        />
      ) : null}
    </div>
  )
}
