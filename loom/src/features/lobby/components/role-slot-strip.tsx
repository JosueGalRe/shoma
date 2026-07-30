import { useEffect, useRef, useState } from 'react'

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
  const contentSlotRef = useRef<RoleSlotStripSlot>('first')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (openSlot) {
      contentSlotRef.current = openSlot
    }
  }, [openSlot])

  const showSecondSlot = first !== 'FILL'

  // While open, trust the live slot; the ref only remembers it for the close animation.
  const contentSlot = openSlot ?? contentSlotRef.current

  useEffect(() => {
    if (!openSlot) {
      return undefined
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpenSlot(null)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [openSlot])

  const styles = roleSlotStripStyles({ open: openSlot !== null })
  const handlePick = (role: LobbyRole) => {
    if (!openSlot) {
      return
    }

    onSelect(openSlot, role)
    setOpenSlot(null)
  }

  return (
    <div ref={rootRef} className="relative flex items-center gap-2">
      <div aria-hidden={!openSlot} aria-label={t('lobby.rolePreferences')} className={styles.strip()} role="radiogroup">
        {STRIP_ROLES.map((role) => {
          const selectedRole = contentSlot === 'first' ? first : second
          const isSelected = selectedRole === role

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
              tabIndex={openSlot ? 0 : -1}
            >
              <img alt="" className={rolePickerIconStyles({ selected: isSelected })} src={ROLE_ICONS[role]} />
            </button>
          )
        })}
      </div>

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
