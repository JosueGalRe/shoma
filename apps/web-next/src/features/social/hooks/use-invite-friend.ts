import { useEffect, useMemo } from 'react'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LcuHttpMethod, LcuPaths } from '@mimic/protocol-contract'

import { useLCUTransport, useRiftClient } from '@/core/rift'
import { useRiftStore } from '@/core/state/rift-store'

import { type Friend, setSocialInviteToLobbyHandler, useSocialStore } from '../social-store'

const lobbyQueryKey = ['lcu', LcuPaths.lobby.lobby] as const
const invitationsQueryKey = ['lcu', LcuPaths.lobby.invitations] as const

export function useInviteFriendToLobby() {
  const code = useRiftStore((state) => state.code)
  const riftStatus = useRiftStore((state) => state.status)
  const setError = useSocialStore((state) => state.setError)
  const queryClient = useQueryClient()
  const clientOptions = useMemo(
    () => ({
      code,
      enabled: code.length > 0 && riftStatus === 'connected',
    }),
    [code, riftStatus],
  )
  const { client } = useRiftClient(clientOptions)
  const transport = useLCUTransport(client)
  const inviteMutation = useMutation({
    mutationFn: async (summonerId: number) => {
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
        queryClient.invalidateQueries({ queryKey: lobbyQueryKey }),
        queryClient.invalidateQueries({ queryKey: invitationsQueryKey }),
      ])
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unable to invite friend to lobby.'
      setError(`Unable to invite friend to lobby: ${message}`)
    },
  })

  // External system sync: Global invite handler registration
  useEffect(() => {
    if (!transport || riftStatus !== 'connected') {
      setSocialInviteToLobbyHandler(null)
      return () => setSocialInviteToLobbyHandler(null)
    }

    setSocialInviteToLobbyHandler((friend: Friend) => {
      const summonerId = Number(friend.summonerId)
      if (!Number.isFinite(summonerId)) {
        setError('Unable to invite friend to lobby: missing summoner id.')
        return
      }

      inviteMutation.mutate(summonerId)
    })

    return () => setSocialInviteToLobbyHandler(null)
  }, [inviteMutation, riftStatus, setError, transport])

  return inviteMutation
}
