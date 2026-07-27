import { LcuPaths } from '@shoma/protocol-contract'
import { queryOptions, useQuery } from '@tanstack/react-query'
import {
  boolean,
  fallback,
  type InferOutput,
  nonEmpty,
  object,
  optional,
  pipe,
  string,
  transform,
  union,
  unknown,
} from 'valibot'

import { Puuid, SpellId, SummonerId, type SummonerId as SummonerIdType } from '../types/branded'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray, unknownRecord } from './parsers/base'
import { parseChampSelectSession, parseRerollPoints } from './parsers/champ-select'
import {
  type LcuConversation,
  type LcuConversationMessage,
  parseLcuConversationMessages,
  parseLcuConversations,
} from './parsers/chat'
import { parseClashTournaments } from './parsers/clash'
import { parseGameQueues } from './parsers/game-queues'
import { parseInvites } from './parsers/invites'
import {
  emptyLobbyQueueStatus,
  parseLobbyMembers,
  parseLobbyMode,
  parseLobbyQueueId,
  parseLobbySentInvites,
  parsePartyType,
  parseQueueStatus,
} from './parsers/lobby'
import { parsePerkPages } from './parsers/perks'
import { parseQueueSearchState, type QueueSearchState } from './parsers/queue'
import { parseReadyCheck } from './parsers/ready-check'
import { parseSkinInventory } from './parsers/skins'

import type { ChampSelectSession } from '../../features/champ-select/champ-select-store'
import type { Friend, FriendStatus } from '../../features/social/social-store'
import type { LcuTransport } from '../relay/lcu-transport'

export interface LcuQueryDescriptor<TDomain> {
  path: string
  queryKey: readonly unknown[]
  parse: (content: unknown) => TDomain | null
  enabled?: (transport: LcuTransport | null) => boolean
  notFoundValue?: TDomain | null
  staleTime?: number
}

const NonEmptyStringSchema = pipe(string(), nonEmpty())

// @knip
export const SummonerSpellSchema = object({
  description: fallback(optional(string()), undefined),
  gameModes: pipe(
    fallback(optional(unknownArray), undefined),
    transform((values) => {
      return values?.flatMap((mode) => {
        return typeof mode === 'string' && mode.length > 0 ? [mode] : []
      })
    }),
  ),
  iconPath: fallback(optional(string()), undefined),
  id: pipe(
    finiteNumber,
    transform((value) => {
      return SpellId(value)
    }),
  ),
  name: NonEmptyStringSchema,
})

export type SummonerSpell = InferOutput<typeof SummonerSpellSchema>

function parseSummonerSpell(value: unknown): SummonerSpell | null {
  return parseObjectOrNull(SummonerSpellSchema, value)
}

const LcuFriendPresenceSchema = object({
  gameMode: fallback(optional(string()), undefined),
  gameStatus: fallback(optional(string()), undefined),
})

const LcuFriendSchema = object({
  availability: optional(unknown()),
  gameName: fallback(optional(string()), undefined),
  gameTag: fallback(optional(string()), undefined),
  groupId: fallback(optional(union([finiteNumber, string()])), undefined),
  icon: fallback(optional(finiteNumber), undefined),
  id: string(),
  lol: fallback(optional(unknown()), undefined),
  name: fallback(optional(string()), undefined),
  summonerId: finiteNumber,
})

const LcuFriendGroupSchema = object({
  id: finiteNumber,
  name: string(),
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
    const [, ...subResource] = resourceSegments

    return ['lcu', domain, 'session', ...subResource] as const
  }

  if (domain === 'summoner') {
    const [, summonerId] = resourceSegments

    if (resourceSegments[0] === 'summoners' && summonerId) {
      return ['lcu', domain, normalizeLcuSegment(summonerId)] as const
    }

    if (resourceSegments[0] === 'current-summoner') {
      return ['lcu', domain, 'current', ...resourceSegments.slice(1).map(normalizeLcuSegment)] as const
    }
  }

  return ['lcu', domain, ...resourceSegments.map(normalizeLcuSegment)] as const
}

