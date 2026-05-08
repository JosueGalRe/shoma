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
  getConversationForFriend: (friendId: Puuid, friendName?: string) => { id: string } | undefined
  isLoading: boolean
  messages: LcuConversationMessage[]
}

function preferChatConversation(conversations: LcuConversation[]): LcuConversation | undefined {
  return conversations.find((item) => item.type === 'chat') ?? conversations[0]
}

function puuidMatch(friendId: string, participantId: string): boolean {
  // Handles mismatched formats: puuid@region vs bare puuid
  const friendNormalized = friendId.split('@')[0]!.toLowerCase()
  const participantNormalized = participantId.split('@')[0]!.toLowerCase()
  return friendNormalized === participantNormalized || friendId === participantId
}

export function findConversationForFriend(
  conversations: LcuConversation[],
  friendId: Puuid,
  friendName?: string,
): { id: string } | undefined {
  // DEBUG: lightweight log to avoid virtual console forward crash
  // eslint-disable-next-line no-console
  console.log('[Mimic Chat Debug] friendId:', friendId, '| friendName:', friendName, '| convs:', conversations.length)
  conversations.forEach((c, i) => {
    // eslint-disable-next-line no-console
    console.log(`[Mimic Chat Debug] conv[${i}] id=${c.id} type=${c.type} puuids=[${c.participantPuuids.join(', ')}] names=[${c.participantNames.join(', ')}]`)
  })

  const idOneToOneMatches = conversations.filter(
    (item) => item.participantPuuids.some((pid) => puuidMatch(friendId, pid)) && item.participantPuuids.length <= 2,
  )
  // eslint-disable-next-line no-console
  console.log('[Mimic Chat Debug] idOneToOneMatches:', idOneToOneMatches.map((c) => c.id).join(', ') || 'none')

  const conversation = preferChatConversation(idOneToOneMatches)
    ?? (friendName
      ? preferChatConversation(conversations.filter(
        (item) => item.participantNames.includes(friendName) && item.participantPuuids.length <= 2,
      ))
      : undefined)
    ?? preferChatConversation(conversations.filter((item) => item.participantPuuids.some((pid) => puuidMatch(friendId, pid))))
    ?? (friendName
      ? preferChatConversation(conversations.filter((item) => item.participantNames.includes(friendName)))
      : undefined)

  // eslint-disable-next-line no-console
  console.log('[Mimic Chat Debug] resolved:', conversation?.id ?? 'null')

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
  // DEBUG: see what the LCU actually returns
  // eslint-disable-next-line no-console
  console.log('[Mimic Chat Debug] raw conversations from LCU', conversations)

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
  const getConversationForFriend = (friendId: Puuid, friendName?: string) => findConversationForFriend(conversations, friendId, friendName)

  return {
    conversations,
    error,
    getConversationForFriend,
    isLoading,
    messages,
  }
}
