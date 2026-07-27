import { useEffect, useRef } from 'react'

import { Avatar, ScrollArea } from '@/components/ui'

import { chatMessageBubbleStyles, chatMessageRowStyles } from '../social-styles'

import { formatMessageTime, profileIconUrl } from './social-utils'

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

    return selectedMessages.map((message) => {
      return (
        <div key={message.id} className={chatMessageRowStyles({ outgoing: message.isOutgoing })}>
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
