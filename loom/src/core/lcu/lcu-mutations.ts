import { useEffect, useRef } from 'react'

import {
  LcuHttpMethod,
  type LcuHttpMethodValue,
  type LcuLobbyCustomBody,
  type LcuLobbyInvitationBody,
  type LcuLobbyPositionPreferencesBody,
  type LcuLobbyQueueBody,
  LcuPaths,
  type LcuQuickplayPlayerSlotsBody,
} from '@shoma/protocol-contract'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { debugError, debugLog } from '@/core/debug'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import { champSelectSettingsDescriptor, perksCurrentPageDescriptor, perksPagesDescriptor } from './queries/game-data'
import {
  gameflowPhaseDescriptor,
  invitesDescriptor,
  lobbySessionDescriptor,
  queueDescriptor,
  queueSearchDescriptor,
  readyCheckDescriptor,
  sentInvitesDescriptor,
} from './queries/lobby'
import { chatSettingsDescriptor, friendGroupsDescriptor, friendRequestsDescriptor } from './queries/social'

import type { PerkPage } from './parsers/perks'
import type { ChampSelectSettings, ChatSettings } from './parsers/settings'
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
      bodyFactory?: (variables: TVariables) => unknown
      method?: LcuHttpMethodValue
      invalidateKeys?: readonly (readonly unknown[])[]
    }

