import type { Friend, SocialChatMessage } from '../social-types'

export interface ChatPanelMessageListProps {
  selectedFriend: Friend | null
  hasConversation: boolean
  selectedMessages: SocialChatMessage[]
  showSenderNames: boolean
  ddragonVersion: string | undefined
  styles: {
    dateDivider: () => string
    dateDividerLine: () => string
    emptyState: () => string
    messageSender: () => string
    messageText: () => string
    timestamp: () => string
  }
}
