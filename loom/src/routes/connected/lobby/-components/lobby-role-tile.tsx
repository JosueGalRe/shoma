import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { ROLE_ICONS } from '@/features/lobby/role-icons'

import { LobbySlot } from './lobby-slot'

import type { LobbyRoleTileProps } from './lobby-screen-types'

// Figma lobby "Champions" frame: a position slot, dotted while unpicked and with the shimmer edge once picked.
// The local player's open Select Position
export function LobbyRoleTile({ onClick, priority, role }: LobbyRoleTileProps) {
  const { t } = useTranslation()
  const label = `${t(priority === 'primary' ? 'lobby.primaryRole' : 'lobby.secondaryRole')}: ${t(`lobby.roles.${role.toLowerCase()}`)}`
  const slot = <LobbySlot icon={ROLE_ICONS[role]} picked={role !== 'UNSELECTED'} />

  if (!onClick) {
    return (
      <div aria-label={label} role="img" {...props(styles.frame)}>
        {slot}
      </div>
    )
  }

  return (
    <button aria-label={label} type="button" onClick={onClick} {...props(styles.frame, styles.button)}>
      {slot}
    </button>
  )
}

const styles = create({
  button: {
    WebkitTapHighlightColor: 'transparent',
    borderWidth: 0,
    cursor: 'pointer',
    margin: 0,
    outlineColor: color.focusRing,
    outlineOffset: 2,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    touchAction: 'manipulation',
  },
  frame: {
    backgroundColor: { ':active': color.pressed, default: color.sheet },
    display: 'block',
    flexShrink: 0,
    padding: 8,
    transitionDuration: '150ms',
    transitionProperty: 'background-color',
  },
})
