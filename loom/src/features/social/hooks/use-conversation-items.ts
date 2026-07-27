import { useMemo } from 'react'

import { findFriendForConversation, readConversationTitle } from '../components/social-utils'

import type { ConversationListItem, Friend } from '../social-types'
import type { LcuConversation } from '@/core/lcu/parsers'

export function useConversationItems(
  conversations: LcuConversation[],
  friends: Friend[],
  groupChatLabel: string,
): ConversationListItem[] {
  return useMemo(() => {
    const items: ConversationListItem[] = []

    for (const conversation of conversations) {
      if (conversation.type === 'chat' || conversation.type === 'groupChat') {
        const friend = findFriendForConversation(conversation, friends)

        items.push({
          friend,
          id: conversation.id,
          lastMessage: conversation.lastMessage,
          title: friend?.name ?? readConversationTitle(conversation) ?? groupChatLabel,
          unreadCount: conversation.unreadCount,
        })
      }
    }

    return items.toSorted((left, right) => {
      if (left.unreadCount !== right.unreadCount) {
        return right.unreadCount - left.unreadCount
      }

      return left.title.localeCompare(right.title)
    })
  }, [conversations, friends, groupChatLabel])
}
