import { useEffect } from 'react'

import { LcuHttpMethod, LcuPaths } from '@shoma/protocol-contract'
import { useQueryClient } from '@tanstack/react-query'

import { conversationsDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import type { LcuConversation } from '@/core/lcu/parsers'

// The chat on screen is the client's active conversation, which the LCU doesn't count unread; the desktop's chat
// Window does the same PUT when it shows one, and the DELETE when it shows none
export function useActiveConversation(conversationId: string | undefined) {
  const transport = useSharedLCUTransport()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!transport || !conversationId) {
      return undefined
    }

    // Clears its badge at once, as the client does before its PUT
    queryClient.setQueryData(conversationsDescriptor.queryKey, (conversations: LcuConversation[] | undefined) => {
      return conversations?.map((conversation) => {
        return conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
      })
    })

    transport.request(LcuPaths.social.activeConversation, LcuHttpMethod.PUT, { id: conversationId }).catch(() => {})

    return () => {
      transport.request(LcuPaths.social.activeConversation, LcuHttpMethod.DELETE).catch(() => {})
    }
  }, [conversationId, queryClient, transport])
}
