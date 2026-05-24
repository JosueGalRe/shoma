import type { SocialChatMessage } from '../social-types';
import type { Friend } from '../social-types';
import { chatMessageBubbleStyles, chatMessageListStyles } from '../social-styles'
import { formatMessageTime } from './social-utils'
import { getSystemMessageLabel } from './chat-panel-utils'

interface ChatPanelMessageListProps {
  selectedFriend: Friend | null
  hasConversation: boolean
  selectedMessages: SocialChatMessage[]
  styles: {
    emptyState: () => string
    systemMessage: () => string
    systemLabel: () => string
    messageRow: () => string
    messageText: () => string
    timestamp: () => string
  }
}

export function ChatPanelMessageList({
  selectedFriend,
  hasConversation,
  selectedMessages,
  styles,
}: ChatPanelMessageListProps) {
  let messageContent = null

  if (!selectedFriend) {
    messageContent = <div className={styles.emptyState()}>Choose a friend from the friends list to open a conversation.</div>
  } else if (!hasConversation) {
    messageContent = <div className={styles.emptyState()}>No conversation available.</div>
  } else if (selectedMessages.length === 0) {
    messageContent = <div className={styles.emptyState()}>No messages yet. Send the first one.</div>
  } else {
    messageContent = selectedMessages.map((message) => {
      const label = getSystemMessageLabel(message, selectedFriend?.name)

      if (label) {
        return (
          <div key={message.id} className={styles.systemMessage()}>
            <span className={styles.systemLabel()}>{label}</span>
          </div>
        )
      }

      return (
        <div key={message.id} className={styles.messageRow()}>
          <div className={chatMessageBubbleStyles({ outgoing: message.isOutgoing })}>
            <p className={styles.messageText()}>{message.text}</p>
            <time className={styles.timestamp()}>{formatMessageTime(message.timestamp)}</time>
          </div>
        </div>
      )
    })
  }

  return (
    <div className={chatMessageListStyles({ active: Boolean(selectedFriend && hasConversation && selectedMessages.length > 0) })}>
      {messageContent}
    </div>
  )
}