const ErrorStatusSchema = object({
  status: finiteNumber,
})

function readErrorStatus(error: unknown): number | null {
  return parseObjectOrNull(ErrorStatusSchema, error)?.status ?? null
}

function parseFriendStatus(availability: unknown): FriendStatus {
  if (availability === 'chat' || availability === 'mobile') {
    return 'online'
  }

  if (availability === 'away') {
    return 'away'
  }

  if (availability === 'dnd') {
    return 'busy'
  }

  return 'offline'
}

function parseFriendActivity(presence: unknown): Pick<Friend, 'activity' | 'gameMode'> {
  const value = parseObjectOrNull(LcuFriendPresenceSchema, presence)
  const gameStatus = value?.gameStatus

  if (gameStatus === 'inGame') {
    return { activity: 'in-game', gameMode: value?.gameMode }
  }

  if (gameStatus === 'championSelect') {
    return { activity: 'champ-select', gameMode: value?.gameMode }
  }

  if (gameStatus === 'inQueue') {
    return { activity: 'in-queue', gameMode: value?.gameMode }
  }

  if (typeof gameStatus === 'string' && gameStatus.startsWith('hosting_')) {
    return { activity: 'in-lobby', gameMode: value?.gameMode }
  }

  return { gameMode: value?.gameMode }
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
  const name = gameName.length > 0 && gameTag.length > 0 ? `${gameName}#${gameTag}` : fallbackName
  const group = parseLcuFriendGroup(value.groupId, groupsMap)

  return {
    ...parseFriendActivity(value.lol),
    group,
    iconId: value.icon,
    id: Puuid(value.id),
    isOnMobile: value.availability === 'mobile',
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
    enabled: descriptor.enabled ? descriptor.enabled(transport) : Boolean(transport),
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
    queryKey: descriptor.queryKey,
    staleTime: descriptor.staleTime ?? 5000,
  })
}

const emptyLobbyMembers: ReturnType<typeof parseLobbyMembers> = {
  localSummonerId: null,
  members: [],
}

const emptyLobbySession = {
  ...emptyLobbyMembers,
  mode: 'normal-draft' as const,
  partyType: null satisfies string | null,
  queueId: null satisfies number | null,
}

export const lobbyDescriptor = {
  notFoundValue: emptyLobbyMembers,
  parse: (content: unknown) => {
    return parseLobbyMembers(content, {}, null)
  },
  path: LcuPaths.lobby.lobby,
  queryKey: lcuQueryKey(LcuPaths.lobby.lobby),
} satisfies LcuQueryDescriptor<ReturnType<typeof parseLobbyMembers>>

export const lobbySessionDescriptor = {
  notFoundValue: emptyLobbySession,
  parse: (content: unknown) => {
    const parsed = parseLobbyMembers(content, {}, null)
    const mode = parseLobbyMode(content)
    const partyType = parsePartyType(content)
    const queueId = parseLobbyQueueId(content)

    return {
      localSummonerId: parsed.localSummonerId,
      members: parsed.members,
      mode,
      partyType,
      queueId,
    }
  },
  path: LcuPaths.lobby.lobby,
  queryKey: lcuQueryKey(LcuPaths.lobby.lobby),
} satisfies LcuQueryDescriptor<
  ReturnType<typeof parseLobbyMembers> & {
    mode: ReturnType<typeof parseLobbyMode>
    partyType: ReturnType<typeof parsePartyType>
    queueId: ReturnType<typeof parseLobbyQueueId>
  }
>

export const queueDescriptor = {
  notFoundValue: emptyLobbyQueueStatus,
  parse: (content: unknown) => {
    return parseQueueStatus(content, null)
  },
  path: LcuPaths.matchmaking.search,
  queryKey: lcuQueryKey(LcuPaths.matchmaking.search),
} satisfies LcuQueryDescriptor<ReturnType<typeof parseQueueStatus>>

