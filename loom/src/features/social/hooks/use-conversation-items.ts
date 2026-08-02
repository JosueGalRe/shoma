import { useMemo } from 'react'

import { findFriendForConversation, readConversationTitle } from '../components/chat-utils'
import { matchesPuuid } from '../components/friend-utils'

import type { ConversationListItem, Friend } from '../social-types'
import type { LcuConversation } from '@/core/lcu/parsers'

export interface ConversationItemsOptions {
  currentUserPuuid: string | undefined
  friends: Friend[]
  groupChatLabel: string
  youLabel: string
}

function readLastMessageSenderName(
  conversation: LcuConversation,
  friends: Friend[],
  context: { currentUserPuuid: string | undefined; youLabel: string },
): string | undefined {
  const fromPuuid = conversation.lastMessageFromPuuid

  if (!fromPuuid) {
    return undefined
  }

  if (context.currentUserPuuid && matchesPuuid(context.currentUserPuuid, fromPuuid)) {
    return context.youLabel
  }

  const senderFriend = friends.find((friend) => {
    return matchesPuuid(friend.id, fromPuuid)
  })

  if (senderFriend) {
    return senderFriend.name
  }

  const participantIndex = conversation.participantPuuids.findIndex((participantId) => {
    return matchesPuuid(participantId, fromPuuid)
  })

  return participantIndex !== -1 ? conversation.participantNames[participantIndex] : undefined
}

export function useConversationItems(
  conversations: LcuConversation[],
  options: ConversationItemsOptions,
): ConversationListItem[] {
  const { currentUserPuuid, friends, groupChatLabel, youLabel } = options

  return useMemo(() => {
    const items: ConversationListItem[] = []

    for (const conversation of conversations) {
      if (conversation.type === 'chat' || conversation.type === 'groupChat') {
        const friend = findFriendForConversation(conversation, friends)

        items.push({
          friend,
          id: conversation.id,
          lastMessage: conversation.lastMessage,
          lastMessageSenderName: readLastMessageSenderName(conversation, friends, { currentUserPuuid, youLabel }),
          lastMessageTimestamp: conversation.lastMessageTimestamp,
          title: friend?.name ?? readConversationTitle(conversation) ?? groupChatLabel,
          unreadCount: conversation.unreadCount,
        })
      }
    }

    return items.toSorted((left, right) => {
      return (right.lastMessageTimestamp ?? 0) - (left.lastMessageTimestamp ?? 0)
    })
  }, [conversations, currentUserPuuid, friends, groupChatLabel, youLabel])
}
