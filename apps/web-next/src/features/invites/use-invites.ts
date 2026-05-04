import { useCallback, useEffect, useMemo, useState } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useAcceptInvite, useDeclineInvite } from '@/core/lcu/lcu-mutations'
import { createLcuQueryOptions, invitesDescriptor } from '@/core/lcu/lcu-queries'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { useLCUTransport, useRiftClient } from '@/core/rift'
import { useRiftStore } from '@/core/state/rift-store'
import { notify } from '@/features/notifications/notification-manager'

import { type Invite, useInvitesStore } from './invites-store'

type UseInvitesResult = {
  acceptInvite: (id: string) => Promise<boolean>
  declineInvite: (id: string) => Promise<boolean>
  error: Error | null
  invites: Invite[]
  isLoading: boolean
}

type PendingInviteMutation = {
  id: string
  resolve: (accepted: boolean) => void
}

export function useInvites(): UseInvitesResult {
  const code = useRiftStore((state) => state.code)
  const clientOptions = useMemo(() => ({ code, enabled: code.length > 0 }), [code])
  const { client } = useRiftClient(clientOptions)
  const transport = useLCUTransport(client)
  const queryClient = useQueryClient()
  const [pendingAccept, setPendingAccept] = useState<PendingInviteMutation | null>(null)
  const [pendingDecline, setPendingDecline] = useState<PendingInviteMutation | null>(null)

  const invitesQuery = useQuery(createLcuQueryOptions(invitesDescriptor, transport))
  useLcuObserverSync(invitesDescriptor, transport)
  const acceptInviteMutation = useAcceptInvite(transport, queryClient, pendingAccept?.id ?? '')
  const declineInviteMutation = useDeclineInvite(transport, queryClient, pendingDecline?.id ?? '')
  const invites = useInvitesStore((state) => state.invites)
  const addInvite = useInvitesStore((state) => state.addInvite)
  const acceptInviteInStore = useInvitesStore((state) => state.acceptInvite)
  const declineInviteInStore = useInvitesStore((state) => state.declineInvite)
  const removeInvite = useInvitesStore((state) => state.removeInvite)

  useEffect(() => {
    const nextInvites: Invite[] = invitesQuery.data ?? []
    const nextIds = new Set(nextInvites.map((invite) => invite.id))
    const currentIds = new Set(invites.map((invite) => invite.id))

    nextInvites.forEach((invite) => {
      if (!currentIds.has(invite.id)) {
        notify('invite-received', { inviterName: invite.inviterName })
      }

      addInvite(invite)
    })

    invites.forEach((invite) => {
      if (!nextIds.has(invite.id)) {
        removeInvite(invite.id)
      }
    })
  }, [addInvite, invites, invitesQuery.data, removeInvite])

  useEffect(() => {
    if (!pendingAccept) {
      return
    }

    acceptInviteMutation
      .mutateAsync()
      .then(() => {
        acceptInviteInStore(pendingAccept.id)
        pendingAccept.resolve(true)
      })
      .catch(() => pendingAccept.resolve(false))
      .finally(() => setPendingAccept(null))
  }, [acceptInviteInStore, acceptInviteMutation, pendingAccept])

  useEffect(() => {
    if (!pendingDecline) {
      return
    }

    declineInviteMutation
      .mutateAsync()
      .then(() => {
        declineInviteInStore(pendingDecline.id)
        pendingDecline.resolve(true)
      })
      .catch(() => pendingDecline.resolve(false))
      .finally(() => setPendingDecline(null))
  }, [declineInviteInStore, declineInviteMutation, pendingDecline])

  const acceptInvite = useCallback(
    async (id: string) => {
      if (!transport) {
        return false
      }

      return new Promise<boolean>((resolve) => {
        setPendingAccept({ id, resolve })
      })
    },
    [transport],
  )

  const declineInvite = useCallback(
    async (id: string) => {
      if (!transport) {
        return false
      }

      return new Promise<boolean>((resolve) => {
        setPendingDecline({ id, resolve })
      })
    },
    [transport],
  )

  return {
    acceptInvite,
    declineInvite,
    error: invitesQuery.error,
    invites,
    isLoading: invitesQuery.isLoading,
  }
}