export const invitesDescriptor = {
  parse: parseInvites,
  path: LcuPaths.lobby.receivedInvitations,
  queryKey: lcuQueryKey(LcuPaths.lobby.receivedInvitations),
} satisfies LcuQueryDescriptor<ReturnType<typeof parseInvites>>

export const sentInvitesDescriptor = {
  parse: parseLobbySentInvites,
  path: LcuPaths.lobby.invitations,
  queryKey: lcuQueryKey(LcuPaths.lobby.invitations),
} satisfies LcuQueryDescriptor<ReturnType<typeof parseLobbySentInvites>>

export const currentSummonerDescriptor = {
  parse: (content: unknown) => {
    return parseObjectOrNull(unknownRecord, content)
  },
  path: LcuPaths.summoner.currentSummoner,
  queryKey: lcuQueryKey(LcuPaths.summoner.currentSummoner),
} satisfies LcuQueryDescriptor<InferOutput<typeof unknownRecord>>

export const readyCheckDescriptor = {
  parse: parseReadyCheck,
  path: LcuPaths.matchmaking.readyCheck,
  queryKey: lcuQueryKey(LcuPaths.matchmaking.readyCheck),
} satisfies LcuQueryDescriptor<ReturnType<typeof parseReadyCheck>>

export const queueSearchDescriptor = {
  notFoundValue: {},
  parse: parseQueueSearchState,
  path: LcuPaths.matchmaking.search,
  queryKey: [...lcuQueryKey(LcuPaths.matchmaking.search), 'search-state'] as const,
} satisfies LcuQueryDescriptor<QueueSearchState>

export const gameflowPhaseDescriptor = {
  parse: (content: unknown) => {
    return parseOrNull(string(), content)
  },
  path: LcuPaths.gameflow.phase,
  queryKey: lcuQueryKey(LcuPaths.gameflow.phase),
} satisfies LcuQueryDescriptor<string>

export const champSelectSessionDescriptor = {
  parse: parseChampSelectSession,
  path: LcuPaths.champSelect.session,
  queryKey: lcuQueryKey(LcuPaths.champSelect.session),
} satisfies LcuQueryDescriptor<ChampSelectSession>

export const summonerSpellsDescriptor = {
  parse: (content: unknown) => {
    return (
      parseOrNull(unknownArray, content)?.flatMap((spell) => {
        return parseSummonerSpell(spell) ?? []
      }) ?? null
    )
  },
  path: LcuPaths.assetServing.summonerSpells,
  queryKey: lcuQueryKey(LcuPaths.assetServing.summonerSpells),
  staleTime: Infinity,
} satisfies LcuQueryDescriptor<SummonerSpell[]>

export const gameQueuesDescriptor = {
  parse: parseGameQueues,
  path: LcuPaths.gameQueues.queues,
  queryKey: lcuQueryKey(LcuPaths.gameQueues.queues),
  staleTime: Infinity,
} satisfies LcuQueryDescriptor<ReturnType<typeof parseGameQueues>>

export const clashTournamentsDescriptor = {
  parse: parseClashTournaments,
  path: LcuPaths.clash.tournaments,
  queryKey: lcuQueryKey(LcuPaths.clash.tournaments),
  staleTime: 60_000,
} satisfies LcuQueryDescriptor<ReturnType<typeof parseClashTournaments>>

export const clashVisibleDescriptor = {
  parse: (content: unknown): boolean => {
    const parsed = parseOrNull(boolean(), content)

    return parsed ?? false
  },
  path: LcuPaths.clash.visible,
  queryKey: lcuQueryKey(LcuPaths.clash.visible),
  staleTime: 30_000,
} satisfies LcuQueryDescriptor<boolean>

export const friendsDescriptor = {
  parse: parseLcuFriends,
  path: LcuPaths.social.friends,
  queryKey: lcuQueryKey(LcuPaths.social.friends),
} satisfies LcuQueryDescriptor<Friend[]>

