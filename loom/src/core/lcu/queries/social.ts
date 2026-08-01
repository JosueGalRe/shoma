import { LcuPaths } from '@shoma/protocol-contract'
import { useQuery } from '@tanstack/react-query'
import { fallback, object, optional, string, union, unknown } from 'valibot'

import { Puuid, SummonerId } from '../../types/branded'
import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from '../parsers/base'
import {
  type LcuConversation,
  type LcuConversationMessage,
  parseLcuConversationMessages,
  parseLcuConversations,
} from '../parsers/chat'

import { createLcuQueryOptions, lcuQueryKey } from './descriptor'

import type { Friend, FriendStatus } from '../../../features/social/social-store'
import type { LcuTransport } from '../../relay/lcu-transport'
import type { LcuQueryDescriptor } from './descriptor'

const LcuFriendPresenceSchema = object({
  gameMode: fallback(optional(string()), undefined),
  gameStatus: fallback(optional(string()), undefined),
  mapId: fallback(optional(finiteNumber), undefined),
  queueId: fallback(optional(finiteNumber), undefined),
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
  product: fallback(optional(string()), undefined),
  summonerId: finiteNumber,
})

const LcuFriendGroupSchema = object({
  id: finiteNumber,
  name: string(),
})

export type LcuFriendGroupsMap = Record<number | string, string>

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

function parseFriendActivity(presence: unknown): Pick<Friend, 'activity' | 'gameMode' | 'mapId' | 'queueId'> {
  const value = parseObjectOrNull(LcuFriendPresenceSchema, presence)
  const gameStatus = value?.gameStatus
  const details = { gameMode: value?.gameMode, mapId: value?.mapId, queueId: value?.queueId }

  if (gameStatus === 'inGame') {
    return { activity: 'in-game', ...details }
  }

  if (gameStatus === 'championSelect') {
    return { activity: 'champ-select', ...details }
  }

  if (gameStatus === 'inQueue') {
    return { activity: 'in-queue', ...details }
  }

  if (typeof gameStatus === 'string' && gameStatus.startsWith('hosting_')) {
    return { activity: 'in-lobby', ...details }
  }

  return details
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
    product: value.product,
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

function parseLcuFriendGroups(content: unknown): LcuFriendGroupsMap | null {
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

export function useLcuFriendGroups(transport: LcuTransport | null) {
  return useQuery(createLcuQueryOptions(friendGroupsDescriptor, transport))
}
