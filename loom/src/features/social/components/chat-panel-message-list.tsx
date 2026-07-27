import { Fragment, useEffect, useRef } from 'react'

import { useTranslation } from 'react-i18next'

import { Avatar, ScrollArea } from '@/components/ui'

import { chatMessageBubbleStyles, chatMessageRowStyles } from '../social-styles'

import { formatChatDate, formatMessageTime, needsDateDivider, profileIconUrl } from './social-utils'

import type { ChatPanelMessageListProps } from './chat-panel-message-list-types'

export function ChatPanelMessageList({
  selectedFriend,
  hasConversation,
  selectedMessages,
  showSenderNames,
  ddragonVersion,
  styles,
}: ChatPanelMessageListProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  const now = Date.now()
  const dateLabels = { today: t('social.chatDate.today'), yesterday: t('social.chatDate.yesterday') }

  useEffect(() => {
    const viewport = rootRef.current?.querySelector('[data-radix-scroll-area-viewport]')

    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight
    }
  }, [selectedFriend?.id, selectedMessages.length])

  const messageContent = (() => {
    if (!selectedFriend && !showSenderNames) {
      return <div className={styles.emptyState()}>Choose a friend from the friends list to open a conversation.</div>
    }

    if (!hasConversation) {
      return <div className={styles.emptyState()}>No conversation available.</div>
    }

    if (selectedMessages.length === 0) {
      return <div className={styles.emptyState()}>No messages yet. Send the first one.</div>
    }

    return selectedMessages.map((message, index) => {
      const showDateDivider = needsDateDivider(selectedMessages[index - 1]?.timestamp, message.timestamp)

      return (
        <Fragment key={message.id}>
          {showDateDivider ? (
            <div className={styles.dateDivider()}>
              <span className={styles.dateDividerLine()} />

              <span>{formatChatDate(message.timestamp, now, dateLabels)}</span>

              <span className={styles.dateDividerLine()} />
            </div>
          ) : null}

          <div className={chatMessageRowStyles({ outgoing: message.isOutgoing })}>
            {message.isOutgoing ? null : (
              <Avatar src={profileIconUrl(ddragonVersion, message.senderIconId)} alt={message.senderName ?? ''} size="sm" />
            )}

            <div className={chatMessageBubbleStyles({ outgoing: message.isOutgoing })}>
              {showSenderNames && !message.isOutgoing && message.senderName ? (
                <span className={styles.messageSender()}>{message.senderName}</span>
              ) : null}

              <p className={styles.messageText()}>{message.text}</p>

              <time className={styles.timestamp()}>{formatMessageTime(message.timestamp)}</time>
            </div>
          </div>
        </Fragment>
      )
    })
  })()

  return (
    <div ref={rootRef} className="min-h-0 flex-1">
      <ScrollArea viewportClassName="p-4">
        <div className="flex flex-col gap-3">{messageContent}</div>
      </ScrollArea>
    </div>
  )
}
