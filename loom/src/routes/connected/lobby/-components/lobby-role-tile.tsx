import { Icon } from '@shoma/ui/icon'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { ROLE_ICONS } from './lobby-party-utils'

import type { LobbyRoleTileProps } from './lobby-screen-types'

// Figma lobby "Champions" frame: a position slot, dotted while unpicked and with the shimmer edge once picked
export function LobbyRoleTile({ role }: LobbyRoleTileProps) {
  const { t } = useTranslation()
  const isPicked = role !== 'UNSELECTED'

  return (
    <div aria-label={t(`lobby.roles.${role.toLowerCase()}`)} role="img" {...props(styles.frame)}>
      <div {...props(styles.slot, isPicked && styles.picked)}>
        <Icon name={ROLE_ICONS[role]} size={32} />
      </div>
    </div>
  )
}

const styles = create({
  frame: {
    backgroundColor: color.sheet,
    flexShrink: 0,
    padding: 8,
  },
  picked: {
    borderColor: color.accent,
    borderStyle: 'solid',
    color: color.primary,
  },
  slot: {
    alignItems: 'center',
    borderColor: color.primary,
    borderStyle: 'dotted',
    borderWidth: 2,
    boxSizing: 'border-box',
    color: color.icon,
    display: 'flex',
    height: 80,
    justifyContent: 'center',
    transitionDuration: '150ms',
    transitionProperty: 'border-color, color',
    width: 80,
  },
})