const lobbyInvalidationKeys = [
  lobbySessionDescriptor.queryKey,
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

      if (config.kind === 'variables-to-body' || config.kind === 'variables-to-path') {
        body = config.bodyFactory?.(variables)
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

// The client's end-of-game screen closed: what its footer does when the player leaves it
export function useDismissEndOfGameStats() {
  return useLcuMutation({
    invalidateKeys: [gameflowPhaseDescriptor.queryKey, lobbySessionDescriptor.queryKey],
    kind: 'static-body',
    method: LcuHttpMethod.POST,
    path: LcuPaths.endOfGame.dismissStats,
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
  return useLcuMutation<LcuLobbyCustomBody | LcuLobbyQueueBody>({
    bodyFactory: (body) => {
      return body
    },
    invalidateKeys: [lobbySessionDescriptor.queryKey],
    kind: 'variables-to-body',
    method: LcuHttpMethod.POST,
    path: LcuPaths.lobby.lobby,
  })
}

export function useDeleteLobby() {
  return useLcuMutation({
    invalidateKeys: [lobbySessionDescriptor.queryKey],
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
    invalidateKeys: [lobbySessionDescriptor.queryKey, invitesDescriptor.queryKey, sentInvitesDescriptor.queryKey],
    kind: 'variables-to-body',
    method: LcuHttpMethod.POST,
    path: LcuPaths.lobby.invitations,
  })
}

export function usePromotePlayer() {
  return useLcuMutation<SummonerId>({
    invalidateKeys: [lobbySessionDescriptor.queryKey],
    kind: 'variables-to-path',
    method: LcuHttpMethod.POST,
    pathFactory: (summonerId) => {
      return LcuPaths.lobby.memberPromote(summonerId)
    },
  })
}

export function useKickPlayer() {
  return useLcuMutation<SummonerId>({
    invalidateKeys: [lobbySessionDescriptor.queryKey],
    kind: 'variables-to-path',
    method: LcuHttpMethod.POST,
    pathFactory: (summonerId) => {
      return LcuPaths.lobby.memberKick(summonerId)
    },
  })
}

// The owner's Grant Invites and Revoke Invites
export function useSetInvitePrivilege() {
  return useLcuMutation<{ allowed: boolean; summonerId: SummonerId }>({
    invalidateKeys: [lobbySessionDescriptor.queryKey],
    kind: 'variables-to-path',
    method: LcuHttpMethod.POST,
    pathFactory: ({ allowed, summonerId }) => {
      return allowed ? LcuPaths.lobby.memberGrantInvite(summonerId) : LcuPaths.lobby.memberRevokeInvite(summonerId)
    },
  })
}

export function useChangeRole() {
  return useLcuMutation<LcuLobbyPositionPreferencesBody>({
    bodyFactory: (body) => {
      return body
    },
    invalidateKeys: [lobbySessionDescriptor.queryKey],
    kind: 'variables-to-body',
    method: LcuHttpMethod.PUT,
    path: LcuPaths.lobby.localMemberPositionPreferences,
  })
}

// Swift Play: both options at once, as the client sends them after any change
export function useSetQuickplayPlayerSlots() {
  return useLcuMutation<LcuQuickplayPlayerSlotsBody>({
    bodyFactory: (slots) => {
      return slots
    },
    invalidateKeys: [lobbySessionDescriptor.queryKey],
    kind: 'variables-to-body',
    method: LcuHttpMethod.PUT,
    path: LcuPaths.lobby.localMemberPlayerSlots,
  })
}

// The client's champ select settings, written whole as the client does when it remembers a champion's skin
export function useSaveChampSelectSettings() {
  return useLcuMutation<ChampSelectSettings>({
    bodyFactory: (settings) => {
      return settings
    },
    invalidateKeys: [champSelectSettingsDescriptor.queryKey],
    kind: 'variables-to-body',
    method: LcuHttpMethod.PUT,
    path: LcuPaths.settings.champSelect,
  })
}

// The friend list's options, written whole as the client does
export function useSaveChatSettings() {
  return useLcuMutation<ChatSettings>({
    bodyFactory: (settings) => {
      return settings
    },
    invalidateKeys: [chatSettingsDescriptor.queryKey],
    kind: 'variables-to-body',
    method: LcuHttpMethod.PUT,
    path: LcuPaths.social.settings,
  })
}

// By Riot ID, or by puuid for someone from Recently Played, as the client sends it
export function useSendFriendRequest() {
  return useLcuMutation<{ gameName: string; tagLine: string } | { puuid: string }>({
    bodyFactory: (target) => {
      return target
    },
    invalidateKeys: [friendRequestsDescriptor.queryKey],
    kind: 'variables-to-body',
    method: LcuHttpMethod.POST,
    path: LcuPaths.social.friendRequests,
  })
}

// The client's "Add folder"; it gives the new one the highest priority, so it comes first in the list
export function useCreateFriendGroup() {
  return useLcuMutation<{ name: string; priority: number }>({
    bodyFactory: (group) => {
      return group
    },
    invalidateKeys: [friendGroupsDescriptor.queryKey],
    kind: 'variables-to-body',
    method: LcuHttpMethod.POST,
    path: LcuPaths.social.friendGroups,
  })
}

export function useSavePerkPage() {
  return useLcuMutation<PerkPage>({
    bodyFactory: (page) => {
      return page
    },
    invalidateKeys: [perksPagesDescriptor.queryKey],
    kind: 'variables-to-path',
    method: LcuHttpMethod.PUT,
    pathFactory: (page) => {
      return LcuPaths.perks.page(page.id)
    },
  })
}

// The page champ select takes into the game
export function useSetCurrentPerkPage() {
  return useLcuMutation<number>({
    bodyFactory: (pageId) => {
      return pageId
    },
    invalidateKeys: [perksCurrentPageDescriptor.queryKey, perksPagesDescriptor.queryKey],
    kind: 'variables-to-body',
    method: LcuHttpMethod.PUT,
    path: LcuPaths.perks.currentPage,
  })
}

// Arena: the local player takes a slot of the multiteam lobby, swapping with whoever sat there
export function useSetLobbySubteam() {
  return useLcuMutation<{ intraSubteamPosition: number; subteamIndex: number }>({
    bodyFactory: (slot) => {
      return slot
    },
    invalidateKeys: [lobbySessionDescriptor.queryKey],
    kind: 'variables-to-body',
    method: LcuHttpMethod.PUT,
    path: LcuPaths.lobby.subteamData,
  })
}

// Swift Play's party ready; null takes it back, as the client does
export function useSetQuickplayReady() {
  return useLcuMutation<boolean>({
    bodyFactory: (isReady) => {
      return { isPlayerReady: isReady ? 'true' : null }
    },
    invalidateKeys: [lobbySessionDescriptor.queryKey],
    kind: 'variables-to-body',
    method: LcuHttpMethod.PUT,
    path: LcuPaths.lobby.quickplayMemberData,
  })
}

export interface CustomBot {
  championId: number
  difficulty: string
  position: string
  team: '100' | '200'
}

// As the client adds one: a fresh uuid keys the bot
export function useAddCustomBot() {
  return useLcuMutation<CustomBot>({
    bodyFactory: ({ championId, difficulty, position, team }) => {
      return { botDifficulty: difficulty, botUuid: crypto.randomUUID(), championId, position, teamId: team }
    },
    invalidateKeys: [lobbySessionDescriptor.queryKey],
    kind: 'variables-to-body',
    method: LcuHttpMethod.POST,
    path: LcuPaths.lobby.customBots,
  })
}

export function useJoinCustomTeam() {
  return useLcuMutation<'TEAM1' | 'TEAM2'>({
    invalidateKeys: [lobbySessionDescriptor.queryKey],
    kind: 'variables-to-path',
    method: LcuHttpMethod.POST,
    pathFactory: (team) => {
      return LcuPaths.lobby.customTeam(team)
    },
  })
}

export function useSetCustomPosition() {
  return useLcuMutation<string>({
    bodyFactory: (position) => {
      return { firstPreference: position, secondPreference: 'FILL' }
    },
    invalidateKeys: [lobbySessionDescriptor.queryKey],
    kind: 'variables-to-body',
    method: LcuHttpMethod.PUT,
    path: LcuPaths.lobby.customPositionPreferences,
  })
}

export function useStartCustomGame() {
  return useLcuMutation({
    invalidateKeys: lobbyInvalidationKeys,
    kind: 'static-body',
    method: LcuHttpMethod.POST,
    path: LcuPaths.lobby.customStartChampSelect,
  })
}

export function useSetPartyType() {
  return useLcuMutation<string>({
    bodyFactory: (partyType) => {
      return partyType
    },
    invalidateKeys: [lobbySessionDescriptor.queryKey],
    kind: 'variables-to-body',
    method: LcuHttpMethod.PUT,
    path: LcuPaths.lobby.partyType,
  })
}
