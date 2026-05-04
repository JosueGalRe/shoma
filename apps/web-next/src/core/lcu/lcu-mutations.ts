import { useMutation, type QueryClient } from '@tanstack/react-query'

import {
  LcuHttpMethod,
  LcuPaths,
  type LcuHttpMethodValue,
  type LcuLobbyInvitationBody,
  type LcuLobbyPositionPreferencesBody,
  type LcuLobbyQueueBody,
} from '@mimic/protocol-contract'

import type { LcuTransport } from '@/core/rift/lcu-transport'

type LcuMutationConfig = {
  path: string
  method?: LcuHttpMethodValue
  body?: unknown
  invalidateKeys?: readonly (readonly unknown[])[]
}

const lobbyQueryKey = ['lcu', LcuPaths.lobby.lobby] as const
const matchmakingSearchQueryKey = ['lcu', LcuPaths.matchmaking.search] as const
const receivedInvitationsQueryKey = ['lcu', LcuPaths.lobby.receivedInvitations] as const

const lobbyInvalidationKeys = [lobbyQueryKey, matchmakingSearchQueryKey, receivedInvitationsQueryKey] as const

export function createLcuMutation(transport: LcuTransport | null, queryClient: QueryClient, config: LcuMutationConfig) {
  // The public API is intentionally named as a factory for migration call sites.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMutation({
    mutationFn: async () => {
      if (!transport) {
        throw new Error('No transport')
      }

      const result = await transport.request(config.path, config.method, config.body)
      if (result.status < 200 || result.status >= 300) {
        throw new Error(`LCU request failed (${result.status}): ${config.path}`)
      }
      return result
    },
    onSuccess: async () => {
      if (config.invalidateKeys) {
        await Promise.all(config.invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })))
      }
    },
  })
}

export function useAcceptReadyCheck(transport: LcuTransport | null, queryClient: QueryClient) {
  return createLcuMutation(transport, queryClient, {
    path: LcuPaths.matchmaking.readyCheckAccept,
    method: LcuHttpMethod.PUT,
  })
}

export function useDeclineReadyCheck(transport: LcuTransport | null, queryClient: QueryClient) {
  return createLcuMutation(transport, queryClient, {
    path: LcuPaths.matchmaking.readyCheckDecline,
    method: LcuHttpMethod.PUT,
  })
}

export function useCancelQueue(transport: LcuTransport | null, queryClient: QueryClient) {
  return createLcuMutation(transport, queryClient, {
    path: LcuPaths.lobby.matchmakingSearch,
    method: LcuHttpMethod.DELETE,
    invalidateKeys: [matchmakingSearchQueryKey],
  })
}

export function useJoinQueue(transport: LcuTransport | null, queryClient: QueryClient, body?: LcuLobbyQueueBody) {
  return createLcuMutation(transport, queryClient, {
    path: LcuPaths.lobby.matchmakingSearch,
    method: LcuHttpMethod.POST,
    body,
    invalidateKeys: lobbyInvalidationKeys,
  })
}

export function useInvitePlayer(transport: LcuTransport | null, queryClient: QueryClient, summonerId: number) {
  const body: LcuLobbyInvitationBody[] = [{ toSummonerId: summonerId }]

  return createLcuMutation(transport, queryClient, {
    path: LcuPaths.lobby.invitations,
    method: LcuHttpMethod.POST,
    body,
    invalidateKeys: [lobbyQueryKey, receivedInvitationsQueryKey],
  })
}

export function useAcceptInvite(transport: LcuTransport | null, queryClient: QueryClient, invitationId: string) {
  return createLcuMutation(transport, queryClient, {
    path: LcuPaths.lobby.receivedInvitationAccept(invitationId),
    method: LcuHttpMethod.POST,
    invalidateKeys: [receivedInvitationsQueryKey],
  })
}

export function useDeclineInvite(transport: LcuTransport | null, queryClient: QueryClient, invitationId: string) {
  return createLcuMutation(transport, queryClient, {
    path: LcuPaths.lobby.receivedInvitationDecline(invitationId),
    method: LcuHttpMethod.POST,
    invalidateKeys: [receivedInvitationsQueryKey],
  })
}

export function usePromotePlayer(transport: LcuTransport | null, queryClient: QueryClient, summonerId: number) {
  return createLcuMutation(transport, queryClient, {
    path: LcuPaths.lobby.memberPromote(summonerId),
    method: LcuHttpMethod.POST,
    invalidateKeys: [lobbyQueryKey],
  })
}

export function useKickPlayer(transport: LcuTransport | null, queryClient: QueryClient, summonerId: number) {
  return createLcuMutation(transport, queryClient, {
    path: LcuPaths.lobby.memberKick(summonerId),
    method: LcuHttpMethod.POST,
    invalidateKeys: [lobbyQueryKey],
  })
}

export function useChangeRole(transport: LcuTransport | null, queryClient: QueryClient, body: LcuLobbyPositionPreferencesBody) {
  return createLcuMutation(transport, queryClient, {
    path: LcuPaths.lobby.localMemberPositionPreferences,
    method: LcuHttpMethod.PUT,
    body,
    invalidateKeys: [lobbyQueryKey],
  })
}
