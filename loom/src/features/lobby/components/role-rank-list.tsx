import { useEffect, useRef, useState } from 'react'

import { ROLE_ICONS } from '@/features/lobby/constants/role-icons'

import { RANKED_ROLE_SLOTS } from '../utils/compute-ranked-role-preferences'

import { rolePickerIconStyles } from './role-picker-styles'
import { roleRankListStyles } from './role-rank-list-styles'

import type { LobbyRole } from '../lobby-store'
import type { RoleRankListProps } from './role-rank-list-types'

export function RoleRankList({ disabled, fill, onFillToggle, onSwap, order, t }: RoleRankListProps) {
  const [openSlot, setOpenSlot] = useState<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (openSlot === null) {
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

  const styles = roleRankListStyles({ fill, open: openSlot !== null })

  const handlePick = (role: LobbyRole) => {
    if (openSlot === null) {
      return
    }

    onSwap(openSlot, role)
    setOpenSlot(null)
  }

  return (
    <div ref={rootRef} className={styles.root()}>
      <div aria-hidden={openSlot === null} aria-label={t('lobby.rolePreferences')} className={styles.strip()} role="radiogroup">
        {RANKED_ROLE_SLOTS.map((role) => {
          const isSelected = openSlot !== null && order[openSlot] === role

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
              tabIndex={openSlot !== null ? 0 : -1}
            >
              <img alt="" className={rolePickerIconStyles({ selected: isSelected })} src={ROLE_ICONS[role]} />
            </button>
          )
        })}
      </div>

      <div className={styles.slots()}>
        {order.map((role, index) => {
          return (
            <button
              key={role}
              type="button"
              aria-label={`${index + 1}: ${t(`lobby.roles.${role.toLowerCase()}`)}`}
              className={styles.slot()}
              disabled={disabled || fill}
              onClick={() => {
                setOpenSlot(openSlot === index ? null : index)
              }}
            >
              <span className={styles.slotIndex()}>{index + 1}</span>

              <img alt="" className={rolePickerIconStyles({ selected: !fill })} src={ROLE_ICONS[role]} />
            </button>
          )
        })}
      </div>

      <button
        type="button"
        aria-pressed={fill}
        className={styles.fillToggle()}
        disabled={disabled}
        onClick={() => {
          onFillToggle(!fill)
        }}
      >
        <span className={styles.fillCheck()}>{fill ? '✓' : null}</span>

        <span>{t('lobby.anyPosition')}</span>
      </button>
    </div>
  )
}
