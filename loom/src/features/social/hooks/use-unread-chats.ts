import { readUnreadCounts } from '../lib/chat-utils'

import { useChatLCU } from './use-chat-lcu'

// The client's unread badges: by conversation (a friend's 1:1 has the friend's id) and in all
export function useUnreadChats() {
  const byConversation = readUnreadCounts(useChatLCU(null).conversations)
  let total = 0

  for (const count of byConversation.values()) {
    total += count
  }

  return { byConversation, total }
}
