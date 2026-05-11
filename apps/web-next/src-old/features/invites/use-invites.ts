import { LcuHttpMethod } from '@mimic/protocol-contract'
import { useCallback, useEffect } from 'react'

import { useLCUObserver, useLCURequest } from '@core/rift/hooks'
import { createLCUClient } from '@core/rift/lcu-transport'
import { invitesRequestPaths, type LobbyInvite, useInvitesStore } from './invites-store'

const lcuClient = createLCUClient({ connectOnCreate: false })

export type UseInvitesResult = {
  acceptInvite: (inviteId: string) => Promise<boolean>
  declineInvite: (inviteId: string) => Promise<boolean>
  error: Error | null
  invites: LobbyInvite[]
  isLoading: boolean
}

function assertSuccessfulInviteResponse(path: string, status: number): void {
  if (status < 200 || status >= 300) {
    throw new Error(`LCU request failed (${status}): ${path}`)
  }
}

export function useInvites(): UseInvitesResult {
  const observedInvites = useLCUObserver<LobbyInvite[]>(invitesRequestPaths.observer)
  const initialInvitesRequest = useLCURequest<LobbyInvite[]>(invitesRequestPaths.observer, LcuHttpMethod.GET)
  const {
    acceptInvite: commitAcceptInvite,
    declineInvite: commitDeclineInvite,
    error: storeError,
    isLoading: storeLoading,
    pendingInvites,
    removeExpiredInvites,
    setError,
    setInvites,
    setLoading,
  } = useInvitesStore()

  useEffect(() => {
    setLoading(observedInvites.isLoading || initialInvitesRequest.isLoading)
  }, [initialInvitesRequest.isLoading, observedInvites.isLoading, setLoading])

  useEffect(() => {
    if (initialInvitesRequest.data) {
      setInvites(initialInvitesRequest.data)
    }
  }, [initialInvitesRequest.data, setInvites])

  useEffect(() => {
    if (observedInvites.data) {
      setInvites(observedInvites.data)
    }
  }, [observedInvites.data, setInvites])

  useEffect(() => {
    const observerError = observedInvites.error ?? initialInvitesRequest.error
    if (observerError) {
      setError(observerError)
    }
  }, [initialInvitesRequest.error, observedInvites.error, setError])

  useEffect(() => {
    const expirationId = window.setInterval(() => {
      removeExpiredInvites()
    }, 1000)

    return () => {
      window.clearInterval(expirationId)
    }
  }, [removeExpiredInvites])

  const acceptInvite = useCallback(
    (inviteId: string) => {
      return commitAcceptInvite(inviteId, async (invite) => {
        const path = invitesRequestPaths.accept(invite.invitationId)
        const result = await lcuClient.request(path, LcuHttpMethod.POST)
        assertSuccessfulInviteResponse(path, result.status)
        initialInvitesRequest.refetch()
      })
    },
    [commitAcceptInvite, initialInvitesRequest],
  )

  const declineInvite = useCallback(
    (inviteId: string) => {
      return commitDeclineInvite(inviteId, async (invite) => {
        const path = invitesRequestPaths.decline(invite.invitationId)
        const result = await lcuClient.request(path, LcuHttpMethod.POST)
        assertSuccessfulInviteResponse(path, result.status)
        initialInvitesRequest.refetch()
      })
    },
    [commitDeclineInvite, initialInvitesRequest],
  )

  return {
    acceptInvite,
    declineInvite,
    error: observedInvites.error ?? initialInvitesRequest.error ?? storeError,
    invites: pendingInvites,
    isLoading: observedInvites.isLoading || initialInvitesRequest.isLoading || storeLoading,
  }
}
