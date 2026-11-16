import { useEffect, useRef, useState } from 'react'

import { Avatar } from '@shoma/ui/avatar'
import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { MessageBubble } from '@shoma/ui/message-bubble'
import { text } from '@shoma/ui/text'
import { TextField } from '@shoma/ui/text-field'
import { useToast } from '@shoma/ui/use-toast'
import { create, props } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { useLatestDdragonVersion } from '@/core/http/ddragon'
import { createLcuQueryOptions, currentSummonerDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import { useChatLCU } from '../hooks/use-chat-lcu'
import { useSendChatMessage } from '../hooks/use-send-chat-message'
import { mapChatMessages } from '../lib/chat-utils'
import { profileIconUrl, readCurrentUserPuuid, readGameName } from '../lib/friend-utils'

import { SocialEmpty } from './social-empty'
import { SocialLayer } from './social-layer'

import type { ChatScreenProps } from '../social-types'

// Figma "Chat" (113:4913): a friend's 1:1 conversation over Social, newest message at the bottom
export function ChatScreen({ friend, onOpenChange, open }: ChatScreenProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const transport = useSharedLCUTransport()
  const ddragonVersion = useLatestDdragonVersion().data
  const currentSummoner = useQuery(createLcuQueryOptions(currentSummonerDescriptor, transport)).data
  const chat = useChatLCU(friend?.id ?? null)
  const sendMessage = useSendChatMessage()
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const conversation = friend ? chat.getConversationForFriend(friend.id, friend.name) : undefined
  const messages = mapChatMessages(chat.messages, {
    activeConversation: undefined,
    currentUserPuuid: readCurrentUserPuuid(currentSummoner),
    friends: friend ? [friend] : [],
  })
  const name = friend ? readGameName(friend.name) : ''

  // Keeps the newest message in view as they come and when the chat opens
  useEffect(() => {
    const list = listRef.current

    if (list) {
      list.scrollTop = list.scrollHeight
    }
  }, [messages.length, open])

  function send() {
    const body = draft.trim()

    if (!friend || body === '' || sendMessage.isPending) {
      return
    }

    // A 1:1 conversation's id is the friend's pid; without one yet, sending opens it
    sendMessage.mutate(
      { body, conversationId: conversation?.id ?? friend.id, isNew: !conversation },
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
      backLabel={t('common.back')}
      leading={
        friend ? (
          <span aria-hidden {...props(styles.picture)}>
            <Avatar
              image={profileIconUrl(ddragonVersion, friend.iconId)}
              name={name}
              online={friend.status !== 'offline'}
              size="small"
            />
          </span>
        ) : null
      }
      open={open}
      title={name}
      titleStyle={text.heading1Bold}
      onOpenChange={onOpenChange}
    >
      <div ref={listRef} {...props(styles.list)}>
        {messages.length === 0 && !chat.isLoading ? (
          <SocialEmpty poro="question" style={styles.empty}>
            {t('social.chat.empty')}
          </SocialEmpty>
        ) : null}

        <ol {...props(styles.messages)}>
          {messages.map((message, index) => {
            const previous = messages[index - 1]

            return (
              <li key={message.id} {...props(previous && previous.isOutgoing !== message.isOutgoing && styles.turn)}>
                <MessageBubble variant={message.isOutgoing ? 'sent' : 'received'}>{message.text}</MessageBubble>
              </li>
            )
          })}
        </ol>
      </div>

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

        <IconButton aria-label={t('social.chat.send')} disabled={draft.trim() === ''} size="large" type="submit">
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
  empty: {
    marginBlock: 'auto',
  },
  field: {
    flexGrow: 1,
    minWidth: 0,
  },
  // Native scroll, not ScrollArea: it has to jump to the newest message, which needs the scroll box itself
  list: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: 0,
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    paddingInline: 24,
  },
  // The messages sit at the bottom until they fill the screen
  messages: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    listStyle: 'none',
    margin: 0,
    marginBlockStart: 'auto',
    padding: 0,
  },
  picture: {
    display: 'inline-flex',
  },
  // Figma: 32 between one side's messages and the other's
  turn: {
    marginBlockStart: 24,
  },
})
