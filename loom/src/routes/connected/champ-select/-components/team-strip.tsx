import { FadeImage } from '@shoma/ui/fade-image'
import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { communityDragonGameDataUrl } from '@/core/http/ddragon'
import { readRole } from '@/core/lcu/parsers/lobby'

import type { TeamStripProps } from './champ-select-screen-types'
import type { ChampSelectMember } from '@/features/champ-select'

function readChampion(member: ChampSelectMember) {
  return member.championId || member.championPickIntent || 0
}

// Figma "Teams Picks": both teams' champions as overlapping circles, the player's on the left; the arrow opens them as
// Two lists with each player's position (or champion, without positions) and name, over the screen, and ARAM's trade
// Button by each ally that can trade, filled while the player's request waits on them
export function TeamStrip({ champSelect, onOpenChange, onTrade, open }: TeamStripProps) {
  const { t } = useTranslation()

  function readChampionName(championId: number) {
    return (
      champSelect.champions.find(({ id }) => {
        return id === championId
      })?.name ?? ''
    )
  }

  function renderCircle(member: ChampSelectMember, isEnemy: boolean, isStacked: boolean) {
    const championId = readChampion(member)

    return (
      <span key={member.cellId} {...props(styles.circle, isEnemy ? styles.enemy : styles.ally, isStacked && styles.stacked)}>
        {championId > 0 ? (
          <span {...props(styles.art, member.championId <= 0 && styles.intent)}>
            <FadeImage
              src={communityDragonGameDataUrl(`/lol-game-data/assets/v1/champion-icons/${championId}.png`)}
              style={styles.image}
            />
          </span>
        ) : null}
      </span>
    )
  }

  function renderRow(member: ChampSelectMember, isEnemy: boolean) {
    const role = readRole(member.assignedPosition?.toUpperCase())
    const champion = readChampionName(readChampion(member))
    const label = role === 'UNSELECTED' ? champion : t(`lobby.roles.${role.toLowerCase()}`)
    const trade = champSelect.trades.find(({ cellId, state }) => {
      return cellId === member.cellId && (state === 'AVAILABLE' || state === 'SENT')
    })

    return (
      <li key={member.cellId} {...props(styles.row)}>
        {renderCircle(member, isEnemy, false)}

        <span {...props(text.body3, styles.names)}>
          {label ? <span {...props(styles.name, styles.position)}>{label}</span> : null}

          <span {...props(styles.name)}>{member.gameName || t('champSelect.hiddenSummoner')}</span>
        </span>

        {trade ? (
          <IconButton
            aria-label={t(trade.state === 'SENT' ? 'champSelect.trade.cancel' : 'champSelect.trade.ask', { champion })}
            style={styles.trade}
            variant={trade.state === 'SENT' ? 'filled' : 'default'}
            onClick={() => {
              onTrade(trade)
            }}
          >
            <Icon name="switch" />
          </IconButton>
        ) : null}
      </li>
    )
  }

  return (
    <div {...props(styles.root)}>
      <div {...props(styles.panel, open && styles.panelOpen)}>
        <div aria-hidden={open} inert={open} {...props(styles.collapsed, open && styles.hidden)}>
          <span {...props(styles.stack)}>
            {champSelect.team.map((member) => {
              return renderCircle(member, false, true)
            })}
          </span>

          <span {...props(styles.stack)}>
            {champSelect.enemyTeam.map((member) => {
              return renderCircle(member, true, true)
            })}
          </span>
        </div>

        <IconButton
          aria-expanded={open}
          aria-label={t(open ? 'champSelect.hideTeams' : 'champSelect.showTeams')}
          style={styles.toggle}
          onClick={() => {
            onOpenChange(!open)
          }}
        >
          <Icon name={open ? 'arrow-down' : 'arrow-up'} />
        </IconButton>

        <div inert={!open} {...props(styles.lists, !open && styles.hidden)}>
          <section {...props(styles.team)}>
            <h2 {...props(text.body3, styles.heading, styles.allyHeading)}>{t('champSelect.yourTeam')}</h2>

            <ul {...props(styles.members)}>
              {champSelect.team.map((member) => {
                return renderRow(member, false)
              })}
            </ul>
          </section>

          <section {...props(styles.team)}>
            <h2 {...props(text.body3, styles.heading, styles.enemyHeading)}>{t('champSelect.enemyTeam')}</h2>

            <ul {...props(styles.members)}>
              {champSelect.enemyTeam.map((member) => {
                return renderRow(member, true)
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

const OPEN_HEIGHT = 285

const styles = create({
  ally: {
    borderColor: color.info,
  },
  allyHeading: {
    color: color.primary,
  },
  art: {
    display: 'block',
    height: '100%',
    transitionDuration: '150ms',
    transitionProperty: 'opacity',
  },
  // Figma: 40px circles with a 1px edge, blue for the team and shimmer for the enemy
  circle: {
    backgroundColor: color.background,
    borderRadius: '50%',
    borderStyle: 'solid',
    borderWidth: 1,
    boxSizing: 'border-box',
    display: 'block',
    flexShrink: 0,
    height: 40,
    overflow: 'hidden',
    width: 40,
  },
  collapsed: {
    alignItems: 'center',
    display: 'flex',
    height: 48,
    inset: 0,
    justifyContent: 'space-between',
    paddingInline: 4,
    position: 'absolute',
    transitionDuration: '150ms',
    transitionProperty: 'opacity',
  },
  enemy: {
    borderColor: color.tileBorder,
  },
  enemyHeading: {
    color: color.control,
  },
  heading: {
    margin: 0,
    textTransform: 'uppercase',
  },
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  image: {
    display: 'block',
    height: '100%',
    objectFit: 'cover',
    width: '100%',
  },
  // A teammate's declared champion, not locked yet
  intent: {
    opacity: 0.5,
  },
  lists: {
    display: 'flex',
    inset: 0,
    justifyContent: 'space-between',
    paddingBlockStart: 44,
    paddingInline: 16,
    position: 'absolute',
    transitionDuration: '150ms',
    transitionProperty: 'opacity',
  },
  members: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  name: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  // Takes the row's room, so the trade buttons line up at the column's edge
  names: {
    color: color.text,
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minWidth: 0,
  },
  // Grows over the screen from the strip's place; the strip's own height stays, so nothing under it moves
  panel: {
    backgroundColor: color.background,
    bottom: 0,
    height: 48,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    transitionDuration: { '@media (prefers-reduced-motion: reduce)': '0s', default: '200ms' },
    transitionProperty: 'height, background-color',
    transitionTimingFunction: 'ease-out',
  },
  panelOpen: {
    backgroundColor: color.teamsOverlay,
    height: OPEN_HEIGHT,
  },
  position: {
    textTransform: 'uppercase',
  },
  root: {
    flexShrink: 0,
    height: 48,
    position: 'relative',
    zIndex: 1,
  },
  row: {
    alignItems: 'center',
    display: 'flex',
    gap: 4,
  },
  // Figma: the circles overlap by 12; the stack makes room for the first one's pull
  stack: {
    display: 'flex',
    paddingInlineStart: 12,
  },
  stacked: {
    marginInlineStart: -12,
  },
  team: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    width: '48%',
  },
  toggle: {
    left: '50%',
    position: 'absolute',
    top: 4,
    transform: 'translateX(-50%)',
    zIndex: 1,
  },
  trade: {
    flexShrink: 0,
  },
})
