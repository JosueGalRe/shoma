import { useEffect, useRef } from 'react'

import { Avatar } from '@shoma/ui/avatar'
import { MessageBubble } from '@shoma/ui/message-bubble'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { formatChatTime, startsChatStretch } from '../lib/chat-utils'

import { SocialEmpty } from './social-empty'

import type { ChatMessagesProps } from '../social-types'

// Figma "Chat" (113:4913) and its group version (113:5170, "Grupo"), which sets each sender's picture by the message:
// Newest at the bottom, a time over each stretch
export function ChatMessages({ avatars, isLoading, messages }: ChatMessagesProps) {
  const { i18n, t } = useTranslation()
  const listRef = useRef<HTMLDivElement>(null)
  // "Hoy" and "Ayer" as of this render; a chat left open past midnight keeps them until the next message
  const now = Date.now()

  // Keeps the newest message in view as they come and when the chat opens
  useEffect(() => {
    const list = listRef.current

    if (list) {
      list.scrollTop = list.scrollHeight
    }
  }, [messages.length])

  return (
    <div ref={listRef} {...props(styles.list)}>
      {messages.length === 0 && !isLoading ? (
        <SocialEmpty poro="question" style={styles.empty}>
          {t('social.chat.empty')}
        </SocialEmpty>
      ) : null}

      <ol {...props(styles.messages)}>
        {messages.map((message, index) => {
          const previous = messages[index - 1]
          const isStretch = startsChatStretch(previous?.timestamp, message.timestamp)
          const bubble = <MessageBubble variant={message.isOutgoing ? 'sent' : 'received'}>{message.text}</MessageBubble>
          const iconUrl = message.isOutgoing ? avatars?.ownIconUrl : avatars?.senderIconUrl(message.senderIconId)

          return (
            <li
              key={message.id}
              {...props(styles.message, previous && (isStretch || previous.isOutgoing !== message.isOutgoing) && styles.turn)}
            >
              {isStretch ? (
                <time dateTime={new Date(message.timestamp).toISOString()} {...props(text.body4, styles.time)}>
                  {formatChatTime(message.timestamp, now, i18n.language)}
                </time>
              ) : null}

              {avatars ? (
                <div {...props(styles.row, message.isOutgoing && styles.rowSent)}>
                  <Avatar image={iconUrl} name={message.senderName ?? ''} size="small" />

                  {bubble}
                </div>
              ) : (
                bubble
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

const styles = create({
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
  // Figma "Grupo": the 32px picture 8 from the bubble, on the sender's side
  row: {
    alignItems: 'center',
    display: 'flex',
    gap: 8,
  },
  rowSent: {
    flexDirection: 'row-reverse',
  },
  // Not in the Figma, which draws no times: a quiet line over each stretch of the conversation
  time: {
    alignSelf: 'center',
    color: color.textMuted,
    marginBlockEnd: 16,
  },
  // Figma: 32 between one side's messages and the other's
  turn: {
    marginBlockStart: 24,
  },
})
