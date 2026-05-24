import type { Friend } from '../social-types'
import type { SocialChatMessage } from '../social-types'
import { chatMessageBubbleStyles, chatMessageListStyles } from '../social-styles'
import { formatMessageTime } from './social-utils'
import { getSystemMessageLabel } from './chat-panel-utils'
import type { ChatPanelMessageListProps } from './chat-panel-message-list-types'

export function ChatPanelMessageList({
  selectedFriend,
  hasConversation,
  selectedMessages,
  styles,
}: ChatPanelMessageListProps) {
  function renderMessageContent() {
    if (!selectedFriend) {
      return <div className={styles.emptyState()}>Choose a friend from the friends list to open a conversation.</div>
    }

    if (!hasConversation) {
      return <div className={styles.emptyState()}>No conversation available.</div>
    }

    if (selectedMessages.length === 0) {
      return <div className={styles.emptyState()}>No messages yet. Send the first one.</div>
    }

    return selectedMessages.map((message) => {
      const label = getSystemMessageLabel(message, selectedFriend.name)

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
      {renderMessageContent()}
    </div>
  )
}
