import { useState } from 'react'

import { Avatar } from '@shoma/ui/avatar'
import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { text } from '@shoma/ui/text'
import { TextField } from '@shoma/ui/text-field'
import { useToast } from '@shoma/ui/use-toast'
import { create, props } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { useLatestDdragonVersion } from '@/core/http/ddragon'
import { createLcuQueryOptions, currentSummonerDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import { useActiveConversation } from '../hooks/use-active-conversation'
import { useChatLCU } from '../hooks/use-chat-lcu'
import { useChatParticipants } from '../hooks/use-chat-participants'
import { useSendChatMessage } from '../hooks/use-send-chat-message'
import { useFriendStatusLine } from '../hooks/use-social-labels'
import { mapChatMessages } from '../lib/chat-utils'
import { clashTeamTitle } from '../lib/clash-teams'
import { profileIconUrl, readCurrentUserIconId, readCurrentUserPuuid, readGameName } from '../lib/friend-utils'

import { ChatInviteButton } from './chat-invite-button'
import { ChatMessages } from './chat-messages'
import { SocialLayer } from './social-layer'

import type { ChatHeader, ChatScreenProps } from '../social-types'

// Figma "Chat" (113:4913) over Social: a friend's 1:1, with what they're doing and the invite to the lobby, or a Clash
// Team's group chat (113:5170); both draw their messages the group's way
export function ChatScreen({ onOpenChange, open, panel = null, target }: ChatScreenProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const transport = useSharedLCUTransport()
  const ddragonVersion = useLatestDdragonVersion().data
  const currentSummoner = useQuery(createLcuQueryOptions(currentSummonerDescriptor, transport)).data
  const statusLine = useFriendStatusLine()
  const friend = target?.kind === 'friend' ? target.friend : null
  const team = target?.kind === 'clash' ? target.team : null
  const chat = useChatLCU(friend?.id ?? null, team?.conversationId)
  const participants = useChatParticipants(team?.conversationId)
  const sendMessage = useSendChatMessage()
  const [draft, setDraft] = useState('')

  const friendConversationId = friend ? chat.getConversationForFriend(friend.id, friend.name)?.id : undefined
  const conversationId = team?.conversationId ?? friendConversationId
  const messages = mapChatMessages(chat.messages, {
    activeConversation: undefined,
    currentUserPuuid: readCurrentUserPuuid(currentSummoner),
    friends: friend ? [friend] : [],
    participants,
  })
  let header: ChatHeader = { iconUrl: undefined, online: false, subtitle: '', title: '' }

  if (friend) {
    header = {
      iconUrl: profileIconUrl(ddragonVersion, friend.iconId),
      online: friend.status !== 'offline',
      subtitle: statusLine(friend),
      title: readGameName(friend.name),
    }
  }

  if (team) {
    header = {
      iconUrl: team.logoUrl,
      online: false,
      subtitle: participants.length > 0 ? t('social.clash.online', { count: participants.length }) : '',
      title: clashTeamTitle(team, t('social.clash.pending')),
    }
  }

  useActiveConversation(open ? conversationId : undefined)

  function send() {
    const body = draft.trim()
    // A friend's 1:1 has the friend's pid for an id; without one yet, sending opens it
    const id = conversationId ?? friend?.id

    if (!id || body === '' || sendMessage.isPending) {
      return
    }

    sendMessage.mutate(
      { body, conversationId: id, isNew: conversationId === undefined },
      {
        onError: () => {
          toast.add({ title: t('social.chat.failed'), type: 'error' })
        },
        onSuccess: () => {
          setDraft('')
        },
      },
    )
  }

  return (
    <SocialLayer
      actions={friend ? <ChatInviteButton friend={friend} /> : null}
      backLabel={t('common.back')}
      leading={
        target ? (
          <span aria-hidden {...props(styles.picture)}>
            <Avatar image={header.iconUrl} name={header.title} online={header.online} size="small" />
          </span>
        ) : null
      }
      open={open}
      panel={panel}
      subtitle={header.subtitle}
      title={header.title}
      titleStyle={text.heading1Bold}
      wide
      onOpenChange={onOpenChange}
    >
      <ChatMessages isLoading={chat.isLoading} messages={messages} ownIconId={readCurrentUserIconId(currentSummoner)} />

      <form
        {...props(styles.composer)}
        onSubmit={(event) => {
          event.preventDefault()
          send()
        }}
      >
        <TextField
          aria-label={t('social.chat.message')}
          autoComplete="off"
          enterKeyHint="send"
          style={styles.field}
          value={draft}
          onValueChange={setDraft}
        />

        {/* Keeps the focus in the field, so a tap on send leaves the keyboard up for the next message */}
        <IconButton
          aria-label={t('social.chat.send')}
          disabled={draft.trim() === ''}
          size="large"
          type="submit"
          onMouseDown={(event) => {
            event.preventDefault()
          }}
        >
          <Icon name="send" />
        </IconButton>
      </form>
    </SocialLayer>
  )
}

const styles = create({
  // Figma "Message": the field and the 48px send button, 24 from the edges
  composer: {
    alignItems: 'flex-start',
    display: 'flex',
    flexShrink: 0,
    gap: 8,
    paddingBlock: 24,
    paddingInline: 24,
  },
  field: {
    flexGrow: 1,
    minWidth: 0,
  },
  picture: {
    display: 'inline-flex',
  },
})
