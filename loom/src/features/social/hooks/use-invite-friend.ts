import { useEffect } from 'react'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LcuHttpMethod, LcuPaths } from '@mimic/protocol-contract'

import { lobbyDescriptor, sentInvitesDescriptor } from '@/core/lcu/lcu-queries'
import { RiftClientState } from '@/core/rift/rift-client'
import { useSharedLCUTransport, useSharedRiftClient } from '@/core/rift/rift-client-provider'
import type { SummonerId } from '@/core/types/branded'

import { type Friend, setSocialInviteToLobbyHandler, useSocialStore } from '../social-store'

export function useInviteFriendToLobby() {
  const setError = useSocialStore((state) => state.setError)
  const queryClient = useQueryClient()
  const { state: riftState } = useSharedRiftClient()
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

  // External system sync: Global invite handler registration
  useEffect(() => {
    if (!transport || riftState !== RiftClientState.CONNECTED) {
      setSocialInviteToLobbyHandler(null)
      return () => setSocialInviteToLobbyHandler(null)
    }

    setSocialInviteToLobbyHandler((friend: Friend) => {
      inviteMutation.mutate(friend.summonerId)
    })

    return () => setSocialInviteToLobbyHandler(null)
  }, [inviteMutation, riftState, setError, transport])

  return inviteMutation
}
