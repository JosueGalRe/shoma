import { useMutation, type QueryClient } from '@tanstack/react-query'
import { useRef } from 'react'

import {
  LcuHttpMethod,
  LcuPaths,
  type LcuHttpMethodValue,
  type LcuLobbyInvitationBody,
  type LcuLobbyPositionPreferencesBody,
  type LcuLobbyQueueBody,
  type LcuPerksPageCreateBody,
  type LcuPerksPageUpdateBody,
  type LcuQuickplayPlayerSlotsBody,
} from '@mimic/protocol-contract'

import type { LcuTransport } from '@/core/rift/lcu-transport'
import type { InvitationId, SummonerId } from '@/core/types/branded'
import {
  gameflowPhaseDescriptor,
  invitesDescriptor,
  lobbyDescriptor,
  perksCurrentPageDescriptor,
  perksPagesDescriptor,
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
const perksPageInvalidationKeys = [perksPagesDescriptor.queryKey, perksCurrentPageDescriptor.queryKey] as const

// eslint-disable-next-line react-hooks/rules-of-hooks
export function createLcuMutation<TVariables = void>(
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
      console.log('[Mimic] LCU mutation:', { path, method: config.method, body })
      if (!currentTransport) {
        console.error('[Mimic] LCU mutation failed: no transport')
        throw new Error('No transport')
      }

      const result = await currentTransport.request(path, config.method, body)
      console.log('[Mimic] LCU mutation response:', { path, status: result.status, content: result.content })
      if (result.status < 200 || result.status >= 300) {
        console.error('[Mimic] LCU mutation error:', { path, status: result.status, content: result.content })
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
    method: LcuHttpMethod.PUT,
    invalidateKeys: [readyCheckDescriptor.queryKey, gameflowPhaseDescriptor.queryKey, queueSearchDescriptor.queryKey],
  })
}

export function useDeclineReadyCheck(transport: LcuTransport | null, queryClient: QueryClient) {
  return createLcuMutation(transport, queryClient, {
    kind: 'static-body',
    path: LcuPaths.matchmaking.readyCheckDecline,
    method: LcuHttpMethod.PUT,
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

export function useAcceptInvite(transport: LcuTransport | null, queryClient: QueryClient, invitationId: InvitationId) {
  return createLcuMutation(transport, queryClient, {
    kind: 'static-body',
    path: LcuPaths.lobby.receivedInvitationAccept(invitationId),
    method: LcuHttpMethod.POST,
    invalidateKeys: [invitesDescriptor.queryKey, lobbyDescriptor.queryKey],
  })
}

export function useDeclineInvite(transport: LcuTransport | null, queryClient: QueryClient, invitationId: InvitationId) {
  return createLcuMutation(transport, queryClient, {
    kind: 'static-body',
    path: LcuPaths.lobby.receivedInvitationDecline(invitationId),
    method: LcuHttpMethod.POST,
    invalidateKeys: [invitesDescriptor.queryKey],
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

export function useGrantInvite(transport: LcuTransport | null, queryClient: QueryClient, summonerId: SummonerId) {
  return createLcuMutation(transport, queryClient, {
    kind: 'static-body',
    path: LcuPaths.lobby.memberGrantInvite(summonerId),
    method: LcuHttpMethod.POST,
    invalidateKeys: [lobbyDescriptor.queryKey],
  })
}

export function useRevokeInvite(transport: LcuTransport | null, queryClient: QueryClient, summonerId: SummonerId) {
  return createLcuMutation(transport, queryClient, {
    kind: 'static-body',
    path: LcuPaths.lobby.memberRevokeInvite(summonerId),
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

export function useCreateRunePage(transport: LcuTransport | null, queryClient: QueryClient, body: LcuPerksPageCreateBody) {
  return createLcuMutation(transport, queryClient, {
    kind: 'static-body',
    path: LcuPaths.perks.pages,
    method: LcuHttpMethod.POST,
    body,
    invalidateKeys: perksPageInvalidationKeys,
  })
}

export function useUpdateRunePage(
  transport: LcuTransport | null,
  queryClient: QueryClient,
  pageId: number,
  body: LcuPerksPageUpdateBody,
) {
  return createLcuMutation(transport, queryClient, {
    kind: 'static-body',
    path: LcuPaths.perks.page(pageId),
    method: LcuHttpMethod.PUT,
    body,
    invalidateKeys: perksPageInvalidationKeys,
  })
}

export function useDeleteRunePage(transport: LcuTransport | null, queryClient: QueryClient, pageId: number) {
  return createLcuMutation(transport, queryClient, {
    kind: 'static-body',
    path: LcuPaths.perks.page(pageId),
    method: LcuHttpMethod.DELETE,
    invalidateKeys: perksPageInvalidationKeys,
  })
}

export function useSetCurrentRunePage(transport: LcuTransport | null, queryClient: QueryClient, pageId: number) {
  return createLcuMutation(transport, queryClient, {
    kind: 'static-body',
    path: LcuPaths.perks.currentPage,
    method: LcuHttpMethod.PUT,
    body: String(pageId),
    invalidateKeys: [perksCurrentPageDescriptor.queryKey],
  })
}
