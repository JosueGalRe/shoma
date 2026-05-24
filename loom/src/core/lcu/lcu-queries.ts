import { queryOptions, useQuery } from '@tanstack/react-query'
import * as v from 'valibot'

import { LcuPaths } from '@shoma/protocol-contract'

import type { ChampSelectSession } from '../../features/champ-select/champ-select-store'
import type { Friend } from '../../features/social/social-store';
import type { FriendStatus } from '../../features/social/social-store';
import type { LcuTransport } from '../relay/lcu-transport'
import { Puuid, SpellId, SummonerId } from '../types/branded';
import type { SummonerId as SummonerIdType } from '../types/branded';
import { emptyLobbyQueueStatus, parseChampSelectSession, parseGameQueues, parseInvites, parseLobbyMembers, parseLobbyMode, parsePartyType, parseLobbySentInvites, parseLcuConversationMessages, parseLcuConversations, parsePerkPages, parseQueueSearchState, parseQueueStatus, parseReadyCheck, parseRerollPoints, parseSkinInventory, finiteNumber, parseObjectOrNull, parseOrNull, unknownArray, unknownRecord } from './parsers';
import type { LcuConversation } from './parsers';
import type { LcuConversationMessage } from './parsers';
import type { QueueSearchState } from './parsers';

export type LcuQueryDescriptor<TDomain> = {
  path: string
  queryKey: readonly unknown[]
  parse: (content: unknown) => TDomain | null
  enabled?: (transport: LcuTransport | null) => boolean
  notFoundValue?: TDomain | null
  staleTime?: number
}

const NonEmptyStringSchema = v.pipe(v.string(), v.nonEmpty())

// @knip
export const SummonerSpellSchema = v.object({
  description: v.fallback(v.optional(v.string()), undefined),
  gameModes: v.pipe(
    v.fallback(v.optional(unknownArray), undefined),
    v.transform((values) => { return values?.flatMap((mode) => {return (typeof mode === 'string' && mode.length > 0 ? [mode] : [])}); }),
  ),
  iconPath: v.fallback(v.optional(v.string()), undefined),
  id: v.pipe(
    finiteNumber,
    v.transform((value) => { return SpellId(value); }),
  ),
  name: NonEmptyStringSchema,
})

export type SummonerSpell = v.InferOutput<typeof SummonerSpellSchema>

function parseSummonerSpell(value: unknown): SummonerSpell | null {
  return parseObjectOrNull(SummonerSpellSchema, value)
}

const LcuFriendSchema = v.object({
  availability: v.optional(v.unknown()),
  gameName: v.fallback(v.optional(v.string()), undefined),
  gameTag: v.fallback(v.optional(v.string()), undefined),
  groupId: v.fallback(v.optional(v.union([finiteNumber, v.string()])), undefined),
  icon: v.fallback(v.optional(finiteNumber), undefined),
  id: v.string(),
  name: v.fallback(v.optional(v.string()), undefined),
  summonerId: finiteNumber,
})

const LcuFriendGroupSchema = v.object({
  id: finiteNumber,
  name: v.string(),
})

export type LcuFriendGroupsMap = Record<number | string, string>

function normalizeLcuSegment(segment: string): string | number {
  const numericSegment = Number(segment)
  return Number.isInteger(numericSegment) && String(numericSegment) === segment ? numericSegment : segment
}

function normalizeLcuDomain(segment: string): string {
  return segment.startsWith('lol-') ? segment.slice(4) : segment
}

function lcuQueryKey(path: string): readonly unknown[] {
  const segments = path.split('/').filter(Boolean)
  const [rawDomain, , ...resourceSegments] = segments
  const domain = rawDomain ? normalizeLcuDomain(rawDomain) : 'unknown'

  if (domain === 'lobby' && resourceSegments[0] === 'lobby') {
    return ['lcu', domain, 'session'] as const
  }

  if (domain === 'summoner') {
    const summonerId = resourceSegments[1]
    if (resourceSegments[0] === 'summoners' && summonerId) {
      return ['lcu', domain, normalizeLcuSegment(summonerId)] as const
    }

    if (resourceSegments[0] === 'current-summoner') {
      return ['lcu', domain, 'current', ...resourceSegments.slice(1).map(normalizeLcuSegment)] as const
    }
  }

  return ['lcu', domain, ...resourceSegments.map(normalizeLcuSegment)] as const
}

const ErrorStatusSchema = v.object({
  status: finiteNumber,
})

