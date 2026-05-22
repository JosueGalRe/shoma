import { useMutation, type QueryClient } from '@tanstack/react-query'
import { useRef } from 'react'

import { debugError, debugLog } from '@/core/debug'

import {
  LcuHttpMethod,
  LcuPaths,
  type LcuHttpMethodValue,
  type LcuLobbyInvitationBody,
  type LcuLobbyPositionPreferencesBody,
  type LcuLobbyQueueBody,
  type LcuQuickplayPlayerSlotsBody,
} from '@shoma/protocol-contract'

import type { LcuTransport } from '@/core/relay/lcu-transport'
import type { SummonerId } from '@/core/types/branded'
import {
  gameflowPhaseDescriptor,
  invitesDescriptor,
  lobbyDescriptor,
  queueDescriptor,
  queueSearchDescriptor,
  readyCheckDescriptor,
  sentInvitesDescriptor,
} from './lcu-queries'

type LcuMutationConfig<TVariables> =
  | {
      kind: 'static-body'
      path: string
      body?: unknown
      method?: LcuHttpMethodValue
      invalidateKeys?: readonly (readonly unknown[])[]
    }
  | {
      kind: 'variables-to-body'
      path: string
      bodyFactory: (variables: TVariables) => unknown
      method?: LcuHttpMethodValue
      invalidateKeys?: readonly (readonly unknown[])[]
    }
  | {
      kind: 'variables-to-path'
      pathFactory: (variables: TVariables) => string
      body?: never
      bodyFactory?: never
      method?: LcuHttpMethodValue
      invalidateKeys?: readonly (readonly unknown[])[]
    }

const lobbyInvalidationKeys = [
  lobbyDescriptor.queryKey,
  queueDescriptor.queryKey,
  queueSearchDescriptor.queryKey,
  gameflowPhaseDescriptor.queryKey,
  invitesDescriptor.queryKey,
] as const

// eslint-disable-next-line react-hooks/rules-of-hooks
function createLcuMutation<TVariables = void>(
  transport: LcuTransport | null,
  queryClient: QueryClient,
  config: LcuMutationConfig<TVariables>,
) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const transportRef = useRef(transport)
  transportRef.current = transport

  // The public API is intentionally named as a factory for migration call sites.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMutation<unknown, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const currentTransport = transportRef.current
      const path = config.kind === 'variables-to-path' ? config.pathFactory(variables) : config.path
      const body = config.kind === 'variables-to-body' ? config.bodyFactory(variables) : config.kind === 'static-body' ? config.body : undefined
      debugLog('[Mimic] LCU mutation:', { path, method: config.method, body })
      if (!currentTransport) {
        debugError('[Mimic] LCU mutation failed: no transport')
        throw new Error('No transport')
      }

      const result = await currentTransport.request(path, config.method, body)
      debugLog('[Mimic] LCU mutation response:', { path, status: result.status, content: result.content })
      if (result.status < 200 || result.status >= 300) {
        debugError('[Mimic] LCU mutation error:', { path, status: result.status, content: result.content })
        throw new Error(`LCU request failed (${result.status}): ${path}`)
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
    kind: 'static-body',
    path: LcuPaths.matchmaking.readyCheckAccept,
    method: LcuHttpMethod.POST,
    invalidateKeys: [readyCheckDescriptor.queryKey, gameflowPhaseDescriptor.queryKey, queueSearchDescriptor.queryKey],
  })
}

export function useDeclineReadyCheck(transport: LcuTransport | null, queryClient: QueryClient) {
  return createLcuMutation(transport, queryClient, {
    kind: 'static-body',
    path: LcuPaths.matchmaking.readyCheckDecline,
    method: LcuHttpMethod.POST,
    invalidateKeys: [readyCheckDescriptor.queryKey, gameflowPhaseDescriptor.queryKey, queueSearchDescriptor.queryKey],
  })
}

