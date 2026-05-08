import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LcuHttpMethod, LcuPaths } from '@mimic/protocol-contract'

import { conversationMessagesDescriptor } from '@/core/lcu/lcu-queries'
import { useSharedLCUTransport } from '@/core/rift/rift-client-provider'

import { useSocialStore } from '../social-store'

export function useSendChatMessage() {
  const setError = useSocialStore((state) => state.setError)
  const queryClient = useQueryClient()
  const transport = useSharedLCUTransport()

  return useMutation({
    mutationFn: async ({ conversationId, body }: { body: string; conversationId: string }) => {
      if (!transport) {
        throw new Error('No transport')
      }

      const result = await transport.request(LcuPaths.social.conversationMessages(conversationId), LcuHttpMethod.POST, { body, type: 'chat' })
      if (result.status < 200 || result.status >= 300) {
        throw new Error(`LCU send failed (${result.status})`)
      }

      return result
    },
    onSuccess: async (_, variables) => {
      setError(null)
      await queryClient.invalidateQueries({
        queryKey: [...conversationMessagesDescriptor(variables.conversationId).queryKey],
      })
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unable to send message.'
      setError(`Unable to send message: ${message}`)
    },
  })
}
