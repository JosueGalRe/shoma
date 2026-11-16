import { useEffect, useRef } from 'react'

import { Avatar } from '@shoma/ui/avatar'
import { MessageBubble } from '@shoma/ui/message-bubble'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { useLatestDdragonVersion } from '@/core/http/ddragon'

import { formatChatDay, formatMessageTime, startsChatDay } from '../lib/chat-utils'
import { profileIconUrl } from '../lib/friend-utils'

import { SocialEmpty } from './social-empty'

import type { ChatMessagesProps } from '../social-types'

// Within this of the end still counts as reading the newest message
const BOTTOM_SLACK_PX = 8

// Figma "Grupo" (113:5170) for every chat, 1:1 included: each message by its sender's picture, the local player's own
// On their side, newest at the bottom. Each bubble carries its time and each day opens under its name
export function ChatMessages({ isLoading, messages, ownIconId }: ChatMessagesProps) {
  const { i18n, t } = useTranslation()
  const ddragonVersion = useLatestDdragonVersion().data
  const listRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)
  // "Hoy" and "Ayer" as of this render; a chat left open past midnight keeps them until the next message
  const now = Date.now()

  // Keeps the newest message in view as they come and when the chat opens
  useEffect(() => {
    const list = listRef.current

    if (list) {
      list.scrollTop = list.scrollHeight
    }
  }, [messages.length])

  // The keyboard shrinks the list from below: the newest message stays in view if it was
  useEffect(() => {
    const list = listRef.current

    if (!list || typeof ResizeObserver === 'undefined') {
      return undefined
    }

    const observer = new ResizeObserver(() => {
      if (isAtBottomRef.current) {
        list.scrollTop = list.scrollHeight
      }
    })

    observer.observe(list)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div
      ref={listRef}
      onScroll={(event) => {
        const list = event.currentTarget

        isAtBottomRef.current = list.scrollHeight - list.scrollTop - list.clientHeight < BOTTOM_SLACK_PX
      }}
      {...props(styles.list)}
    >
      {messages.length === 0 && !isLoading ? (
        <SocialEmpty poro="question" style={styles.empty}>
          {t('social.chat.empty')}
        </SocialEmpty>
      ) : null}

      <ol {...props(styles.messages)}>
        {messages.map((message, index) => {
          const previous = messages[index - 1]
          const isNewDay = startsChatDay(previous?.timestamp, message.timestamp)
          const dateTime = new Date(message.timestamp).toISOString()

          return (
            <li
              key={message.id}
              {...props(styles.message, previous && (isNewDay || previous.isOutgoing !== message.isOutgoing) && styles.turn)}
            >
              {isNewDay ? (
                <time dateTime={dateTime} {...props(text.body4, styles.day)}>
                  {formatChatDay(message.timestamp, now, i18n.language)}
                </time>
              ) : null}

              <div {...props(styles.row, message.isOutgoing && styles.rowSent)}>
                <Avatar
                  image={profileIconUrl(ddragonVersion, message.isOutgoing ? ownIconId : message.senderIconId)}
                  name={message.senderName ?? ''}
                  size="small"
                />

                <MessageBubble variant={message.isOutgoing ? 'sent' : 'received'}>
                  {message.text}

                  <time dateTime={dateTime} {...props(styles.time)}>
                    {formatMessageTime(message.timestamp, i18n.language)}
                  </time>
                </MessageBubble>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

const styles = create({
  // Not in the Figma, which draws no dates: a quiet line over each day of the conversation
  day: {
    alignSelf: 'center',
    color: color.textMuted,
    marginBlockEnd: 16,
  },
  empty: {
    marginBlock: 'auto',
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
  message: {
    display: 'flex',
    flexDirection: 'column',
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
  // Figma "Grupo": the 32px picture 8 from the bubble, on the sender's side, by its squared corner
  row: {
    alignItems: 'flex-end',
    display: 'flex',
    gap: 8,
  },
  rowSent: {
    flexDirection: 'row-reverse',
  },
  // Not in the Figma either: the time under the text, small and at the bubble's end, as the old chat had it
  time: {
    display: 'block',
    fontSize: '0.625rem',
    lineHeight: 1.2,
    marginBlockStart: 2,
    opacity: 0.7,
    textAlign: 'end',
  },
  // Figma: 32 between one side's messages and the other's
  turn: {
    marginBlockStart: 24,
  },
})
