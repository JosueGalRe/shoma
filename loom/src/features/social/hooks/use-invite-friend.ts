import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { lobbyDescriptor, sentInvitesDescriptor } from '@/core/lcu/lcu-queries'
import { RelayClientState } from '@/core/relay/relay-client'
import { useSharedLCUTransport, useSharedRelayClient } from '@/core/relay/relay-client-provider'
import type { SummonerId } from '@/core/types/branded'
import { LcuHttpMethod, LcuPaths } from '@shoma/protocol-contract'

import { type Friend, setSocialInviteToLobbyHandler, useSocialStore } from '../social-store'

export function useInviteFriendToLobby() {
  const setError = useSocialStore((state) => state.setError)
  const queryClient = useQueryClient()
  const { state: relayState } = useSharedRelayClient()
  const transport = useSharedLCUTransport()
  const inviteMutation = useMutation({
    mutationFn: async (summonerId: SummonerId) => {
      if (!transport) {
        throw new Error('No transport')
      }

      const result = await transport.request(LcuPaths.lobby.invitations, LcuHttpMethod.POST, { toSummonerId: summonerId })
      if (result.status < 200 || result.status >= 300) {
        throw new Error(`LCU invite failed (${result.status})`)
      }

      return result
    },
    onSuccess: async () => {
      setError(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: lobbyDescriptor.queryKey }),
        queryClient.invalidateQueries({ queryKey: sentInvitesDescriptor.queryKey }),
      ])
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unable to invite friend to lobby.'
      setError(`Unable to invite friend to lobby: ${message}`)
    },
  })

  /* eslint-disable react-doctor/no-cascading-set-state -- setSocialInviteToLobbyHandler and setError are orthogonal store actions triggered by a single external event */
  useEffect(() => {
    if (!transport || relayState !== RelayClientState.CONNECTED) {
      setSocialInviteToLobbyHandler(null)
      return () => setSocialInviteToLobbyHandler(null)
    }

    setSocialInviteToLobbyHandler((friend: Friend) => {
      inviteMutation.mutate(friend.summonerId)
    })

    return () => setSocialInviteToLobbyHandler(null)
  }, [inviteMutation, relayState, transport])

  return inviteMutation
}