function readErrorStatus(error: unknown): number | null {
  return parseObjectOrNull(ErrorStatusSchema, error)?.status ?? null
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

function parseLcuFriendGroup(groupId: string | number | undefined, groupsMap: LcuFriendGroupsMap): string {
  if (typeof groupId === 'number') {
    return groupsMap[groupId] ?? groupsMap[String(groupId)] ?? 'GENERAL'
  }

  if (typeof groupId === 'string' && groupId.length > 0) {
    return groupsMap[groupId] ?? groupId
  }

  return 'GENERAL'
}

// @knip
export function parseLcuFriend(friend: unknown, groupsMap: LcuFriendGroupsMap = {}): Friend | null {
  const value = parseObjectOrNull(LcuFriendSchema, friend)
  if (!value || value.id.length === 0) {
    return null
  }

  const gameName = value.gameName ?? ''
  const gameTag = value.gameTag ?? ''
  const fallbackName = value.name && value.name.length > 0 ? value.name : 'Unknown Friend'
  const name = gameName.length > 0 && gameTag.length > 0 ? gameName + '#' + gameTag : fallbackName
  const group = parseLcuFriendGroup(value.groupId, groupsMap)

  return {
    group,
    iconId: value.icon,
    id: Puuid(value.id),
    name,
    status: parseFriendStatus(value.availability),
    summonerId: SummonerId(value.summonerId),
  }
}

export function parseLcuFriends(content: unknown, groupsMap: LcuFriendGroupsMap = {}): Friend[] | null {
  const friends = parseOrNull(unknownArray, content)

  if (!friends) {
    return null
  }

  return friends.flatMap((friend) => {
    const parsedFriend = parseLcuFriend(friend, groupsMap)
    return parsedFriend ? [parsedFriend] : []
  })
}

// @knip
export function parseLcuFriendGroups(content: unknown): LcuFriendGroupsMap | null {
  const groups = parseOrNull(unknownArray, content)

  if (!groups) {
    return null
  }

  return groups.reduce<LcuFriendGroupsMap>((groupsMap, group) => {
    const value = parseObjectOrNull(LcuFriendGroupSchema, group)

    if (value && value.name.length > 0) {
      groupsMap[value.id] = value.name
    }

    return groupsMap
  }, {})
}

export function createLcuQueryOptions<TDomain>(descriptor: LcuQueryDescriptor<TDomain>, transport: LcuTransport | null) {
  return queryOptions({
    queryKey: descriptor.queryKey,
    queryFn: async () => {
      if (!transport) {
        throw new Error('No transport')
      }

      try {
        const result = await transport.request(descriptor.path)
        const parsed = result.status === 404 ? (descriptor.notFoundValue ?? null) : descriptor.parse(result.content)
        return parsed
      } catch (error) {
        if (readErrorStatus(error) === 404) {
          return descriptor.notFoundValue ?? null
        }

        throw error
      }
    },
    enabled: descriptor.enabled ? descriptor.enabled(transport) : !!transport,
    staleTime: descriptor.staleTime ?? 5_000,
  })
}

const emptyLobbyMembers: ReturnType<typeof parseLobbyMembers> = {
  members: [],
  localSummonerId: null,
}

const emptyLobbySession = {
  ...emptyLobbyMembers,
  mode: 'normal-draft' as const,
  partyType: null,
}

export const lobbyDescriptor = {
  path: LcuPaths.lobby.lobby,
  queryKey: lcuQueryKey(LcuPaths.lobby.lobby),
  parse: (content: unknown) => { return parseLobbyMembers(content, {}, null); },
  notFoundValue: emptyLobbyMembers,
} satisfies LcuQueryDescriptor<ReturnType<typeof parseLobbyMembers>>

export const lobbySessionDescriptor = {
  path: LcuPaths.lobby.lobby,
  queryKey: lcuQueryKey(LcuPaths.lobby.lobby),
  parse: (content: unknown) => {
    const parsed = parseLobbyMembers(content, {}, null)
    const mode = parseLobbyMode(content)
    const partyType = parsePartyType(content)

    return {
      members: parsed.members,
      localSummonerId: parsed.localSummonerId,
      mode,
      partyType,
    }
  },
  notFoundValue: emptyLobbySession,
} satisfies LcuQueryDescriptor<
  ReturnType<typeof parseLobbyMembers> & {
    mode: ReturnType<typeof parseLobbyMode>
    partyType: ReturnType<typeof parsePartyType>
  }
>

export const queueDescriptor = {
  path: LcuPaths.matchmaking.search,
  queryKey: lcuQueryKey(LcuPaths.matchmaking.search),
  parse: (content: unknown) => { return parseQueueStatus(content, null); },
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
  parse: (content: unknown) => { return parseObjectOrNull(unknownRecord, content); },
} satisfies LcuQueryDescriptor<v.InferOutput<typeof unknownRecord>>

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
  parse: (content: unknown) => { return parseOrNull(v.string(), content); },
} satisfies LcuQueryDescriptor<string>

