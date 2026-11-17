import { Button } from '@shoma/ui/button'
import { Icon } from '@shoma/ui/icon'
import { ScreenBackground } from '@shoma/ui/screen-background'
import { ScrollArea } from '@shoma/ui/scroll-area'
import { Switch } from '@shoma/ui/switch'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { useToast } from '@shoma/ui/use-toast'
import { create, props } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { TopBar } from '@/components/layout/top-bar'
import { communityDragonGameDataUrl } from '@/core/http/ddragon'
import { useAddCustomBot, useJoinCustomTeam, useSetCustomPosition, useStartCustomGame } from '@/core/lcu/lcu-mutations'
import {
  createLcuQueryOptions,
  customAvailableBotsDescriptor,
  gameMapsDescriptor,
  recommendedChampionPositionsDescriptor,
} from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import { CustomLobbyTeam } from './custom-lobby-team'
import { getCustomGameTypeKey, pickCustomBot } from './custom-lobby-utils'

import type { CustomLobbyProps } from './lobby-screen-types'

const TEAMS = ['TEAM1', 'TEAM2'] as const

// Figma "Personalizada" lobby (451:22600): the game's name over its map, team size and pick, the party's
// Open/Closed switch, and the two teams to join or fill with bots before the owner starts it
export function CustomLobby({
  isOwner,
  isSettingPartyType,
  lobby,
  members,
  onBack,
  onSetPartyType,
  partyType,
}: CustomLobbyProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const transport = useSharedLCUTransport()
  const maps = useQuery(createLcuQueryOptions(gameMapsDescriptor, transport)).data ?? []
  const bots = useQuery(createLcuQueryOptions(customAvailableBotsDescriptor, transport)).data ?? []
  const positions = useQuery(createLcuQueryOptions(recommendedChampionPositionsDescriptor, transport)).data ?? {}
  const addBot = useAddCustomBot()
  const joinTeam = useJoinCustomTeam()
  const setPosition = useSetCustomPosition()
  const startGame = useStartCustomGame()
  // The client finds a custom game's art by its map and mode
  const map = maps.find(({ gameMode, id }) => {
    return id === lobby.mapId && gameMode === lobby.gameMode
  })
  const icon = map?.assets['game-select-icon-active']
  const background = map?.assets['gameflow-background']
  const gameTypeKey = getCustomGameTypeKey(lobby.mutatorName)
  const details = [map?.name, `${lobby.teamSize}v${lobby.teamSize}`, gameTypeKey ? t(gameTypeKey) : undefined].filter(
    (detail) => {
      return detail !== undefined
    },
  )
  const localSummonerId = members.find(({ isLocalMember }) => {
    return isLocalMember
  })?.summonerId
  const isOpenParty = partyType === 'open'
  const isActing = addBot.isPending || joinTeam.isPending || startGame.isPending
  const seatCount = lobby.teams[0].length + lobby.teams[1].length
  // As in the client, a player's lane only counts on Summoner's Rift
  const hasLanes = lobby.gameMode === 'CLASSIC'
  const onError = () => {
    toast.add({ title: t('errors.generic'), type: 'error' })
  }

  return (
    <div {...props(styles.screen)}>
      <ScreenBackground image={background ? communityDragonGameDataUrl(background) : undefined} />

      <TopBar onBack={onBack} />

      <header {...props(styles.title)}>
        {icon ? <img alt="" draggable={false} src={communityDragonGameDataUrl(icon)} {...props(styles.icon)} /> : null}

        <div {...props(styles.titleText)}>
          <h1 {...props(text.heading1, styles.name)}>{lobby.name}</h1>

          <p {...props(text.body2, styles.details)}>
            {details.map((detail, index) => {
              return (
                <span key={detail} {...props(styles.detail)}>
                  {index > 0 ? <span aria-hidden {...props(styles.dot)} /> : null}

                  {detail}
                </span>
              )
            })}
          </p>
        </div>
      </header>

      <ScrollArea contentStyle={styles.body} style={styles.scroll}>
        <div {...props(styles.party)}>
          {isOwner ? (
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

            {`${seatCount}/${lobby.teamSize * 2}`}
          </span>
        </div>

        {lobby.teams.map((seats, index) => {
          const team = TEAMS[index] ?? 'TEAM1'
          const hasRoom = seats.length < lobby.teamSize
          const isLocalTeam = seats.some(({ summonerId }) => {
            return summonerId === localSummonerId
          })

          return (
            <CustomLobbyTeam
              key={team}
              actionsDisabled={isActing}
              members={members}
              number={index + 1}
              seats={seats}
              size={lobby.teamSize}
              onAddBot={
                isOwner && hasRoom && bots.length > 0
                  ? () => {
                      const bot = pickCustomBot({ bots, positions, team: seats })

                      if (bot) {
                        addBot.mutate({ ...bot, team: index === 0 ? '100' : '200' }, { onError })
                      }
                    }
                  : undefined
              }
              onJoin={
                !isLocalTeam && hasRoom
                  ? () => {
                      joinTeam.mutate(team, { onError })
                    }
                  : undefined
              }
              onPickPosition={
                hasLanes
                  ? (position) => {
                      setPosition.mutate(position, { onError })
                    }
                  : undefined
              }
            />
          )
        })}
      </ScrollArea>

      <footer {...props(styles.footer)}>
        <Button
          disabled={!isOwner || isActing}
          onClick={() => {
            startGame.mutate(undefined, { onError })
          }}
        >
          {t('custom.startGame')}
        </Button>
      </footer>
    </div>
  )
}

const styles = create({
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    paddingBlock: 16,
    paddingInline: 22,
  },
  detail: {
    alignItems: 'center',
    display: 'flex',
    gap: 8,
  },
  details: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    margin: 0,
    opacity: 0.8,
    textTransform: 'uppercase',
  },
  dot: {
    backgroundColor: 'currentColor',
    borderRadius: '50%',
    flexShrink: 0,
    height: 4,
    width: 4,
  },
  // Figma "Bottom Action": the button across, 24px in from the sides
  footer: {
    backgroundColor: color.background,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    paddingBlock: 16,
    paddingInline: 24,
  },
  icon: {
    flexShrink: 0,
    height: 40,
    objectFit: 'contain',
    width: 40,
  },
  name: {
    margin: 0,
    overflowWrap: 'anywhere',
    textTransform: 'uppercase',
  },
  party: {
    alignItems: 'center',
    color: color.text,
    display: 'flex',
    gap: 8,
    paddingBlock: 8,
    textTransform: 'uppercase',
  },
  screen: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: 0,
  },
  scroll: {
    flexGrow: 1,
  },
  title: {
    color: color.text,
    display: 'flex',
    flexShrink: 0,
    gap: 8,
    paddingInline: 24,
  },
  titleText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minWidth: 0,
  },
})
