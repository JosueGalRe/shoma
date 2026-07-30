import { useEffect, useRef } from 'react'

import {
  LcuHttpMethod,
  type LcuHttpMethodValue,
  type LcuLobbyInvitationBody,
  type LcuLobbyPositionPreferencesBody,
  type LcuLobbyQueueBody,
  LcuPaths,
  type LcuQuickplayPlayerSlotsBody,
} from '@shoma/protocol-contract'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { debugError, debugLog } from '@/core/debug'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import {
  gameflowPhaseDescriptor,
  invitesDescriptor,
  lobbyDescriptor,
  queueDescriptor,
  queueSearchDescriptor,
  readyCheckDescriptor,
  sentInvitesDescriptor,
} from './lcu-queries'

import type { SummonerId } from '@/core/types/branded'

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

  useEffect(() => {
    transportRef.current = transport
  }, [transport])

  return useMutation<unknown, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const currentTransport = transportRef.current
      let path: string

      if (config.kind === 'variables-to-path') {
        path = config.pathFactory(variables)
      } else {
        ;({ path } = config)
      }

      let body: unknown

      if (config.kind === 'variables-to-body') {
        body = config.bodyFactory(variables)
      } else if (config.kind === 'static-body') {
        ;({ body } = config)
      } else {
        body = undefined
      }

      debugLog('[Mimic] LCU mutation:', { body, method: config.method, path })

      if (!currentTransport) {
        debugError('[Mimic] LCU mutation failed: no transport')
        throw new Error('No transport')
      }

      const result = await currentTransport.request(path, config.method, body)

      debugLog('[Mimic] LCU mutation response:', { content: result.content, path, status: result.status })

      if (result.status < 200 || result.status >= 300) {
        debugError('[Mimic] LCU mutation error:', { content: result.content, path, status: result.status })
        throw new Error(`LCU request failed (${result.status}): ${path}`)
      }

      return result
    },
    onSuccess: async () => {
      if (config.invalidateKeys) {
        await Promise.all(
          config.invalidateKeys.map((key) => {
            return queryClient.invalidateQueries({ queryKey: key })
          }),
        )
      }
    },
  })
}

export function useAcceptReadyCheck() {
  return useLcuMutation({
    invalidateKeys: [readyCheckDescriptor.queryKey, gameflowPhaseDescriptor.queryKey, queueSearchDescriptor.queryKey],
    kind: 'static-body',
    method: LcuHttpMethod.POST,
    path: LcuPaths.matchmaking.readyCheckAccept,
  })
}

export function useDeclineReadyCheck() {
  return useLcuMutation({
    invalidateKeys: [readyCheckDescriptor.queryKey, gameflowPhaseDescriptor.queryKey, queueSearchDescriptor.queryKey],
    kind: 'static-body',
    method: LcuHttpMethod.POST,
    path: LcuPaths.matchmaking.readyCheckDecline,
  })
}

export function useCancelQueue() {
  return useLcuMutation({
    invalidateKeys: [queueDescriptor.queryKey, queueSearchDescriptor.queryKey, gameflowPhaseDescriptor.queryKey],
    kind: 'static-body',
    method: LcuHttpMethod.DELETE,
    path: LcuPaths.lobby.matchmakingSearch,
  })
}

export function useJoinQueue(body?: LcuLobbyQueueBody) {
  return useLcuMutation({
    body,
    invalidateKeys: lobbyInvalidationKeys,
    kind: 'static-body',
    method: LcuHttpMethod.POST,
    path: LcuPaths.lobby.matchmakingSearch,
  })
}

export function useCreateLobby() {
  return useLcuMutation<LcuLobbyQueueBody>({
    bodyFactory: (body) => {
      return body
    },
    invalidateKeys: [lobbyDescriptor.queryKey],
    kind: 'variables-to-body',
    method: LcuHttpMethod.POST,
    path: LcuPaths.lobby.lobby,
  })
}

export function useDeleteLobby() {
  return useLcuMutation({
    invalidateKeys: [lobbyDescriptor.queryKey],
    kind: 'static-body',
    method: LcuHttpMethod.DELETE,
    path: LcuPaths.lobby.lobby,
  })
}

export function useInvitePlayer() {
  return useLcuMutation<SummonerId>({
    bodyFactory: (summonerId): LcuLobbyInvitationBody[] => {
      return [{ toSummonerId: summonerId }]
    },
    invalidateKeys: [lobbyDescriptor.queryKey, invitesDescriptor.queryKey, sentInvitesDescriptor.queryKey],
    kind: 'variables-to-body',
    method: LcuHttpMethod.POST,
    path: LcuPaths.lobby.invitations,
  })
}

export function usePromotePlayer() {
  return useLcuMutation<SummonerId>({
    invalidateKeys: [lobbyDescriptor.queryKey],
    kind: 'variables-to-path',
    method: LcuHttpMethod.POST,
    pathFactory: (summonerId) => {
      return LcuPaths.lobby.memberPromote(summonerId)
    },
  })
}

export function useKickPlayer() {
  return useLcuMutation<SummonerId>({
    invalidateKeys: [lobbyDescriptor.queryKey],
    kind: 'variables-to-path',
    method: LcuHttpMethod.POST,
    pathFactory: (summonerId) => {
      return LcuPaths.lobby.memberKick(summonerId)
    },
  })
}

export function useChangeRole() {
  return useLcuMutation<LcuLobbyPositionPreferencesBody>({
    bodyFactory: (body) => {
      return body
    },
    invalidateKeys: [lobbyDescriptor.queryKey],
    kind: 'variables-to-body',
    method: LcuHttpMethod.PUT,
    path: LcuPaths.lobby.localMemberPositionPreferences,
  })
}

export function useSetQuickplayPlayerSlots(body: LcuQuickplayPlayerSlotsBody) {
  return useLcuMutation({
    body,
    invalidateKeys: [lobbyDescriptor.queryKey],
    kind: 'static-body',
    method: LcuHttpMethod.PUT,
    path: LcuPaths.lobby.localMemberPlayerSlots,
  })
}

export function useSetPartyType() {
  return useLcuMutation<string>({
    bodyFactory: (partyType) => {
      return partyType
    },
    invalidateKeys: [lobbyDescriptor.queryKey],
    kind: 'variables-to-body',
    method: LcuHttpMethod.PUT,
    path: LcuPaths.lobby.partyType,
  })
}
