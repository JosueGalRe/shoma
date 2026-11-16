import { LcuHttpMethod, LcuPaths } from '@shoma/protocol-contract'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { conversationMessagesDescriptor, conversationsDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

interface SendChatMessageVariables {
  body: string
  conversationId: string
  // A friend's first message: the client opens the 1:1 conversation (its id is the friend's pid) before writing to it
  isNew?: boolean
}

export function useSendChatMessage() {
  const queryClient = useQueryClient()
  const transport = useSharedLCUTransport()

  return useMutation({
    mutationFn: async ({ body, conversationId, isNew = false }: SendChatMessageVariables) => {
      if (!transport) {
        throw new Error('No transport')
      }

      if (isNew) {
        const opened = await transport.request(LcuPaths.social.conversations, LcuHttpMethod.POST, {
          id: conversationId,
          type: 'chat',
        })

        if (opened.status < 200 || opened.status >= 300) {
          throw new Error(`LCU open conversation failed (${opened.status})`)
        }
      }

      const path = LcuPaths.social.conversationMessages(conversationId)
      const result = await transport.request(path, LcuHttpMethod.POST, { body, type: 'chat' })

      if (result.status < 200 || result.status >= 300) {
        throw new Error(`LCU send failed (${result.status})`)
      }

      return result
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...conversationMessagesDescriptor(variables.conversationId).queryKey] }),
        queryClient.invalidateQueries({ queryKey: conversationsDescriptor.queryKey }),
      ])
    },
  })
}
