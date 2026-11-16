import { isRecord } from '@/lib/type-guards'

import type { SimChat, SimChatMessage, SimFriendRequest } from './sim-types'

export const EMPTY_SIM_CHAT: SimChat = { conversations: [], friendRequests: [], messages: {}, replies: [], unread: {} }

export const REPLY_MS = 1500

// What friends answer, picked at random
const REPLIES = ['dale', 'ya voy', 'una más?', 'invita pues', 'jajaja', 'gg', 'dame 5 min', 'quién juega?']

// The capture comes from an idle evening, nearly everyone offline. Up to two friends of each group get one of these,
// So the list shows its states: in game, champ select, in queue, in a lobby, online, away
const PRESENCES = [
  { availability: 'dnd', lol: { gameStatus: 'inGame', mapId: '11', queueId: '420' } },
  { availability: 'chat', lol: { gameStatus: 'outOfGame' } },
  { availability: 'dnd', lol: { gameStatus: 'championSelect', mapId: '11', queueId: '400' } },
  { availability: 'away', lol: { gameStatus: 'outOfGame' } },
  { availability: 'chat', lol: { gameStatus: 'inQueue', mapId: '12', queueId: '450' } },
  { availability: 'chat', lol: { gameStatus: 'hosting_SWIFTPLAY', mapId: '11', queueId: '480' } },
]
const LIVE_PER_GROUP = 2

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function livenFriends(friends: unknown[]): unknown[] {
  const liveByGroup = new Map<unknown, number>()
  let next = 0

  return friends.map((friend) => {
    if (!isRecord(friend) || friend.availability !== 'offline') {
      return friend
    }

    const live = liveByGroup.get(friend.groupId) ?? 0
    const presence = PRESENCES[next % PRESENCES.length]

    if (live >= LIVE_PER_GROUP || !presence) {
      return friend
    }

    liveByGroup.set(friend.groupId, live + 1)
    next += 1

    return {
      ...friend,
      ...presence,
      displayGroupId: friend.groupId,
      displayGroupName: friend.groupName,
      product: 'league_of_legends',
    }
  })
}

// A conversation's messages: the world's own, else the last one its capture carries
export function readMessages(chat: SimChat, conversation: Record<string, unknown>): SimChatMessage[] {
  const id = readString(conversation.id)
  const own = chat.messages[id]

  if (own) {
    return own
  }

  const last = isRecord(conversation.lastMessage) ? conversation.lastMessage : null
  const timestamp = last ? Date.parse(readString(last.timestamp)) : Number.NaN

  return last && Number.isFinite(timestamp)
    ? [{ body: readString(last.body), fromPid: readString(last.fromPid), id: readString(last.id), timestamp }]
    : []
}

export function messageDto(message: SimChatMessage): Record<string, unknown> {
  return {
    body: message.body,
    fromId: message.fromPid,
    fromPid: message.fromPid,
    fromPuuid: message.fromPid.split('@')[0],
    fromSummonerId: 0,
    id: message.id,
    isHistorical: false,
    timestamp: new Date(message.timestamp).toISOString(),
    type: 'chat',
  }
}

export function conversationDto(chat: SimChat, conversation: Record<string, unknown>): Record<string, unknown> {
  const id = readString(conversation.id)
  const last = readMessages(chat, conversation).at(-1)

  return {
    ...conversation,
    lastMessage: last ? messageDto(last) : null,
    unreadMessageCount: chat.unread[id] ?? 0,
  }
}

export function appendMessage(chat: SimChat, conversation: Record<string, unknown>, message: SimChatMessage): SimChat {
  const id = readString(conversation.id)

  return { ...chat, messages: { ...chat.messages, [id]: [...readMessages(chat, conversation), message] } }
}

export function pickReply(random: () => number): string {
  return REPLIES[Math.floor(random() * REPLIES.length)] ?? 'gg'
}

// The client sends a Riot ID, or a puuid from Recently Played
export function readFriendRequest(body: unknown, recentlyPlayed: unknown[]): SimFriendRequest | null {
  if (!isRecord(body)) {
    return null
  }

  const puuid = readString(body.puuid)

  if (puuid) {
    const player = recentlyPlayed.find((candidate) => {
      return isRecord(candidate) && candidate.puuid === puuid
    })

    return isRecord(player) ? { gameName: readString(player.gameName), puuid, tagLine: readString(player.tagLine) } : null
  }

  const gameName = readString(body.gameName).trim()
  const tagLine = readString(body.tagLine).trim()

  return gameName && tagLine ? { gameName, puuid: `00000000-0000-4000-8000-${String(Date.now()).slice(-12)}`, tagLine } : null
}

export function friendRequestDto(request: SimFriendRequest): Record<string, unknown> {
  return {
    direction: 'out',
    gameName: request.gameName,
    gameTag: request.tagLine,
    icon: -1,
    id: `${request.puuid}@la1.pvp.net`,
    name: '',
    note: '',
    pid: `${request.puuid}@la1.pvp.net`,
    puuid: request.puuid,
    summonerId: 0,
  }
}
