import { Avatar } from '@shoma/ui/avatar'
import { EmptySlot } from '@shoma/ui/empty-slot'
import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { ScrollArea } from '@shoma/ui/scroll-area'
import { Switch } from '@shoma/ui/switch'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, keyframes, props } from '@stylexjs/stylex'
import { Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { getSubteamSlots } from './lobby-party-utils'

import type { LobbySubteamsProps } from './lobby-screen-types'
import type { LobbyMember } from '@/features/lobby/lobby-store'

// Figma Arena lobby (365:13984): the client's multiteam lobby, a card per team and a row per place in it. A free place
// Invites, and a place in another team takes the local player there (the client's swap button), none of it while searching
export function LobbySubteams({
  canInvite,
  config,
  isOpenParty,
  isSettingPartyType,
  members,
  onInvite,
  onMove,
  onOpenMember,
  onSetPartyType,
  queueStatus,
}: LobbySubteamsProps) {
  const { t } = useTranslation()
  const teams = getSubteamSlots(members, config)
  const localTeam = members.find(({ isLocalMember }) => {
    return isLocalMember
  })?.subteamIndex
  const isSearching = queueStatus !== undefined

  function renderMember(member: LobbyMember) {
    // As in the lobby, the game name without the #tag
    const name = member.displayName.split('#', 1)[0] ?? ''
    const content = (
      <>
        <Avatar image={member.iconUrl ?? undefined} name={name} size="small" style={styles.avatar} />

        {member.isLeader ? <Crown aria-hidden {...props(styles.crown)} /> : null}

        <span {...props(text.body1, styles.name)}>{name}</span>
      </>
    )

    if (!onOpenMember || member.isLocalMember) {
      return <div {...props(styles.player)}>{content}</div>
    }

    return (
      <button
        aria-haspopup="dialog"
        aria-label={member.isLeader ? `${member.displayName}, ${t('lobby.owner')}` : member.displayName}
        type="button"
        onClick={() => {
          onOpenMember(member)
        }}
        {...props(styles.player, styles.memberButton)}
      >
        {content}
      </button>
    )
  }

  return (
    <ScrollArea contentStyle={[styles.body, isSearching && styles.searchingBody]} style={styles.scroll}>
      <div {...props(styles.party)}>
        {onSetPartyType ? (
          <Switch
            aria-label={t('lobby.openParty')}
            checked={isOpenParty}
            disabled={isSettingPartyType}
            icon={<Icon name="group" size={14} />}
            onCheckedChange={(checked) => {
              onSetPartyType(checked ? 'open' : 'closed')
            }}
          />
        ) : null}

        <span {...props(text.marcellus11, styles.detail)}>
          {isOpenParty ? t('lobby.openParty') : t('lobby.closedParty')}

          <span aria-hidden {...props(styles.dot)} />

          {`${members.length}/${config.playerSlotCount * config.subteamCount}`}
        </span>
      </div>

      {teams.map((places, team) => {
        const subteamIndex = team + 1

        return (
          <section key={subteamIndex} aria-label={t('custom.team', { number: subteamIndex })} {...props(styles.team)}>
            <ul {...props(styles.places)}>
              {places.map((member, place) => {
                const intraSubteamPosition = place + 1
                const canMove = onMove !== undefined && !isSearching && subteamIndex !== localTeam

                return (
                  <li key={intraSubteamPosition} {...props(styles.place, place > 0 && styles.divided)}>
                    {member ? renderMember(member) : null}

                    {/* Figma "Contador": a searching party takes nobody else, so its free places close */}
                    {!member && !isSearching ? (
                      <EmptySlot
                        aria-label={t('lobby.invitePlayer')}
                        disabled={!canInvite}
                        icon={<Icon name="add" />}
                        style={styles.slot}
                        variant="friend"
                        onClick={onInvite}
                      />
                    ) : null}

                    {canMove ? (
                      <IconButton
                        aria-label={t('lobby.moveToSlot', { team: subteamIndex })}
                        style={styles.move}
                        onClick={() => {
                          onMove(subteamIndex, intraSubteamPosition)
                        }}
                      >
                        <Icon name="switch" />
                      </IconButton>
                    ) : null}
                  </li>
                )
              })}
            </ul>

            {queueStatus && subteamIndex === localTeam ? <div {...props(styles.queueStatus)}>{queueStatus}</div> : null}
          </section>
        )
      })}
    </ScrollArea>
  )
}

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const styles = create({
  avatar: {
    height: 40,
    width: 40,
  },
  // Figma: the groups 22px in from the sides, 20 apart
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    paddingBlock: 16,
    paddingInline: 22,
  },
  crown: {
    color: color.leader,
    fill: 'currentColor',
    flexShrink: 0,
    height: 14,
    width: 14,
  },
  detail: {
    alignItems: 'center',
    display: 'flex',
    gap: 8,
  },
  // Figma: a line 8px under the place above
  divided: {
    borderTopColor: color.primary,
    borderTopStyle: 'solid',
    borderTopWidth: 1,
    paddingBlockStart: 8,
  },
  dot: {
    backgroundColor: 'currentColor',
    borderRadius: '50%',
    flexShrink: 0,
    height: 4,
    width: 4,
  },
  memberButton: {
    WebkitTapHighlightColor: 'transparent',
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: 'inherit',
    cursor: 'pointer',
    outlineColor: color.focusRing,
    outlineOffset: 2,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    padding: 0,
    textAlign: 'start',
    touchAction: 'manipulation',
  },
  move: {
    marginInlineStart: 'auto',
  },
  name: {
    flexGrow: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  // As tall as the switch, which the owner loses while searching, so the teams don't move
  party: {
    alignItems: 'center',
    color: color.text,
    display: 'flex',
    gap: 8,
    minHeight: 44,
    paddingBlock: 8,
    textTransform: 'uppercase',
  },
  // A place keeps its 40px while searching closes it, so nothing below moves
  place: {
    alignItems: 'center',
    display: 'flex',
    gap: 16,
    minHeight: 40,
  },
  places: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  player: {
    alignItems: 'center',
    display: 'flex',
    flexGrow: 1,
    gap: 16,
    minWidth: 0,
  },
  queueStatus: {
    animationDuration: '200ms',
    animationName: fadeIn,
    animationTimingFunction: 'ease-out',
    display: 'flex',
    justifyContent: 'center',
    paddingBlockStart: 16,
  },
  scroll: {
    flexGrow: 1,
  },
  // The footer's IN QUEUE rises over the list's end, so the last team scrolls out from under it
  searchingBody: {
    paddingBlockEnd: 80,
  },
  slot: {
    height: 40,
    width: 40,
  },
  team: {
    backgroundColor: color.panel,
    borderColor: color.primary,
    borderStyle: 'solid',
    borderWidth: 1,
    color: color.text,
    display: 'flex',
    flexDirection: 'column',
    padding: 16,
  },
})
