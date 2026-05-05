import { queryOptions, useQuery } from '@tanstack/react-query'
import { LcuPaths } from '@mimic/protocol-contract'

import type { ChampSelectSession } from '../../features/champ-select/champ-select-store'
import type { Friend, FriendStatus } from '../../features/social/social-store'
import type { LcuTransport } from '../rift/lcu-transport'
import {
  emptyLobbyQueueStatus,
  parseGameQueues,
  parseInvites,
  parseLobbyMembers,
  parseLobbySentInvites,
  parsePerkPages,
  parseQueueSearchState,
  parseQueueStatus,
  parseReadyCheck,
  parseRerollPoints,
  parseSkinInventory,
  readArray,
  readObject,
  readString,
  type QueueSearchState,
} from './parsers'

export type LcuQueryDescriptor<TDomain> = {
  path: string
  queryKey: readonly unknown[]
  parse: (content: unknown) => TDomain | null
  enabled?: (transport: LcuTransport | null) => boolean
  notFoundValue?: TDomain | null
}

export type SummonerSpell = {
  description?: string
  gameModes?: string[]
  iconPath?: string
  id: number
  name: string
}

type LcuFriend = {
  availability?: unknown
  gameName?: unknown
  gameTag?: unknown
  groupId?: unknown
  icon?: unknown
  id?: unknown
  name?: unknown
}

type LcuFriendGroup = {
  id?: unknown
  name?: unknown
}

export type LcuFriendGroupsMap = Record<number | string, string>

function lcuQueryKey(path: string): readonly ['lcu', string] {
  return ['lcu', path] as const
}

function readErrorStatus(error: unknown): number | null {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return null
  }

  const status = (error as { status?: unknown }).status
  return typeof status === 'number' ? status : null
}

function parseFriendStatus(availability: unknown): FriendStatus {
  if (availability === 'chat') {
    return 'online'
  }

  if (availability === 'away') {
    return 'away'
  }

  return 'offline'
}

export function parseLcuFriend(friend: unknown, groupsMap: LcuFriendGroupsMap = {}): Friend | null {
  const value = readObject(friend) as LcuFriend | null
  if (!value) {
    return null
  }

  const id = typeof value.id === 'string' && value.id.length > 0 ? value.id : null
  if (!id) {
    return null
  }

  const gameName = typeof value.gameName === 'string' ? value.gameName : ''
  const gameTag = typeof value.gameTag === 'string' ? value.gameTag : ''
  const fallbackName = typeof value.name === 'string' && value.name.length > 0 ? value.name : 'Unknown Friend'
  const name = gameName.length > 0 && gameTag.length > 0 ? `${gameName}#${gameTag}` : fallbackName
  const groupId = value.groupId
  const group =
    typeof groupId === 'number' && Number.isFinite(groupId)
      ? (groupsMap[groupId] ?? groupsMap[String(groupId)] ?? 'GENERAL')
      : typeof groupId === 'string' && groupId.length > 0
        ? (groupsMap[groupId] ?? groupId)
        : 'GENERAL'
  const iconId = typeof value.icon === 'number' && Number.isFinite(value.icon) ? value.icon : undefined

  return {
    group,
    iconId,
    id,
    name,
    status: parseFriendStatus(value.availability),
    summonerId: id,
  }
}

export function parseLcuFriends(content: unknown, groupsMap: LcuFriendGroupsMap = {}): Friend[] | null {
  const friends = readArray(content)

  if (!friends) {
    return null
  }

  return friends.flatMap((friend) => {
    const parsedFriend = parseLcuFriend(friend, groupsMap)
    return parsedFriend ? [parsedFriend] : []
  })
}

export function parseLcuFriendGroups(content: unknown): LcuFriendGroupsMap | null {
  const groups = readArray(content)

  if (!groups) {
    return null
  }

  return groups.reduce<LcuFriendGroupsMap>((groupsMap, group) => {
    const value = readObject(group) as LcuFriendGroup | null
    const id = typeof value?.id === 'number' && Number.isFinite(value.id) ? value.id : null
    const name = typeof value?.name === 'string' && value.name.length > 0 ? value.name : null

    if (id !== null && name) {
      groupsMap[id] = name
    }

    return groupsMap
  }, {})
}

export function createLcuQueryOptions<TDomain>(descriptor: LcuQueryDescriptor<TDomain>, transport: LcuTransport | null) {
  return queryOptions({
    queryKey: descriptor.queryKey,
    queryFn: async () => {
      if (!transport) throw new Error('No transport')

      try {
        const result = await transport.request(descriptor.path)
        if (result.status === 404) {
          return descriptor.notFoundValue ?? null
        }

        return descriptor.parse(result.content)
      } catch (error) {
        if (readErrorStatus(error) === 404) {
          return descriptor.notFoundValue ?? null
        }

        throw error
      }
    },
    enabled: descriptor.enabled ? descriptor.enabled(transport) : !!transport,
    staleTime: Infinity,
  })
}

export const lobbyDescriptor = {
  path: LcuPaths.lobby.lobby,
  queryKey: lcuQueryKey(LcuPaths.lobby.lobby),
  parse: (content: unknown) => parseLobbyMembers(content, {}, null),
} satisfies LcuQueryDescriptor<ReturnType<typeof parseLobbyMembers>>

export const queueDescriptor = {
  path: LcuPaths.matchmaking.search,
  queryKey: lcuQueryKey(LcuPaths.matchmaking.search),
  parse: (content: unknown) => parseQueueStatus(content, null),
  notFoundValue: emptyLobbyQueueStatus,
} satisfies LcuQueryDescriptor<ReturnType<typeof parseQueueStatus>>

