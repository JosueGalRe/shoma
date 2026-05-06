import { useMutation, type QueryClient } from '@tanstack/react-query'

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
import { gameflowPhaseDescriptor, queueSearchDescriptor, readyCheckDescriptor } from './lcu-queries'

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

const lobbyQueryKey = ['lcu', LcuPaths.lobby.lobby] as const
const matchmakingSearchQueryKey = ['lcu', LcuPaths.matchmaking.search] as const
const perksCurrentPageQueryKey = ['lcu', LcuPaths.perks.currentPage] as const
const perksPagesQueryKey = ['lcu', LcuPaths.perks.pages] as const
const receivedInvitationsQueryKey = ['lcu', LcuPaths.lobby.receivedInvitations] as const

const lobbyInvalidationKeys = [lobbyQueryKey, matchmakingSearchQueryKey, receivedInvitationsQueryKey] as const
const perksPageInvalidationKeys = [perksPagesQueryKey, perksCurrentPageQueryKey] as const

export function createLcuMutation<TVariables = void>(
  transport: LcuTransport | null,
  queryClient: QueryClient,
  config: LcuMutationConfig<TVariables>,
) {
  // The public API is intentionally named as a factory for migration call sites.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMutation<unknown, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const path = config.kind === 'variables-to-path' ? config.pathFactory(variables) : config.path
      const body = config.kind === 'variables-to-body' ? config.bodyFactory(variables) : config.kind === 'static-body' ? config.body : undefined
      if (!transport) {
        throw new Error('No transport')
      }

      const result = await transport.request(path, config.method, body)
      if (result.status < 200 || result.status >= 300) {
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
    invalidateKeys: [matchmakingSearchQueryKey],
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
    invalidateKeys: [lobbyQueryKey],
  })
}

export function useInvitePlayer(transport: LcuTransport | null, queryClient: QueryClient) {
  return createLcuMutation<number>(transport, queryClient, {
    kind: 'variables-to-body',
    path: LcuPaths.lobby.invitations,
    method: LcuHttpMethod.POST,
    bodyFactory: (summonerId): LcuLobbyInvitationBody[] => [{ toSummonerId: summonerId }],
    invalidateKeys: [lobbyQueryKey, receivedInvitationsQueryKey],
  })
}

export function useAcceptInvite(transport: LcuTransport | null, queryClient: QueryClient, invitationId: string) {
  return createLcuMutation(transport, queryClient, {
    kind: 'static-body',
    path: LcuPaths.lobby.receivedInvitationAccept(invitationId),
    method: LcuHttpMethod.POST,
    invalidateKeys: [receivedInvitationsQueryKey],
  })
}

export function useDeclineInvite(transport: LcuTransport | null, queryClient: QueryClient, invitationId: string) {
  return createLcuMutation(transport, queryClient, {
    kind: 'static-body',
    path: LcuPaths.lobby.receivedInvitationDecline(invitationId),
    method: LcuHttpMethod.POST,
    invalidateKeys: [receivedInvitationsQueryKey],
  })
}

export function usePromotePlayer(transport: LcuTransport | null, queryClient: QueryClient) {
  return createLcuMutation<number>(transport, queryClient, {
    kind: 'variables-to-path',
    pathFactory: (summonerId) => LcuPaths.lobby.memberPromote(summonerId),
    method: LcuHttpMethod.POST,
    invalidateKeys: [lobbyQueryKey],
  })
}

export function useKickPlayer(transport: LcuTransport | null, queryClient: QueryClient) {
  return createLcuMutation<number>(transport, queryClient, {
    kind: 'variables-to-path',
    pathFactory: (summonerId) => LcuPaths.lobby.memberKick(summonerId),
    method: LcuHttpMethod.POST,
    invalidateKeys: [lobbyQueryKey],
  })
}

export function useGrantInvite(transport: LcuTransport | null, queryClient: QueryClient, summonerId: number) {
  return createLcuMutation(transport, queryClient, {
    kind: 'static-body',
    path: LcuPaths.lobby.memberGrantInvite(summonerId),
    method: LcuHttpMethod.POST,
    invalidateKeys: [lobbyQueryKey],
  })
}

export function useRevokeInvite(transport: LcuTransport | null, queryClient: QueryClient, summonerId: number) {
  return createLcuMutation(transport, queryClient, {
    kind: 'static-body',
    path: LcuPaths.lobby.memberRevokeInvite(summonerId),
    method: LcuHttpMethod.POST,
    invalidateKeys: [lobbyQueryKey],
  })
}

export function useChangeRole(transport: LcuTransport | null, queryClient: QueryClient) {
  return createLcuMutation<LcuLobbyPositionPreferencesBody>(transport, queryClient, {
    kind: 'variables-to-body',
    path: LcuPaths.lobby.localMemberPositionPreferences,
    method: LcuHttpMethod.PUT,
    bodyFactory: (body) => body,
    invalidateKeys: [lobbyQueryKey],
  })
}

export function useSetQuickplayPlayerSlots(transport: LcuTransport | null, queryClient: QueryClient, body: LcuQuickplayPlayerSlotsBody) {
  return createLcuMutation(transport, queryClient, {
    kind: 'static-body',
    path: LcuPaths.lobby.localMemberPlayerSlots,
    method: LcuHttpMethod.PUT,
    body,
    invalidateKeys: [lobbyQueryKey],
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
    invalidateKeys: [perksCurrentPageQueryKey],
  })
}