export function useCancelQueue(transport: LcuTransport | null, queryClient: QueryClient) {
  return createLcuMutation(transport, queryClient, {
    kind: 'static-body',
    path: LcuPaths.lobby.matchmakingSearch,
    method: LcuHttpMethod.DELETE,
    invalidateKeys: [queueDescriptor.queryKey, queueSearchDescriptor.queryKey, gameflowPhaseDescriptor.queryKey],
  })
}

export function useJoinQueue(transport: LcuTransport | null, queryClient: QueryClient, body?: LcuLobbyQueueBody) {
  return createLcuMutation(transport, queryClient, {
    kind: 'static-body',
    path: LcuPaths.lobby.matchmakingSearch,
    method: LcuHttpMethod.POST,
    body,
    invalidateKeys: lobbyInvalidationKeys,
  })
}

export function useCreateLobby(transport: LcuTransport | null, queryClient: QueryClient) {
  return createLcuMutation<LcuLobbyQueueBody>(transport, queryClient, {
    kind: 'variables-to-body',
    path: LcuPaths.lobby.lobby,
    method: LcuHttpMethod.POST,
    bodyFactory: (body) => body,
    invalidateKeys: [lobbyDescriptor.queryKey],
  })
}

export function useDeleteLobby(transport: LcuTransport | null, queryClient: QueryClient) {
  return createLcuMutation(transport, queryClient, {
    kind: 'static-body',
    path: LcuPaths.lobby.lobby,
    method: LcuHttpMethod.DELETE,
    invalidateKeys: [lobbyDescriptor.queryKey],
  })
}

export function useInvitePlayer(transport: LcuTransport | null, queryClient: QueryClient) {
  return createLcuMutation<SummonerId>(transport, queryClient, {
    kind: 'variables-to-body',
    path: LcuPaths.lobby.invitations,
    method: LcuHttpMethod.POST,
    bodyFactory: (summonerId): LcuLobbyInvitationBody[] => [{ toSummonerId: summonerId }],
    invalidateKeys: [lobbyDescriptor.queryKey, invitesDescriptor.queryKey, sentInvitesDescriptor.queryKey],
  })
}

export function usePromotePlayer(transport: LcuTransport | null, queryClient: QueryClient) {
  return createLcuMutation<SummonerId>(transport, queryClient, {
    kind: 'variables-to-path',
    pathFactory: (summonerId) => LcuPaths.lobby.memberPromote(summonerId),
    method: LcuHttpMethod.POST,
    invalidateKeys: [lobbyDescriptor.queryKey],
  })
}

export function useKickPlayer(transport: LcuTransport | null, queryClient: QueryClient) {
  return createLcuMutation<SummonerId>(transport, queryClient, {
    kind: 'variables-to-path',
    pathFactory: (summonerId) => LcuPaths.lobby.memberKick(summonerId),
    method: LcuHttpMethod.POST,
    invalidateKeys: [lobbyDescriptor.queryKey],
  })
}

export function useChangeRole(transport: LcuTransport | null, queryClient: QueryClient) {
  return createLcuMutation<LcuLobbyPositionPreferencesBody>(transport, queryClient, {
    kind: 'variables-to-body',
    path: LcuPaths.lobby.localMemberPositionPreferences,
    method: LcuHttpMethod.PUT,
    bodyFactory: (body) => body,
    invalidateKeys: [lobbyDescriptor.queryKey],
  })
}

export function useSetQuickplayPlayerSlots(transport: LcuTransport | null, queryClient: QueryClient, body: LcuQuickplayPlayerSlotsBody) {
  return createLcuMutation(transport, queryClient, {
    kind: 'static-body',
    path: LcuPaths.lobby.localMemberPlayerSlots,
    method: LcuHttpMethod.PUT,
    body,
    invalidateKeys: [lobbyDescriptor.queryKey],
  })
}

export function useSetPartyType(transport: LcuTransport | null, queryClient: QueryClient) {
  return createLcuMutation<string>(transport, queryClient, {
    kind: 'variables-to-body',
    path: LcuPaths.lobby.partyType,
    method: LcuHttpMethod.PUT,
    bodyFactory: (partyType) => ({ partyType }),
    invalidateKeys: [lobbyDescriptor.queryKey],
  })
}
