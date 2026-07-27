import type { FormEvent } from 'react'

import type { ConversationListItem, Friend, SocialChatMessage } from '../social-types'

export interface SocialChatTabProps {
  hasOpenConversation: boolean
  hasConversation: boolean
  selectedFriend: Friend | null
  conversationTitle: string | undefined
  ddragonVersion: string | undefined
  onBack: () => void
  selectedMessages: SocialChatMessage[]
  draftMessage: string
  setDraftMessage: (message: string) => void
  handleSendMessage: (event: FormEvent<HTMLFormElement>) => void
  isSending: boolean
  conversationItems: ConversationListItem[]
  handleSelectConversation: (item: ConversationListItem) => void
}