export const champSelectSessionDescriptor = {
  path: LcuPaths.champSelect.session,
  queryKey: lcuQueryKey(LcuPaths.champSelect.session),
  parse: parseChampSelectSession,
} satisfies LcuQueryDescriptor<ChampSelectSession>

export const summonerSpellsDescriptor = {
  path: LcuPaths.assetServing.summonerSpells,
  queryKey: lcuQueryKey(LcuPaths.assetServing.summonerSpells),
  parse: (content: unknown) => {return parseOrNull(unknownArray, content)?.flatMap((spell) => parseSummonerSpell(spell) ?? []) ?? null},
  staleTime: Infinity,
} satisfies LcuQueryDescriptor<SummonerSpell[]>

export const gameQueuesDescriptor = {
  path: LcuPaths.gameQueues.queues,
  queryKey: lcuQueryKey(LcuPaths.gameQueues.queues),
  parse: parseGameQueues,
  staleTime: Infinity,
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

export const conversationsDescriptor = {
  path: LcuPaths.social.conversations,
  queryKey: lcuQueryKey(LcuPaths.social.conversations),
  parse: parseLcuConversations,
} satisfies LcuQueryDescriptor<LcuConversation[]>

export function conversationMessagesDescriptor(conversationId: string) {
  const path = LcuPaths.social.conversationMessages(conversationId)

  return {
    path,
    queryKey: lcuQueryKey(path),
    parse: parseLcuConversationMessages,
  } satisfies LcuQueryDescriptor<LcuConversationMessage[]>
}

// @knip
export function useLcuFriends(transport: LcuTransport | null) {
  return useQuery(createLcuQueryOptions(friendsDescriptor, transport))
}

export function useLcuFriendGroups(transport: LcuTransport | null) {
  return useQuery(createLcuQueryOptions(friendGroupsDescriptor, transport))
}

// @knip
export const perksStylesDescriptor = {
  path: LcuPaths.perks.styles,
  queryKey: lcuQueryKey(LcuPaths.perks.styles),
  parse: (content: unknown) => { return parseOrNull(unknownArray, content); },
  staleTime: Infinity,
} satisfies LcuQueryDescriptor<v.InferOutput<typeof unknownArray>>

export const perksPagesDescriptor = {
  path: LcuPaths.perks.pages,
  queryKey: lcuQueryKey(LcuPaths.perks.pages),
  parse: parsePerkPages,
} satisfies LcuQueryDescriptor<ReturnType<typeof parsePerkPages>>

export const perksCurrentPageDescriptor = {
  path: LcuPaths.perks.currentPage,
  queryKey: lcuQueryKey(LcuPaths.perks.currentPage),
  parse: (content: unknown) => { return parseOrNull(unknownRecord, content); },
} satisfies LcuQueryDescriptor<v.InferOutput<typeof unknownRecord>>

// @knip
export function createSkinInventoryDescriptor(summonerId: SummonerIdType) {
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
  parse: (content: unknown) => { return parseOrNull(unknownArray, content); },
} satisfies LcuQueryDescriptor<v.InferOutput<typeof unknownArray>>

export function platformConfigDescriptor(namespace: string, key: string) {
  const path = LcuPaths.platformConfig.namespaceKey(namespace, key)

  return {
    path,
    queryKey: lcuQueryKey(path),
    parse: (content: unknown) => { return parseOrNull(v.string(), content); },
    staleTime: Infinity,
  } satisfies LcuQueryDescriptor<string>
}

export const rerollPointsDescriptor = {
  path: LcuPaths.summoner.currentSummonerRerollPoints,
  queryKey: lcuQueryKey(LcuPaths.summoner.currentSummonerRerollPoints),
  parse: parseRerollPoints,
} satisfies LcuQueryDescriptor<ReturnType<typeof parseRerollPoints>>
