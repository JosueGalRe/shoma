import { Avatar } from '@shoma/ui/avatar'
import { Button } from '@shoma/ui/button'
import { Select } from '@shoma/ui/select'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useChampions } from '@/core/http/ddragon'
import { ROLE_ICONS } from '@/features/lobby/role-icons'
import { resolveChampionIcon } from '@/lib/asset-resolver'

import type { CustomLobbyTeamProps } from './lobby-screen-types'
import type { CustomLobbySeat } from '@/core/lcu/parsers/custom-lobby'

const LANES = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as const

// Figma custom lobby "Players": a team's seats, its players and bots first and the rest Empty, a line between each.
// The first empty seat holds JOIN and ADD BOT
export function CustomLobbyTeam({
  actionsDisabled,
  members,
  number,
  onAddBot,
  onJoin,
  onPickPosition,
  seats,
  size,
}: CustomLobbyTeamProps) {
  const { t } = useTranslation()
  const champions = useChampions().data ?? []
  const laneOptions = LANES.map((lane) => {
    return { icon: ROLE_ICONS[lane], label: t(`lobby.roles.${lane.toLowerCase()}`), value: lane }
  })

  function renderSeat(seat: CustomLobbySeat) {
    if (seat.botChampionId !== null) {
      const { botChampionId } = seat
      const name =
        champions.find(({ id }) => {
          return id === botChampionId
        })?.name ?? seat.name

      return (
        <div {...props(styles.seat)}>
          <Avatar image={resolveChampionIcon(botChampionId, champions)} name={name} size="small" style={styles.avatar} />

          <span {...props(text.body1, styles.name)}>{name}</span>
        </div>
      )
    }

    const member = members.find(({ summonerId }) => {
      return summonerId === seat.summonerId
    })
    // As in the lobby, the game name without the #tag
    const name = (member?.displayName ?? seat.name).split('#', 1)[0] ?? ''
    const lane = LANES.find((candidate) => {
      return candidate === seat.position
    })

    return (
      <div {...props(styles.seat)}>
        <Avatar image={member?.iconUrl ?? undefined} name={name} size="small" style={styles.avatar} />

        {member?.isLeader ? <Crown aria-hidden {...props(styles.crown)} /> : null}

        <span {...props(text.body1, styles.name)}>{name}</span>

        {member?.isLocalMember && onPickPosition ? (
          <Select
            iconOnly
            aria-label={t('custom.position')}
            options={laneOptions}
            value={lane ?? null}
            onValueChange={onPickPosition}
          />
        ) : null}
      </div>
    )
  }

  return (
    <section {...props(styles.team)}>
      <h2 {...props(text.body1, styles.title)}>{t('custom.team', { number })}</h2>

      <ul {...props(styles.seats)}>
        {Array.from({ length: Math.max(size, seats.length) }, (_, index) => {
          const seat = seats.at(index)

          return (
            <li
              key={seat ? `${seat.summonerId ?? ''}${seat.botChampionId ?? ''}` : `empty-${index}`}
              {...props(index > 0 && styles.divided)}
            >
              {seat ? (
                renderSeat(seat)
              ) : (
                <div {...props(styles.seat)}>
                  <span {...props(text.body1, styles.name)}>{t('custom.empty')}</span>

                  {index === seats.length ? (
                    <div {...props(styles.actions)}>
                      {onJoin ? (
                        <Button disabled={actionsDisabled} size="medium" variant="tertiary" onClick={onJoin}>
                          {t('custom.join')}
                        </Button>
                      ) : null}

                      {onAddBot ? (
                        <Button disabled={actionsDisabled} size="medium" variant="tertiary" onClick={onAddBot}>
                          {t('custom.addBot')}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const styles = create({
  actions: {
    display: 'flex',
    flexShrink: 0,
    gap: 16,
  },
  avatar: {
    height: 40,
    width: 40,
  },
  crown: {
    color: color.leader,
    fill: 'currentColor',
    flexShrink: 0,
    height: 14,
    width: 14,
  },
  // Figma: a line 8px under the seat above
  divided: {
    borderTopColor: color.primary,
    borderTopStyle: 'solid',
    borderTopWidth: 1,
    paddingBlockStart: 8,
  },
  name: {
    flexGrow: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  seat: {
    alignItems: 'center',
    display: 'flex',
    gap: 16,
  },
  seats: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  team: {
    backgroundColor: color.panel,
    borderColor: color.primary,
    borderStyle: 'solid',
    borderWidth: 1,
    color: color.text,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 16,
  },
  title: {
    margin: 0,
  },
})
