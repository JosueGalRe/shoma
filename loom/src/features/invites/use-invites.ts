import { useCallback, useRef } from 'react'

import { LcuHttpMethod, LcuPaths } from '@shoma/protocol-contract'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { createLcuQueryOptions, invitesDescriptor } from '@/core/lcu/lcu-queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import type { UseInvitesResult } from './invites-types'
import type { LcuTransport } from '@/core/relay/lcu-transport'
import type { InvitationId } from '@/core/types/branded'

export type { UseInvitesResult } from './invites-types'

async function mutateReceivedInvite(
  transport: NonNullable<LcuTransport>,
  invitationId: InvitationId,
  pathFactory: (inviteId: InvitationId) => string,
) {
  const result = await transport.request(pathFactory(invitationId), LcuHttpMethod.POST)

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`LCU request failed (${result.status}): ${pathFactory(invitationId)}`)
  }

  return result
}

export function useInvites(): UseInvitesResult {
  const transport = useSharedLCUTransport()
  const queryClient = useQueryClient()

  const invitesQuery = useQuery(createLcuQueryOptions(invitesDescriptor, transport))

  useLcuObserverSync(invitesDescriptor, transport)

  const acceptInviteMutation = useMutation({
    mutationFn: async (invitationId: InvitationId) => {
      if (!transport) {
        throw new Error('No transport')
      }

      return mutateReceivedInvite(transport, invitationId, (inviteId) => {
        return LcuPaths.lobby.receivedInvitationAccept(inviteId)
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invitesDescriptor.queryKey })
    },
  })
  const declineInviteMutation = useMutation({
    mutationFn: async (invitationId: InvitationId) => {
      if (!transport) {
        throw new Error('No transport')
      }

      return mutateReceivedInvite(transport, invitationId, (inviteId) => {
        return LcuPaths.lobby.receivedInvitationDecline(inviteId)
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invitesDescriptor.queryKey })
    },
  })
  const invites = invitesQuery.data ?? []
  const isAcceptingInviteRef = useRef(false)
  const isDecliningInviteRef = useRef(false)

  const acceptInvite = useCallback(
    async (id: InvitationId) => {
      if (!transport || isAcceptingInviteRef.current) {
        return false
      }

      isAcceptingInviteRef.current = true

      try {
        await acceptInviteMutation.mutateAsync(id)

        return true
      } catch {
        return false
      } finally {
        isAcceptingInviteRef.current = false
      }
    },
    [acceptInviteMutation, transport],
  )

  const declineInvite = useCallback(
    async (id: InvitationId) => {
      if (!transport || isDecliningInviteRef.current) {
        return false
      }

      isDecliningInviteRef.current = true

      try {
        await declineInviteMutation.mutateAsync(id)

        return true
      } catch {
        return false
      } finally {
        isDecliningInviteRef.current = false
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
