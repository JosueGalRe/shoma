import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'

import { debugError, debugLog } from '@/core/debug'
import { useSharedLCUTransport } from '@/core/relay/relay-client-provider'
import type { SummonerId } from '@/core/types/branded'
import { LcuHttpMethod, LcuPaths } from '@shoma/protocol-contract';
import type { LcuHttpMethodValue } from '@shoma/protocol-contract';
import type { LcuLobbyInvitationBody } from '@shoma/protocol-contract';
import type { LcuLobbyPositionPreferencesBody } from '@shoma/protocol-contract';
import type { LcuLobbyQueueBody } from '@shoma/protocol-contract';
import type { LcuQuickplayPlayerSlotsBody } from '@shoma/protocol-contract';

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

function useLcuMutation<TVariables = void>(config: LcuMutationConfig<TVariables>) {
  const transport = useSharedLCUTransport()
  const queryClient = useQueryClient()
  const transportRef = useRef(transport)
  transportRef.current = transport

  return useMutation<unknown, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const currentTransport = transportRef.current
      let path: string
      if (config.kind === 'variables-to-path') {
        path = config.pathFactory(variables)
      } else {
        path = config.path
      }

      let body: unknown
      if (config.kind === 'variables-to-body') {
        body = config.bodyFactory(variables)
      } else if (config.kind === 'static-body') {
        body = config.body
      } else {
        body = undefined
      }
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
        await Promise.all(config.invalidateKeys.map((key) => { return queryClient.invalidateQueries({ queryKey: key }); }))
      }
    },
  })
}

export function useAcceptReadyCheck() {
  return useLcuMutation({
    kind: 'static-body',
    path: LcuPaths.matchmaking.readyCheckAccept,
    method: LcuHttpMethod.POST,
    invalidateKeys: [readyCheckDescriptor.queryKey, gameflowPhaseDescriptor.queryKey, queueSearchDescriptor.queryKey],
  })
}

export function useDeclineReadyCheck() {
  return useLcuMutation({
    kind: 'static-body',
    path: LcuPaths.matchmaking.readyCheckDecline,
    method: LcuHttpMethod.POST,
    invalidateKeys: [readyCheckDescriptor.queryKey, gameflowPhaseDescriptor.queryKey, queueSearchDescriptor.queryKey],
  })
}

export function useCancelQueue() {
  return useLcuMutation({
    kind: 'static-body',
    path: LcuPaths.lobby.matchmakingSearch,
    method: LcuHttpMethod.DELETE,
    invalidateKeys: [queueDescriptor.queryKey, queueSearchDescriptor.queryKey, gameflowPhaseDescriptor.queryKey],
  })
}

export function useJoinQueue(body?: LcuLobbyQueueBody) {
  return useLcuMutation({
    kind: 'static-body',
    path: LcuPaths.lobby.matchmakingSearch,
    method: LcuHttpMethod.POST,
    body,
    invalidateKeys: lobbyInvalidationKeys,
  })
}

export function useCreateLobby() {
  return useLcuMutation<LcuLobbyQueueBody>({
    kind: 'variables-to-body',
    path: LcuPaths.lobby.lobby,
    method: LcuHttpMethod.POST,
    bodyFactory: (body) => {return body},
    invalidateKeys: [lobbyDescriptor.queryKey],
  })
}

export function useDeleteLobby() {
  return useLcuMutation({
    kind: 'static-body',
    path: LcuPaths.lobby.lobby,
    method: LcuHttpMethod.DELETE,
    invalidateKeys: [lobbyDescriptor.queryKey],
  })
}

export function useInvitePlayer() {
  return useLcuMutation<SummonerId>({
    kind: 'variables-to-body',
    path: LcuPaths.lobby.invitations,
    method: LcuHttpMethod.POST,
    bodyFactory: (summonerId): LcuLobbyInvitationBody[] => {return [{ toSummonerId: summonerId }]},
    invalidateKeys: [lobbyDescriptor.queryKey, invitesDescriptor.queryKey, sentInvitesDescriptor.queryKey],
  })
}

export function usePromotePlayer() {
  return useLcuMutation<SummonerId>({
    kind: 'variables-to-path',
    pathFactory: (summonerId) => { return LcuPaths.lobby.memberPromote(summonerId); },
    method: LcuHttpMethod.POST,
    invalidateKeys: [lobbyDescriptor.queryKey],
  })
}

export function useKickPlayer() {
  return useLcuMutation<SummonerId>({
    kind: 'variables-to-path',
    pathFactory: (summonerId) => { return LcuPaths.lobby.memberKick(summonerId); },
    method: LcuHttpMethod.POST,
    invalidateKeys: [lobbyDescriptor.queryKey],
  })
}

export function useChangeRole() {
  return useLcuMutation<LcuLobbyPositionPreferencesBody>({
    kind: 'variables-to-body',
    path: LcuPaths.lobby.localMemberPositionPreferences,
    method: LcuHttpMethod.PUT,
    bodyFactory: (body) => {return body},
    invalidateKeys: [lobbyDescriptor.queryKey],
  })
}

export function useSetQuickplayPlayerSlots(body: LcuQuickplayPlayerSlotsBody) {
  return useLcuMutation({
    kind: 'static-body',
    path: LcuPaths.lobby.localMemberPlayerSlots,
    method: LcuHttpMethod.PUT,
    body,
    invalidateKeys: [lobbyDescriptor.queryKey],
  })
}

export function useSetPartyType() {
  return useLcuMutation<string>({
    kind: 'variables-to-body',
    path: LcuPaths.lobby.partyType,
    method: LcuHttpMethod.PUT,
    bodyFactory: (partyType) => {return { partyType }},
    invalidateKeys: [lobbyDescriptor.queryKey],
  })
}
