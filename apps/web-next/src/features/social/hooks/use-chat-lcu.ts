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
    ? conversations.find((conversation) => conversation.type === 'chat' && conversation.participantPuuids.includes(selectedFriendId))
    : undefined
  const conversationId = selectedConversation?.id

  const messagesQuery = useQuery({
    ...createLcuQueryOptions(conversationMessagesDescriptor(conversationId ?? ''), transport),
    enabled: !!conversationId,
  })

  useLcuObserverSync(conversationMessagesDescriptor(conversationId ?? ''), transport)

  const messages = isConnected && conversationId ? (messagesQuery.data ?? []) : []
  const isLoading = isConnected && (conversationsQuery.isLoading || messagesQuery.isLoading)
  const error = isConnected ? formatChatError(conversationsQuery.error ?? messagesQuery.error) : null
  const getConversationForFriend = (friendId: Puuid) =>
    conversations.find((conversation) => conversation.type === 'chat' && conversation.participantPuuids.includes(friendId))

  return {
    conversations,
    error,
    getConversationForFriend,
    isLoading,
    messages,
  }
}
