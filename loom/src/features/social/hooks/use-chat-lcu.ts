import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { conversationMessagesDescriptor, conversationsDescriptor, createLcuQueryOptions } from '@/core/lcu/lcu-queries'
import type { LcuConversation } from '@/core/lcu/parsers';
import type { LcuConversationMessage } from '@/core/lcu/parsers';
import { RelayClientState } from '@/core/relay/relay-client'
import { useSharedLCUTransport, useSharedRelayClient } from '@/core/relay/relay-client-provider'
import type { Puuid } from '@/core/types/branded'
import { LcuPaths } from '@shoma/protocol-contract'

export type UseChatLCUResult = {
  conversations: LcuConversation[]
  error: string | null
  getConversationForFriend: (friendId: Puuid, friendName?: string) => { id: string } | undefined
  isLoading: boolean
  messages: LcuConversationMessage[]
}

function preferChatConversation(conversations: LcuConversation[]): LcuConversation | undefined {
  return conversations.find((item) => { return item.type === 'chat'; }) ?? conversations[0]
}

function puuidMatch(friendId: string, participantId: string): boolean {
  // Handles mismatched formats: puuid@region vs bare puuid
  const [friendNormalized = ''] = friendId.split('@')
  const [participantNormalized = ''] = participantId.split('@')
  return friendNormalized === participantNormalized || friendId === participantId
}

export function findConversationForFriend(
  conversations: LcuConversation[],
  friendId: Puuid,
  friendName?: string,
): { id: string } | undefined {
  const idOneToOneMatches = conversations.filter(
    (item) => { return item.participantPuuids.some((pid) => { return puuidMatch(friendId, pid); }) && item.participantPuuids.length <= 2; },
  )

  const conversation =
    preferChatConversation(idOneToOneMatches) ??
    (friendName
      ? preferChatConversation(
          conversations.filter((item) => { return item.participantNames.includes(friendName) && item.participantPuuids.length <= 2; }),
        )
      : undefined) ??
    preferChatConversation(conversations.filter((item) => { return item.participantPuuids.some((pid) => {return puuidMatch(friendId, pid)}); })) ??
    (friendName
      ? preferChatConversation(conversations.filter((item) => { return item.participantNames.includes(friendName); }))
      : undefined) ??
    // Fallback: some LCU versions use the friend's PUUID as the conversation id with empty participants
    preferChatConversation(conversations.filter((item) => { return puuidMatch(friendId, item.id); }))

  return conversation ? { id: conversation.id } : undefined
}

function formatChatError(error: Error | null): string | null {
  return error ? `Unable to load League chat: ${error.message}` : null
}

export function useChatLCU(selectedFriendId: Puuid | null): UseChatLCUResult {
  const transport = useSharedLCUTransport()
  const { state: relayState } = useSharedRelayClient()
  const isConnected = relayState === RelayClientState.CONNECTED
  const queryClient = useQueryClient()

  const conversationsQuery = useQuery(createLcuQueryOptions(conversationsDescriptor, transport))
  useLcuObserverSync(conversationsDescriptor, transport)

  const conversations = isConnected ? (conversationsQuery.data ?? []) : []
  const selectedConversation = selectedFriendId ? findConversationForFriend(conversations, selectedFriendId) : undefined
  const conversationId = selectedConversation?.id

  const messagesDescriptor = useMemo(() => { return conversationMessagesDescriptor(conversationId ?? ''); }, [conversationId])

  const messagesQuery = useQuery({
    ...createLcuQueryOptions(messagesDescriptor, transport),
    enabled: !!conversationId,
  })

  useLcuObserverSync(messagesDescriptor, conversationId ? transport : null)

  // Observe individual message events (e.g. /messages/{id}) to invalidate the list
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
      unsubscribe.then((fn) => { return fn(); }).catch(() => {})
    }
  }, [transport, conversationId, queryClient])

  const messages = isConnected && conversationId ? (messagesQuery.data ?? []) : []
  const isLoading = isConnected && (conversationsQuery.isLoading || messagesQuery.isLoading)
  const error = isConnected ? formatChatError(conversationsQuery.error ?? messagesQuery.error) : null
  const getConversationForFriend = (friendId: Puuid, friendName?: string) => { return findConversationForFriend(conversations, friendId, friendName); }

  return {
    conversations,
    error,
    getConversationForFriend,
    isLoading,
    messages,
  }
}
