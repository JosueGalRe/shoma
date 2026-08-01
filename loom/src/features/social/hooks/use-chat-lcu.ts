import { useEffect, useMemo } from 'react'

import { LcuPaths } from '@shoma/protocol-contract'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { conversationMessagesDescriptor, conversationsDescriptor, createLcuQueryOptions } from '@/core/lcu/queries'
import { RelayClientState } from '@/core/relay/relay-client'
import { useSharedRelayClient } from '@/core/relay/use-relay-client'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import { matchesPuuid } from '../components/social-utils'

import type { LcuConversation, LcuConversationMessage } from '@/core/lcu/parsers'
import type { Puuid } from '@/core/types/branded'

export interface UseChatLCUResult {
  conversations: LcuConversation[]
  error: string | null
  getConversationForFriend: (friendId: Puuid, friendName?: string) => { id: string } | undefined
  isLoading: boolean
  messages: LcuConversationMessage[]
}

function preferChatConversation(conversations: LcuConversation[]): LcuConversation | undefined {
  return (
    conversations.find((item) => {
      return item.type === 'chat'
    }) ?? conversations[0]
  )
}

export function findConversationForFriend(
  conversations: LcuConversation[],
  friendId: Puuid,
  friendName?: string,
): { id: string } | undefined {
  const idOneToOneMatches = conversations.filter((item) => {
    return (
      item.participantPuuids.some((pid) => {
        return matchesPuuid(friendId, pid)
      }) && item.participantPuuids.length <= 2
    )
  })

  const conversation =
    preferChatConversation(idOneToOneMatches) ??
    (friendName
      ? preferChatConversation(
          conversations.filter((item) => {
            return item.participantNames.includes(friendName) && item.participantPuuids.length <= 2
          }),
        )
      : undefined) ??
    preferChatConversation(
      conversations.filter((item) => {
        return item.participantPuuids.some((pid) => {
          return matchesPuuid(friendId, pid)
        })
      }),
    ) ??
    (friendName
      ? preferChatConversation(
          conversations.filter((item) => {
            return item.participantNames.includes(friendName)
          }),
        )
      : undefined) ??
    // Fallback: some LCU versions use the friend's PUUID as the conversation id with empty participants
    preferChatConversation(
      conversations.filter((item) => {
        return matchesPuuid(friendId, item.id)
      }),
    )

  return conversation ? { id: conversation.id } : undefined
}

function formatChatError(error: Error | null): string | null {
  return error ? `Unable to load League chat: ${error.message}` : null
}

function resolveSelectedConversation(
  conversations: LcuConversation[],
  selectedFriendId: Puuid | null,
  selectedConversationId: string | null | undefined,
): { id: string } | undefined {
  if (selectedConversationId) {
    return { id: selectedConversationId }
  }

  if (selectedFriendId) {
    return findConversationForFriend(conversations, selectedFriendId)
  }

  return undefined
}

export function useChatLCU(selectedFriendId: Puuid | null, selectedConversationId?: string | null): UseChatLCUResult {
  const transport = useSharedLCUTransport()
  const { state: relayState } = useSharedRelayClient()
  const isConnected = relayState === RelayClientState.CONNECTED
  const queryClient = useQueryClient()

  const conversationsQuery = useQuery(createLcuQueryOptions(conversationsDescriptor, transport))

  useLcuObserverSync(conversationsDescriptor, transport)

  // Conversation-level events (new message, unread count) fire on sub-paths, not the list path.
  /* eslint-disable react-doctor/effect-needs-cleanup -- transport.observe() returns a Promise<Unsubscribe>; the cleanup below owns it */
  useEffect(() => {
    if (!transport) {
      return undefined
    }

    const unsubscribe = transport.observe(`${LcuPaths.social.conversations}/*`, () => {
      queryClient
        .invalidateQueries({
          queryKey: conversationsDescriptor.queryKey,
        })
        .catch(() => {})
    })

    return () => {
      unsubscribe
        .then((fn) => {
          return fn()
        })
        .catch(() => {})
    }
  }, [transport, queryClient])

  const conversations = isConnected ? (conversationsQuery.data ?? []) : []
  const selectedConversation = resolveSelectedConversation(conversations, selectedFriendId, selectedConversationId)
  const conversationId = selectedConversation?.id

  const messagesDescriptor = useMemo(() => {
    return conversationMessagesDescriptor(conversationId ?? '')
  }, [conversationId])

  const messagesQuery = useQuery({
    ...createLcuQueryOptions(messagesDescriptor, transport),
    enabled: Boolean(conversationId),
  })

  useLcuObserverSync(messagesDescriptor, conversationId ? transport : null)

  // Observe individual message events (e.g. /messages/{id}) to invalidate the list
  /* eslint-disable react-doctor/effect-needs-cleanup -- transport.observe() returns a Promise<Unsubscribe>; the cleanup below owns it */
  useEffect(() => {
    if (!transport || !conversationId) {
      return undefined
    }

    const wildcardPath = `${LcuPaths.social.conversationMessages(conversationId)}/*`
    const unsubscribe = transport.observe(wildcardPath, () => {
      queryClient
        .invalidateQueries({
          queryKey: conversationMessagesDescriptor(conversationId).queryKey,
        })
        .catch(() => {})
    })

    return () => {
      unsubscribe
        .then((fn) => {
          return fn()
        })
        .catch(() => {})
    }
  }, [transport, conversationId, queryClient])

  const messages = isConnected && conversationId ? (messagesQuery.data ?? []) : []
  const isLoading = isConnected && (conversationsQuery.isLoading || messagesQuery.isLoading)
  const error = isConnected ? formatChatError(conversationsQuery.error ?? messagesQuery.error) : null
  const getConversationForFriend = (friendId: Puuid, friendName?: string) => {
    return findConversationForFriend(conversations, friendId, friendName)
  }

  return {
    conversations,
    error,
    getConversationForFriend,
    isLoading,
    messages,
  }
}
