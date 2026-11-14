import { Icon } from '@shoma/ui/icon'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { ROLE_ICONS } from '@/features/lobby/role-icons'

import type { PositionOptionProps } from './position-option-types'

// Figma "Position": the lane's icon and name; a picked one turns mana (primary) or shimmer (secondary) and wears the
// Priority diamond. The priority line keeps its height while hidden, so picking doesn't move the grid
export function PositionOption({ onToggle, priority, role }: PositionOptionProps) {
  const { t } = useTranslation()

  return (
    <button aria-pressed={priority !== null} type="button" onClick={onToggle} {...props(styles.option)}>
      <span {...props(styles.icon, priority && priorityColors[priority])}>
        <Icon name={ROLE_ICONS[role]} size={40} />

        <span aria-hidden {...props(styles.badge, priority === null && styles.hidden)}>
          <span {...props(styles.badgeMark)} />
        </span>
      </span>

      <span {...props(text.body1, styles.label)}>{t(`lobby.roles.${role.toLowerCase()}`)}</span>

      <span aria-hidden={priority === null} {...props(text.body3, styles.label, priority === null && styles.hidden)}>
        {t(priority === 'secondary' ? 'lobby.secondaryRole' : 'lobby.primaryRole')}
      </span>
    </button>
  )
}

const styles = create({
  // Figma "Priority": a mana-400 square turned into a diamond around a shimmer-50 one, past the icon's top-right corner
  badge: {
    alignItems: 'center',
    borderColor: color.textLabel,
    borderStyle: 'solid',
    borderWidth: 2,
    display: 'flex',
    height: 18,
    justifyContent: 'center',
    left: 'calc(100% + 8px)',
    position: 'absolute',
    top: -12,
    transform: 'rotate(45deg)',
    transitionDuration: '150ms',
    transitionProperty: 'opacity',
    width: 18,
  },
  badgeMark: {
    backgroundColor: color.controlMark,
    height: 8,
    width: 8,
  },
  hidden: {
    opacity: 0,
  },
  icon: {
    color: color.icon,
    display: 'flex',
    marginBlockEnd: 6,
    position: 'relative',
    transitionDuration: '150ms',
    transitionProperty: 'color',
  },
  label: {
    color: color.text,
    textTransform: 'uppercase',
    transitionDuration: '150ms',
    transitionProperty: 'opacity',
  },
  option: {
    WebkitTapHighlightColor: 'transparent',
    alignItems: 'center',
    backgroundColor: { ':active': color.pressed, default: 'transparent' },
    borderWidth: 0,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    margin: 0,
    outlineColor: color.focusRing,
    outlineOffset: 2,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    paddingBlock: 8,
    touchAction: 'manipulation',
    transitionDuration: '150ms',
    transitionProperty: 'background-color',
  },
})

const priorityColors = create({
  primary: { color: color.primary },
  secondary: { color: color.accent },
})
