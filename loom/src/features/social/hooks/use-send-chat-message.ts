import { LcuHttpMethod, LcuPaths } from '@shoma/protocol-contract'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { conversationMessagesDescriptor } from '@/core/lcu/lcu-queries'
import { useSharedLCUTransport } from '@/core/relay/relay-client-provider'

import { useSocialStore } from '../social-store'

export function useSendChatMessage() {
  const setError = useSocialStore((state) => {
    return state.setError
  })
  const queryClient = useQueryClient()
  const transport = useSharedLCUTransport()

  return useMutation({
    mutationFn: async ({ conversationId, body }: { body: string; conversationId: string }) => {
      if (!transport) {
        throw new Error('No transport')
      }

      const path = LcuPaths.social.conversationMessages(conversationId)

      // eslint-disable-next-line no-console
      console.log('[Mimic Chat] Sending message:', { body, conversationId, path })

      const result = await transport.request(path, LcuHttpMethod.POST, { body, type: 'chat' })

      // eslint-disable-next-line no-console
      console.log('[Mimic Chat] Send result:', { content: result.content, conversationId, status: result.status })

      if (result.status < 200 || result.status >= 300) {
        throw new Error(`LCU send failed (${result.status})`)
      }

      return result
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unable to send message.'

      setError(`Unable to send message: ${message}`)
    },
    onSuccess: async (_, variables) => {
      setError(null)

      await queryClient.invalidateQueries({
        queryKey: [...conversationMessagesDescriptor(variables.conversationId).queryKey],
      })
    },
  })
}
