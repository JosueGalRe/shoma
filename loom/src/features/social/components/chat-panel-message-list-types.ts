import type { Friend, SocialChatMessage } from '../social-types'

export interface ChatPanelMessageListProps {
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
