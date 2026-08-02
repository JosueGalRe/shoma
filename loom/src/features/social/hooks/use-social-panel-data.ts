import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { useLatestDdragonVersion } from '@/core/http/ddragon'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { createLcuQueryOptions, currentSummonerDescriptor, sentInvitesDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import { mapChatMessages, readConversationTitle } from '../components/chat-utils'
import { readCurrentUserPuuid } from '../components/friend-utils'

import { useChatLCU } from './use-chat-lcu'
import { useConversationItems } from './use-conversation-items'
import { useSocialLCU } from './use-social-lcu'

import type { Puuid, SummonerId } from '@/core/types/branded'

export function useSocialPanelData(selectedFriendId: Puuid | null, selectedConversationId: string | null) {
  const { t } = useTranslation()
  const socialLCU = useSocialLCU()
  const versionQuery = useLatestDdragonVersion()
  const chatLCU = useChatLCU(selectedFriendId, selectedConversationId)
  const transport = useSharedLCUTransport()
  const currentSummonerQuery = useQuery(createLcuQueryOptions(currentSummonerDescriptor, transport))
  const sentInvitesQuery = useQuery(createLcuQueryOptions(sentInvitesDescriptor, transport))

  useLcuObserverSync(sentInvitesDescriptor, transport)

  const { friends, groups, isLoading } = socialLCU

  const sentInviteStates = useMemo(() => {
    const states = new Map<SummonerId, string>()

    for (const invite of sentInvitesQuery.data ?? []) {
      if (invite.toSummonerId !== null && invite.state !== null) {
        states.set(invite.toSummonerId, invite.state)
      }
    }

    return states
  }, [sentInvitesQuery.data])

  const activeConversation = useMemo(() => {
    if (selectedConversationId) {
      return chatLCU.conversations.find((conversation) => {
        return conversation.id === selectedConversationId
      })
    }

    return undefined
  }, [chatLCU.conversations, selectedConversationId])

  const unreadCounts = useMemo(() => {
    const counts = new Map<Puuid, number>()
    const unreadByConversationId = new Map(
      chatLCU.conversations.map((conversation) => {
        return [conversation.id, conversation.unreadCount]
      }),
    )

    for (const friend of friends) {
      const conversation = chatLCU.getConversationForFriend(friend.id, friend.name)
      const conversationUnread = conversation ? unreadByConversationId.get(conversation.id) : undefined

      if (conversationUnread) {
        counts.set(friend.id, conversationUnread)
      }
    }

    return counts
  }, [friends, chatLCU])

  const totalUnread = useMemo(() => {
    return chatLCU.conversations.reduce((total, conversation) => {
      return conversation.type === 'chat' ? total + conversation.unreadCount : total
    }, 0)
  }, [chatLCU.conversations])

  const currentUserPuuid = readCurrentUserPuuid(currentSummonerQuery.data)

  const conversationItems = useConversationItems(chatLCU.conversations, {
    currentUserPuuid,
    friends,
    groupChatLabel: t('social.conversations.groupChat'),
    youLabel: t('social.conversations.you'),
  })
  const conversationTitle = activeConversation
    ? (readConversationTitle(activeConversation) ?? t('social.conversations.groupChat'))
    : undefined

  const selectedFriend =
    friends.find((friend) => {
      return friend.id === selectedFriendId
    }) ?? null

  const selectedMessages = useMemo(() => {
    const unique = [
      ...new Map(
        chatLCU.messages.map((message) => {
          return [message.id, message]
        }),
      ).values(),
    ]

    unique.sort((a, b) => {
      return a.timestamp - b.timestamp
    })

    return mapChatMessages(unique, { activeConversation, currentUserPuuid, friends })
  }, [activeConversation, chatLCU.messages, currentUserPuuid, friends])

  return {
    activeConversation,
    chatLCU,
    conversationItems,
    conversationTitle,
    currentUserPuuid,
    ddragonVersion: versionQuery.data,
    error: socialLCU.error,
    friends,
    groups,
    isLoading,
    selectedFriend,
    selectedMessages,
    sentInviteStates,
    totalUnread,
    unreadCounts,
  }
}
