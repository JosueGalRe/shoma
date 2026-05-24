import type { Friend } from '../social-types'
import type { SocialChatMessage } from '../social-types'

export type ChatPanelMessageListProps = {
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
