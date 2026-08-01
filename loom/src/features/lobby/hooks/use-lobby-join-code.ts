import { useState } from 'react'

import { LcuHttpMethod, LcuPaths } from '@shoma/protocol-contract'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { boolean, object, string } from 'valibot'

import { finiteNumber, parseObjectOrNull, parseOrNull } from '@/core/lcu/parsers/base'
import { createLcuQueryOptions, type LcuQueryDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

const ActivityIdRecordSchema = object({
  activityId: string(),
})

function parseActivityId(content: unknown): string | null {
  const direct = parseOrNull(string(), content)

  if (direct) {
    return direct
  }

  const nested = parseObjectOrNull(ActivityIdRecordSchema, content)

  return nested?.activityId ?? null
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

// The AGS activity is published server-side after lobby creation, so it can lag the first share attempt.
async function fetchActivityIdWithRetry(
  refetch: () => Promise<{ data?: string | null }>,
  attemptsLeft = 3,
): Promise<string | null> {
  const { data } = await refetch()

  if (data || attemptsLeft <= 1) {
    return data ?? null
  }

  await delay(750)

  return fetchActivityIdWithRetry(refetch, attemptsLeft - 1)
}

const agsActivityIdDescriptor = {
  parse: parseActivityId,
  path: LcuPaths.lobby.agsActivityId,
  queryKey: ['lcu', 'lobby', 'ags-activity-id'] as const,
} satisfies LcuQueryDescriptor<string>

const JoinCodeSchema = object({
  expiresAt: finiteNumber,
  isActive: boolean(),
  joinCode: string(),
  smartUrl: string(),
})

export type ShareInviteResult = 'cancelled' | 'copied' | 'error' | 'shared'

export function useLobbyJoinCode() {
  const transport = useSharedLCUTransport()
  const queryClient = useQueryClient()
  const activityIdQuery = useQuery(createLcuQueryOptions(agsActivityIdDescriptor, transport))
  const activityId = activityIdQuery.data ?? null
  // Prefetch the existing join code so the native share sheet can fire inside the click's user-activation window.
  const joinCodeQuery = useQuery({
    enabled: Boolean(transport && activityId),
    queryFn: async () => {
      if (!transport || !activityId) {
        return null
      }

      const result = await transport.request(LcuPaths.lobby.agsJoinCode(activityId)).catch(() => {
        return null
      })

      return result ? parseObjectOrNull(JoinCodeSchema, result.content) : null
    },
    queryKey: ['lcu', 'lobby', 'join-code', activityId] as const,
    staleTime: 60_000,
  })
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)

  const joinCodeMutation = useMutation({
    mutationFn: async () => {
      if (!transport) {
        throw new Error('No transport')
      }

      const freshActivityId = await fetchActivityIdWithRetry(() => {
        return activityIdQuery.refetch()
      })

      if (!freshActivityId) {
        throw new Error('No lobby activity yet — try again in a moment')
      }

      const joinCodePath = LcuPaths.lobby.agsJoinCode(freshActivityId)
      const existing = await transport.request(joinCodePath).catch(() => {
        return null
      })
      let code = existing ? parseObjectOrNull(JoinCodeSchema, existing.content) : null

      if (!code) {
        const created = await transport.request(joinCodePath, LcuHttpMethod.POST)

        code = parseObjectOrNull(JoinCodeSchema, created.content)
      }

      if (!code) {
        throw new Error('Failed to generate the invite link')
      }

      return code
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ['lcu', 'lobby', 'join-code'] })
    },
  })

  const share = async (): Promise<ShareInviteResult> => {
    try {
      const code = joinCodeQuery.data ?? joinCodeMutation.data ?? (await joinCodeMutation.mutateAsync())

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
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[Sho'ma] Failed to share lobby invite link:", error)

      setFailed(true)

      setTimeout(() => {
        setFailed(false)
      }, 2000)

      return 'error'
    }
  }

  return {
    copied,
    failed,
    isSharing: joinCodeMutation.isPending,
    share,
  }
}
