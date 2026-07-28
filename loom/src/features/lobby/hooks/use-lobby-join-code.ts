import { useState } from 'react'

import { LcuHttpMethod, LcuPaths } from '@shoma/protocol-contract'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { boolean, object, string } from 'valibot'

import { createLcuQueryOptions, type LcuQueryDescriptor } from '@/core/lcu/lcu-queries'
import { finiteNumber, parseObjectOrNull, parseOrNull } from '@/core/lcu/parsers/base'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

const agsActivityIdDescriptor = {
  parse: (content: unknown) => {
    return parseOrNull(string(), content)
  },
  path: LcuPaths.lobby.agsActivityId,
  queryKey: ['lcu', 'lobby', 'ags-activity-id'] as const,
} satisfies LcuQueryDescriptor<string>

const JoinCodeSchema = object({
  expiresAt: finiteNumber,
  isActive: boolean(),
  joinCode: string(),
  smartUrl: string(),
})

export type ShareInviteResult = 'cancelled' | 'copied' | 'shared'

export function useLobbyJoinCode() {
  const transport = useSharedLCUTransport()
  const queryClient = useQueryClient()
  const activityIdQuery = useQuery(createLcuQueryOptions(agsActivityIdDescriptor, transport))
  const [copied, setCopied] = useState(false)

  const joinCodeMutation = useMutation({
    mutationFn: async () => {
      if (!transport) {
        throw new Error('No transport')
      }

      const activityId = activityIdQuery.data

      if (!activityId) {
        throw new Error('No lobby activity')
      }

      const result = await transport.request(LcuPaths.lobby.agsJoinCode(activityId), LcuHttpMethod.POST)
      const code = parseObjectOrNull(JoinCodeSchema, result.content)

      if (!code) {
        throw new Error('Failed to generate the invite link')
      }

      return code
    },
    onSuccess: (code) => {
      queryClient.setQueryData(['lcu', 'lobby', 'join-code'], code)
    },
  })

  const share = async (): Promise<ShareInviteResult> => {
    const code = joinCodeMutation.data ?? (await joinCodeMutation.mutateAsync())

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ url: code.smartUrl })

        return 'shared'
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return 'cancelled'
        }
      }
    }

    await navigator.clipboard.writeText(code.smartUrl)
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 2000)

    return 'copied'
  }

  return {
    copied,
    isSharing: joinCodeMutation.isPending,
    share,
  }
}
