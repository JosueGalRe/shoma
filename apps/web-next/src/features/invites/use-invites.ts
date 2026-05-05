import { useCallback, useMemo } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { LcuHttpMethod, LcuPaths } from '@mimic/protocol-contract'

import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { createLcuQueryOptions, invitesDescriptor } from '@/core/lcu/lcu-queries'
import { useLCUTransport, useRiftClient } from '@/core/rift'
import { useRiftStore } from '@/core/state/rift-store'

import { type Invite } from './invites-store'

type UseInvitesResult = {
  acceptInvite: (id: string) => Promise<boolean>
  declineInvite: (id: string) => Promise<boolean>
  error: Error | null
  invites: Invite[]
  isLoading: boolean
}

const receivedInvitationsQueryKey = ['lcu', LcuPaths.lobby.receivedInvitations] as const

async function mutateReceivedInvite(
  transport: NonNullable<ReturnType<typeof useLCUTransport>>,
  invitationId: string,
  pathFactory: (inviteId: string) => string,
) {
  const result = await transport.request(pathFactory(invitationId), LcuHttpMethod.POST)

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`LCU request failed (${result.status}): ${pathFactory(invitationId)}`)
  }

  return result
}

export function useInvites(): UseInvitesResult {
  const code = useRiftStore((state) => state.code)
  const clientOptions = useMemo(() => ({ code, enabled: code.length > 0 }), [code])
  const { client } = useRiftClient(clientOptions)
  const transport = useLCUTransport(client)
  const queryClient = useQueryClient()

  const invitesQuery = useQuery(createLcuQueryOptions(invitesDescriptor, transport))
  useLcuObserverSync(invitesDescriptor, transport)
  const acceptInviteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      if (!transport) {
        throw new Error('No transport')
      }

      return mutateReceivedInvite(transport, invitationId, (inviteId) => LcuPaths.lobby.receivedInvitationAccept(inviteId))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: receivedInvitationsQueryKey })
    },
  })
  const declineInviteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      if (!transport) {
        throw new Error('No transport')
      }

      return mutateReceivedInvite(transport, invitationId, (inviteId) => LcuPaths.lobby.receivedInvitationDecline(inviteId))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: receivedInvitationsQueryKey })
    },
  })
  const invites = invitesQuery.data ?? []

  const acceptInvite = useCallback(
    async (id: string) => {
      if (!transport || acceptInviteMutation.isPending) {
        return false
      }

      try {
        await acceptInviteMutation.mutateAsync(id)
        return true
      } catch {
        return false
      }
    },
    [acceptInviteMutation, transport],
  )

  const declineInvite = useCallback(
    async (id: string) => {
      if (!transport || declineInviteMutation.isPending) {
        return false
      }

      try {
        await declineInviteMutation.mutateAsync(id)
        return true
      } catch {
        return false
      }
    },
    [declineInviteMutation, transport],
  )

  return {
    acceptInvite,
    declineInvite,
    error: invitesQuery.error,
    invites,
    isLoading: invitesQuery.isLoading,
  }
}