export const invitesDescriptor = {
  path: LcuPaths.lobby.receivedInvitations,
  queryKey: lcuQueryKey(LcuPaths.lobby.receivedInvitations),
  parse: parseInvites,
} satisfies LcuQueryDescriptor<ReturnType<typeof parseInvites>>

export const sentInvitesDescriptor = {
  path: LcuPaths.lobby.invitations,
  queryKey: lcuQueryKey(LcuPaths.lobby.invitations),
  parse: parseLobbySentInvites,
} satisfies LcuQueryDescriptor<ReturnType<typeof parseLobbySentInvites>>

export const currentSummonerDescriptor = {
  path: LcuPaths.summoner.currentSummoner,
  queryKey: lcuQueryKey(LcuPaths.summoner.currentSummoner),
  parse: (content: unknown) => readObject(content),
} satisfies LcuQueryDescriptor<ReturnType<typeof readObject>>

export const readyCheckDescriptor = {
  path: LcuPaths.matchmaking.readyCheck,
  queryKey: lcuQueryKey(LcuPaths.matchmaking.readyCheck),
  parse: parseReadyCheck,
} satisfies LcuQueryDescriptor<ReturnType<typeof parseReadyCheck>>

export const queueSearchDescriptor = {
  path: LcuPaths.matchmaking.search,
  queryKey: [...lcuQueryKey(LcuPaths.matchmaking.search), 'search-state'] as const,
  parse: parseQueueSearchState,
  notFoundValue: {},
} satisfies LcuQueryDescriptor<QueueSearchState>

export const gameflowPhaseDescriptor = {
  path: LcuPaths.gameflow.phase,
  queryKey: lcuQueryKey(LcuPaths.gameflow.phase),
  parse: readString,
} satisfies LcuQueryDescriptor<ReturnType<typeof readString>>

export const champSelectSessionDescriptor = {
  path: LcuPaths.champSelect.session,
  queryKey: lcuQueryKey(LcuPaths.champSelect.session),
  parse: (content: unknown) => content as ChampSelectSession,
} satisfies LcuQueryDescriptor<ChampSelectSession>

export const summonerSpellsDescriptor = {
  path: LcuPaths.assetServing.summonerSpells,
  queryKey: lcuQueryKey(LcuPaths.assetServing.summonerSpells),
  parse: (content: unknown) => readArray(content) as SummonerSpell[] | null,
} satisfies LcuQueryDescriptor<SummonerSpell[]>

export const gameQueuesDescriptor = {
  path: LcuPaths.gameQueues.queues,
  queryKey: lcuQueryKey(LcuPaths.gameQueues.queues),
  parse: parseGameQueues,
} satisfies LcuQueryDescriptor<ReturnType<typeof parseGameQueues>>

export const friendsDescriptor = {
  path: LcuPaths.social.friends,
  queryKey: lcuQueryKey(LcuPaths.social.friends),
  parse: parseLcuFriends,
} satisfies LcuQueryDescriptor<Friend[]>

export const friendGroupsDescriptor = {
  path: LcuPaths.social.friendGroups,
  queryKey: lcuQueryKey(LcuPaths.social.friendGroups),
  parse: parseLcuFriendGroups,
} satisfies LcuQueryDescriptor<LcuFriendGroupsMap>

export function useLcuFriends(transport: LcuTransport | null) {
  return useQuery(createLcuQueryOptions(friendsDescriptor, transport))
}

export function useLcuFriendGroups(transport: LcuTransport | null) {
  return useQuery(createLcuQueryOptions(friendGroupsDescriptor, transport))
}

export const perksStylesDescriptor = {
  path: LcuPaths.perks.styles,
  queryKey: lcuQueryKey(LcuPaths.perks.styles),
  parse: readArray,
} satisfies LcuQueryDescriptor<ReturnType<typeof readArray>>

export const perksPagesDescriptor = {
  path: LcuPaths.perks.pages,
  queryKey: lcuQueryKey(LcuPaths.perks.pages),
  parse: parsePerkPages,
} satisfies LcuQueryDescriptor<ReturnType<typeof parsePerkPages>>

export const perksCurrentPageDescriptor = {
  path: LcuPaths.perks.currentPage,
  queryKey: lcuQueryKey(LcuPaths.perks.currentPage),
  parse: readObject,
} satisfies LcuQueryDescriptor<ReturnType<typeof readObject>>

export function createSkinInventoryDescriptor(summonerId: number) {
  const path = LcuPaths.champions.inventorySkinsMinimal(summonerId)

  return {
    path,
    queryKey: lcuQueryKey(path),
    parse: parseSkinInventory,
  } satisfies LcuQueryDescriptor<ReturnType<typeof parseSkinInventory>>
}

export const suggestedPlayersDescriptor = {
  path: LcuPaths.suggestedPlayers.suggestedPlayers,
  queryKey: lcuQueryKey(LcuPaths.suggestedPlayers.suggestedPlayers),
  parse: readArray,
} satisfies LcuQueryDescriptor<ReturnType<typeof readArray>>

export function platformConfigDescriptor(namespace: string, key: string) {
  const path = LcuPaths.platformConfig.namespaceKey(namespace, key)

  return {
    path,
    queryKey: lcuQueryKey(path),
    parse: readString,
  } satisfies LcuQueryDescriptor<ReturnType<typeof readString>>
}

export const rerollPointsDescriptor = {
  path: LcuPaths.summoner.currentSummonerRerollPoints,
  queryKey: lcuQueryKey(LcuPaths.summoner.currentSummonerRerollPoints),
  parse: parseRerollPoints,
} satisfies LcuQueryDescriptor<ReturnType<typeof parseRerollPoints>>