export const friendGroupsDescriptor = {
  parse: parseLcuFriendGroups,
  path: LcuPaths.social.friendGroups,
  queryKey: lcuQueryKey(LcuPaths.social.friendGroups),
} satisfies LcuQueryDescriptor<LcuFriendGroupsMap>

export const conversationsDescriptor = {
  parse: parseLcuConversations,
  path: LcuPaths.social.conversations,
  queryKey: lcuQueryKey(LcuPaths.social.conversations),
} satisfies LcuQueryDescriptor<LcuConversation[]>

export function conversationMessagesDescriptor(conversationId: string) {
  const path = LcuPaths.social.conversationMessages(conversationId)

  return {
    parse: parseLcuConversationMessages,
    path,
    queryKey: lcuQueryKey(path),
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
  parse: (content: unknown) => {
    return parseOrNull(unknownArray, content)
  },
  path: LcuPaths.perks.styles,
  queryKey: lcuQueryKey(LcuPaths.perks.styles),
  staleTime: Infinity,
} satisfies LcuQueryDescriptor<InferOutput<typeof unknownArray>>

export const perksPagesDescriptor = {
  parse: parsePerkPages,
  path: LcuPaths.perks.pages,
  queryKey: lcuQueryKey(LcuPaths.perks.pages),
} satisfies LcuQueryDescriptor<ReturnType<typeof parsePerkPages>>

export const perksCurrentPageDescriptor = {
  parse: (content: unknown) => {
    return parseOrNull(unknownRecord, content)
  },
  path: LcuPaths.perks.currentPage,
  queryKey: lcuQueryKey(LcuPaths.perks.currentPage),
} satisfies LcuQueryDescriptor<InferOutput<typeof unknownRecord>>

// @knip
export function createSkinInventoryDescriptor(summonerId: SummonerIdType) {
  const path = LcuPaths.champions.inventorySkinsMinimal(summonerId)

  return {
    parse: parseSkinInventory,
    path,
    queryKey: lcuQueryKey(path),
  } satisfies LcuQueryDescriptor<ReturnType<typeof parseSkinInventory>>
}

export const suggestedPlayersDescriptor = {
  parse: (content: unknown) => {
    return parseOrNull(unknownArray, content)
  },
  path: LcuPaths.suggestedPlayers.suggestedPlayers,
  queryKey: lcuQueryKey(LcuPaths.suggestedPlayers.suggestedPlayers),
} satisfies LcuQueryDescriptor<InferOutput<typeof unknownArray>>

export function platformConfigDescriptor(namespace: string, key: string) {
  const path = LcuPaths.platformConfig.namespaceKey(namespace, key)

  return {
    parse: (content: unknown) => {
      return parseOrNull(string(), content)
    },
    path,
    queryKey: lcuQueryKey(path),
    staleTime: Infinity,
  } satisfies LcuQueryDescriptor<string>
}

export const rerollPointsDescriptor = {
  parse: parseRerollPoints,
  path: LcuPaths.summoner.currentSummonerRerollPoints,
  queryKey: lcuQueryKey(LcuPaths.summoner.currentSummonerRerollPoints),
} satisfies LcuQueryDescriptor<ReturnType<typeof parseRerollPoints>>

export interface RegionLocale {
  locale: string
  region: string
  webLanguage: string
  webRegion: string
}

const RegionLocaleSchema = object({
  locale: fallback(string(), 'en_US'),
  region: fallback(string(), ''),
  webLanguage: fallback(string(), 'en'),
  webRegion: fallback(string(), ''),
})

function parseRegionLocale(content: unknown): RegionLocale {
  const parsed = parseObjectOrNull(RegionLocaleSchema, content)

  return parsed ?? { locale: 'en_US', region: '', webLanguage: 'en', webRegion: '' }
}

export const regionLocaleDescriptor = {
  parse: parseRegionLocale,
  path: '/riotclient/region-locale',
  queryKey: lcuQueryKey('/riotclient/region-locale'),
  staleTime: 60_000,
} satisfies LcuQueryDescriptor<RegionLocale>
