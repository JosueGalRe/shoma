import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import {
  conversationMessagesDescriptor,
  conversationsDescriptor,
  createLcuQueryOptions,
} from '@/core/lcu/lcu-queries'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import type { LcuConversation, LcuConversationMessage } from '@/core/lcu/parsers'
import { RiftClientState } from '@/core/rift/rift-client'
import { useSharedLCUTransport, useSharedRiftClient } from '@/core/rift/rift-client-provider'
import type { Puuid } from '@/core/types/branded'

export type UseChatLCUResult = {
  conversations: LcuConversation[]
  error: string | null
  getConversationForFriend: (friendId: Puuid) => { id: string } | undefined
  isLoading: boolean
  messages: LcuConversationMessage[]
}

export function findConversationForFriend(
  conversations: LcuConversation[],
  friendId: Puuid,
): { id: string } | undefined {
  const conversation = conversations.find(
    (item) => item.type === 'chat' && item.participantPuuids.includes(friendId),
  )

  return conversation ? { id: conversation.id } : undefined
}

function formatChatError(error: Error | null): string | null {
  return error ? `Unable to load League chat: ${error.message}` : null
}

export function useChatLCU(selectedFriendId: Puuid | null): UseChatLCUResult {
  const transport = useSharedLCUTransport()
  const { state: riftState } = useSharedRiftClient()
  const isConnected = riftState === RiftClientState.CONNECTED

  const conversationsQuery = useQuery(createLcuQueryOptions(conversationsDescriptor, transport))
  useLcuObserverSync(conversationsDescriptor, transport)

  const conversations = isConnected ? (conversationsQuery.data ?? []) : []
  const selectedConversation = selectedFriendId
    ? findConversationForFriend(conversations, selectedFriendId)
    : undefined
  const conversationId = selectedConversation?.id

  const messagesDescriptor = useMemo(
    () => conversationMessagesDescriptor(conversationId ?? ''),
    [conversationId],
  )

  const messagesQuery = useQuery({
    ...createLcuQueryOptions(messagesDescriptor, transport),
    enabled: !!conversationId,
  })

  useLcuObserverSync(messagesDescriptor, conversationId ? transport : null)

  const messages = isConnected && conversationId ? (messagesQuery.data ?? []) : []
  const isLoading = isConnected && (conversationsQuery.isLoading || messagesQuery.isLoading)
  const error = isConnected ? formatChatError(conversationsQuery.error ?? messagesQuery.error) : null
  const getConversationForFriend = (friendId: Puuid) => findConversationForFriend(conversations, friendId)

  return {
    conversations,
    error,
    getConversationForFriend,
    isLoading,
    messages,
  }
}
