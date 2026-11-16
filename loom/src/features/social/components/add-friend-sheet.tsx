import { useState } from 'react'

import { Avatar } from '@shoma/ui/avatar'
import { BottomSheet } from '@shoma/ui/bottom-sheet'
import { Button } from '@shoma/ui/button'
import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { text } from '@shoma/ui/text'
import { TextField } from '@shoma/ui/text-field'
import { color } from '@shoma/ui/tokens/color.stylex'
import { useToast } from '@shoma/ui/use-toast'
import { create, props } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { communityDragonGameDataUrl, useLatestDdragonVersion } from '@/core/http/ddragon'
import { useSendFriendRequest } from '@/core/lcu/lcu-mutations'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { createLcuQueryOptions, friendRequestsDescriptor, recentPlayersDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import { profileIconUrl, readGameName, readRecentPlayers } from '../lib/friend-utils'
import { getRiotId } from '../lib/riot-id'

import { FriendGroup } from './friend-group'
import { SocialEmpty } from './social-empty'

import type { AddFriendSheetProps } from '../social-types'

// Figma "Add Friend" (99:4086, 104:2507): a request by Riot ID, the ones still waiting, and who you played with lately
export function AddFriendSheet({ friends, onOpenChange, open, panel = null }: AddFriendSheetProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const transport = useSharedLCUTransport()
  const ddragonVersion = useLatestDdragonVersion().data
  const sendRequest = useSendFriendRequest()
  const requests = useQuery(createLcuQueryOptions(friendRequestsDescriptor, transport)).data ?? []
  const recentEntries = useQuery(createLcuQueryOptions(recentPlayersDescriptor, transport)).data ?? []
  const [gameName, setGameName] = useState('')
  const [tagLine, setTagLine] = useState('')

  useLcuObserverSync(friendRequestsDescriptor, transport)

  const riotId = getRiotId(gameName, tagLine)
  const sent = requests.filter((request) => {
    return request.direction === 'out'
  })
  const recentPlayers = readRecentPlayers(recentEntries, [
    ...friends.map((friend) => {
      return friend.id
    }),
    ...requests.map((request) => {
      return request.id
    }),
  ])

  function send(target: { gameName: string; tagLine: string } | { puuid: string }, onSent?: () => void) {
    sendRequest.mutate(target, {
      onError: () => {
        toast.add({ title: t('social.addFriend.failed'), type: 'error' })
      },
      onSuccess: () => {
        onSent?.()
        toast.add({ title: t('social.addFriend.sent'), type: 'success' })
      },
    })
  }

  function sendRiotId() {
    const [name = '', tag = ''] = riotId?.split('#') ?? []

    send({ gameName: name, tagLine: tag }, () => {
      setGameName('')
      setTagLine('')
    })
  }

  return (
    <BottomSheet
      closeLabel={t('common.back')}
      container={panel}
      open={open}
      title={t('social.addFriend.title')}
      onOpenChange={onOpenChange}
    >
      <form
        {...props(styles.content)}
        onSubmit={(event) => {
          event.preventDefault()

          if (riotId && !sendRequest.isPending) {
            sendRiotId()
          }
        }}
      >
        <TextField
          autoComplete="off"
          clearLabel={t('common.clear')}
          label={t('social.addFriend.gameName')}
          placeholder={t('social.addFriend.gameNamePlaceholder')}
          value={gameName}
          onValueChange={setGameName}
        />

        <TextField
          autoComplete="off"
          clearLabel={t('common.clear')}
          label={t('social.addFriend.tagLine')}
          placeholder="#"
          value={tagLine}
          onValueChange={setTagLine}
        />

        <hr {...props(styles.divider)} />

        <Button disabled={!riotId || sendRequest.isPending} type="submit">
          {t('social.addFriend.submit')}
        </Button>
      </form>

      {sent.length > 0 ? (
        <section {...props(styles.section)}>
          <h3 {...props(text.heading3Medium, styles.heading)}>{t('social.addFriend.sentRequests')}</h3>

          <ul {...props(styles.list)}>
            {sent.map((request) => {
              return (
                <li key={request.id} {...props(styles.row)}>
                  <Avatar
                    image={profileIconUrl(ddragonVersion, request.iconId)}
                    name={readGameName(request.name)}
                    status={t('social.addFriend.pending')}
                  />
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {/* Figma: the folding list once there's someone in it, the plain heading over the poro until then */}
      {recentPlayers.length > 0 ? (
        <div {...props(styles.section)}>
          <FriendGroup title={t('social.addFriend.recentlyPlayed')}>
            {recentPlayers.map((player) => {
              return (
                <li key={player.puuid} {...props(styles.row)}>
                  <Avatar
                    image={communityDragonGameDataUrl(`/lol-game-data/assets/v1/champion-icons/${player.championId}.png`)}
                    name={player.gameName}
                    status={`#${player.tagLine}`}
                  />

                  <IconButton
                    aria-label={t('social.addFriend.add', { name: player.gameName })}
                    disabled={sendRequest.isPending}
                    onClick={() => {
                      send({ puuid: player.puuid })
                    }}
                  >
                    <Icon name="add-friend" />
                  </IconButton>
                </li>
              )
            })}
          </FriendGroup>
        </div>
      ) : (
        <section {...props(styles.section)}>
          <h3 {...props(text.heading3Medium, styles.heading)}>{t('social.addFriend.recentlyPlayed')}</h3>

          <SocialEmpty poro="sad">{t('social.addFriend.recentlyPlayedEmpty')}</SocialEmpty>
        </section>
      )}
    </BottomSheet>
  )
}

const styles = create({
  // Figma: 16 between the fields, the line and the button
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  divider: {
    borderStyle: 'none',
    borderTopColor: color.text,
    borderTopStyle: 'solid',
    borderTopWidth: 1,
    margin: 0,
  },
  heading: {
    color: color.text,
    margin: 0,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  // A friend's 72px row, the add button at its end
  row: {
    alignItems: 'center',
    display: 'flex',
    gap: 8,
    justifyContent: 'space-between',
    paddingBlock: 8,
    paddingInline: 16,
  },
  // Figma: each section 16 below the one before
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    paddingBlockStart: 6,
  },
})
