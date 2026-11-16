import { Icon } from '@shoma/ui/icon'
import { ScreenBackground } from '@shoma/ui/screen-background'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { readRole } from '@/core/lcu/parsers/lobby'
import { ROLE_ICONS } from '@/features/lobby/role-icons'

import type { AssignedPositionsProps } from './champ-select-screen-types'

// Figma "You were assigned": the player's position and the team's over the map, as champ select opens
export function AssignedPositions({ localCellId, mapUrl, members, open }: AssignedPositionsProps) {
  const { t } = useTranslation()
  const local = members.find((member) => {
    return member.cellId === localCellId
  })
  const localRole = readRole(local?.assignedPosition?.toUpperCase())

  return (
    <div aria-hidden={!open} inert={!open} {...props(styles.root, !open && styles.closed)}>
      <ScreenBackground image={mapUrl} />

      <div {...props(styles.title)}>
        <h2 {...props(text.heading2, styles.assigned)}>{t('champSelect.youWereAssigned')}</h2>

        <p {...props(text.heading1Bold, styles.role)}>{t(`lobby.roles.${localRole.toLowerCase()}`)}</p>
      </div>

      <ul {...props(styles.members)}>
        {members.map((member) => {
          const role = readRole(member.assignedPosition?.toUpperCase())

          return (
            <li key={member.cellId} {...props(styles.member)}>
              <span {...props(styles.avatar)}>
                <Icon name={ROLE_ICONS[role]} size={32} />
              </span>

              <span {...props(text.body1, styles.position)}>{t(`lobby.roles.${role.toLowerCase()}`)}</span>

              <span {...props(text.body3, styles.name)}>{member.gameName || t('champSelect.hiddenSummoner')}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const styles = create({
  assigned: {
    '::after': { backgroundColor: 'currentColor', borderRadius: '50%', content: '""', flexShrink: 0, height: 4, width: 4 },
    '::before': { backgroundColor: 'currentColor', borderRadius: '50%', content: '""', flexShrink: 0, height: 4, width: 4 },
    alignItems: 'center',
    display: 'flex',
    gap: 8,
    margin: 0,
    textTransform: 'uppercase',
  },
  // Figma "Avatar": 56px, navy with a 1px mana-300 edge, here around the position's icon
  avatar: {
    alignItems: 'center',
    backgroundColor: color.background,
    borderColor: color.focusRing,
    borderRadius: '50%',
    borderStyle: 'solid',
    borderWidth: 1,
    boxSizing: 'border-box',
    color: color.text,
    display: 'flex',
    height: 56,
    justifyContent: 'center',
    marginBlock: 8,
    width: 56,
  },
  closed: {
    opacity: 0,
    pointerEvents: 'none',
  },
  member: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    width: 112,
  },
  // Figma: 112 wide, 16 apart, three then two
  members: {
    columnGap: 16,
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    listStyle: 'none',
    margin: 0,
    marginInline: 'auto',
    maxWidth: 368,
    padding: 0,
    rowGap: 16,
  },
  name: {
    color: color.text,
    maxWidth: '100%',
    overflow: 'hidden',
    textAlign: 'center',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  position: {
    color: color.text,
    textTransform: 'uppercase',
  },
  role: {
    margin: 0,
    textTransform: 'uppercase',
  },
  root: {
    color: color.text,
    display: 'flex',
    flexDirection: 'column',
    gap: 82,
    inset: 0,
    paddingBlockStart: 131,
    paddingInline: 8,
    position: 'fixed',
    transitionDuration: { '@media (prefers-reduced-motion: reduce)': '0s', default: '300ms' },
    transitionProperty: 'opacity',
    transitionTimingFunction: 'ease-out',
    zIndex: 2,
  },
  title: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
})
