import { Avatar } from '@/components/ui'

import { chatMessageBubbleStyles, chatMessageListStyles, chatMessageRowStyles } from '../social-styles'

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
    <div className={chatMessageListStyles({ active: hasConversation && selectedMessages.length > 0 })}>{messageContent}</div>
  )
}
