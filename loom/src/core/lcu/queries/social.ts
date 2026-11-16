import { LcuPaths } from '@shoma/protocol-contract'
import { useQuery } from '@tanstack/react-query'
import { boolean, fallback, type InferInput, object, optional, pipe, regex, string, transform, union, unknown } from 'valibot'

import { Puuid, SummonerId } from '../../types/branded'
import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from '../parsers/base'
import {
  type LcuChatParticipant,
  type LcuConversation,
  type LcuConversationMessage,
  parseLcuChatParticipants,
  parseLcuConversationMessages,
  parseLcuConversations,
} from '../parsers/chat'
import { type ChatSettings, parseChatSettings } from '../parsers/settings'

import { createLcuQueryOptions } from './descriptor'
import { lcuQueryKey } from './descriptor-utils'

import type { Friend, FriendStatus } from '../../../features/social/social-types'
import type { LcuTransport } from '../../relay/lcu-transport'
import type { AssertSchemaContract, SchemaContractViolations } from '../parsers/schema-contract'
import type { LcuQueryDescriptor } from './descriptor-types'
import type { FriendRequest, LcuFriendGroup } from './social-types'
import type { LCUTypes } from '@shoma/protocol-contract'

// The chat presence map (`lol`) is Record<string, string>: ids arrive as numeric strings
const PresenceIdSchema = union([
  finiteNumber,
  pipe(
    string(),
    regex(/^\d+$/),
    transform((value) => {
      return Number(value)
    }),
  ),
])

const LcuFriendPresenceSchema = object({
  gameMode: fallback(optional(string()), undefined),
  gameStatus: fallback(optional(string()), undefined),
  mapId: fallback(optional(PresenceIdSchema), undefined),
  queueId: fallback(optional(PresenceIdSchema), undefined),
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

const LcuFriendRequestSchema = object({
  direction: fallback(string(), ''),
  gameName: fallback(string(), ''),
  icon: fallback(optional(finiteNumber), undefined),
  pid: string(),
  tagLine: fallback(string(), ''),
})

const LcuFriendGroupSchema = object({
  id: finiteNumber,
  // The client's own OFFLINE group: loom groups offline friends itself, as the settings say
  isMetaGroup: fallback(optional(boolean()), undefined),
  name: string(),
  priority: fallback(finiteNumber, 0),
})

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

function parseLcuFriendGroup(groupId: string | number | undefined, groups: readonly LcuFriendGroup[]): string {
  const folder = groups.find(({ id }) => {
    return String(id) === String(groupId)
  })

  if (folder) {
    return folder.name
  }

  return typeof groupId === 'string' && groupId.length > 0 ? groupId : 'GENERAL'
}

export function parseLcuFriend(friend: unknown, groups: readonly LcuFriendGroup[] = []): Friend | null {
  const value = parseObjectOrNull(LcuFriendSchema, friend)

  if (!value || value.id.length === 0) {
    return null
  }

  const gameName = value.gameName ?? ''
  const gameTag = value.gameTag ?? ''
  const fallbackName = value.name && value.name.length > 0 ? value.name : 'Unknown Friend'
  const name = gameName.length > 0 && gameTag.length > 0 ? `${gameName}#${gameTag}` : fallbackName
  const group = parseLcuFriendGroup(value.groupId, groups)

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

export function parseLcuFriends(content: unknown, groups: readonly LcuFriendGroup[] = []): Friend[] | null {
  const friends = parseOrNull(unknownArray, content)

  if (!friends) {
    return null
  }

  return friends.flatMap((friend) => {
    const parsedFriend = parseLcuFriend(friend, groups)

    return parsedFriend ? [parsedFriend] : []
  })
}

// The client's order: the highest priority first, then by name
function parseLcuFriendGroups(content: unknown): LcuFriendGroup[] | null {
  const groups = parseOrNull(unknownArray, content)

  if (!groups) {
    return null
  }

  return groups
    .flatMap((group) => {
      const value = parseObjectOrNull(LcuFriendGroupSchema, group)

      return value && value.name.length > 0 && !value.isMetaGroup
        ? [{ id: value.id, name: value.name, priority: value.priority }]
        : []
    })
    .toSorted((left, right) => {
      return right.priority - left.priority || left.name.toLowerCase().localeCompare(right.name.toLowerCase())
    })
}

function parseFriendRequests(content: unknown): FriendRequest[] | null {
  const requests = parseOrNull(unknownArray, content)

  return (
    requests?.flatMap((request) => {
      const value = parseObjectOrNull(LcuFriendRequestSchema, request)

      return value
        ? [{ direction: value.direction, iconId: value.icon, id: value.pid, name: `${value.gameName}#${value.tagLine}` }]
        : []
    }) ?? null
  )
}

export const friendRequestsDescriptor = {
  parse: parseFriendRequests,
  path: LcuPaths.social.friendRequests,
  queryKey: lcuQueryKey(LcuPaths.social.friendRequests),
} satisfies LcuQueryDescriptor<FriendRequest[]>

export const chatSettingsDescriptor = {
  parse: parseChatSettings,
  path: LcuPaths.social.settings,
  queryKey: lcuQueryKey(LcuPaths.social.settings),
} satisfies LcuQueryDescriptor<ChatSettings>

export const friendsDescriptor = {
  parse: parseLcuFriends,
  path: LcuPaths.social.friends,
  queryKey: lcuQueryKey(LcuPaths.social.friends),
} satisfies LcuQueryDescriptor<Friend[]>

export const friendGroupsDescriptor = {
  parse: parseLcuFriendGroups,
  path: LcuPaths.social.friendGroups,
  queryKey: lcuQueryKey(LcuPaths.social.friendGroups),
} satisfies LcuQueryDescriptor<LcuFriendGroup[]>

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

export function conversationParticipantsDescriptor(conversationId: string) {
  const path = LcuPaths.social.conversationParticipants(conversationId)

  return {
    parse: parseLcuChatParticipants,
    path,
    queryKey: lcuQueryKey(path),
  } satisfies LcuQueryDescriptor<LcuChatParticipant[]>
}

export function useLcuFriendGroups(transport: LcuTransport | null) {
  return useQuery(createLcuQueryOptions(friendGroupsDescriptor, transport))
}

// Contracts with the generated LCU schema; see ./schema-contract
export type FriendSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof LcuFriendSchema>, LCUTypes.LolChatFriendResource>
>

export type FriendPresenceSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof LcuFriendPresenceSchema>, LCUTypes.LolChatFriendResource['lol']>
>

export type FriendRequestSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof LcuFriendRequestSchema>, LCUTypes.LolChatFriendRequestResource>
>

export type FriendGroupSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof LcuFriendGroupSchema>, LCUTypes.LolChatGroupResource>
>
