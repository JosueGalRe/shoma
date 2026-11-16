import { matchesPuuid } from './friend-utils'

import type { ChatTarget, ClashTeam, Friend, MapChatMessagesContext, OpenChat, SocialChatMessage } from '../social-types'
import type { LcuConversation } from '@/core/lcu/parsers'

export function mapChatMessages(
  messages: { body: string; fromPuuid: string; id: string; timestamp: number; type: string }[],
  context: MapChatMessagesContext,
): SocialChatMessage[] {
  const { activeConversation, currentUserPuuid, friends, participants = [] } = context
  // A message can come twice, from the list and from its own event
  const unique = [
    ...new Map(
      messages.map((message) => {
        return [message.id, message]
      }),
    ).values(),
  ].toSorted((left, right) => {
    return left.timestamp - right.timestamp
  })

  return unique.flatMap((msg) => {
    if (isChatSystemMessage({ text: msg.body, type: msg.type })) {
      return []
    }

    const sender = friends.find((friend) => {
      return matchesPuuid(friend.id, msg.fromPuuid)
    })
    // A group's members who aren't friends are known by its participants
    const participant = participants.find((candidate) => {
      return matchesPuuid(candidate.puuid, msg.fromPuuid)
    })
    const participantIndex = activeConversation?.participantPuuids.indexOf(msg.fromPuuid)
    const participantName =
      participantIndex !== undefined && participantIndex >= 0
        ? activeConversation?.participantNames[participantIndex]
        : undefined

    return [
      {
        friendId: msg.fromPuuid,
        id: msg.id,
        isOutgoing: msg.fromPuuid === currentUserPuuid,
        senderIconId: sender?.iconId ?? participant?.iconId,
        senderName: sender?.name ?? participant?.name ?? participantName,
        text: msg.body,
        timestamp: msg.timestamp,
        type: msg.type,
      },
    ]
  })
}

// The conversations the client counts in its badges: 1:1s, private rooms and Clash, unless muted
const COUNTED_TYPES = new Set(['chat', 'clash', 'private'])
const DAY_MS = 86_400_000

// Unread messages by conversation id; a friend's 1:1 has the friend's id, as the client's roster reads it
export function readUnreadCounts(conversations: LcuConversation[]): Map<string, number> {
  return new Map(
    conversations.flatMap((conversation): [string, number][] => {
      return COUNTED_TYPES.has(conversation.type) && !conversation.isMuted && conversation.unreadCount > 0
        ? [[conversation.id, conversation.unreadCount]]
        : []
    }),
  )
}

// A day divider goes over the chat's first message and the first of each new day
export function startsChatDay(previous: number | undefined, timestamp: number): boolean {
  return previous === undefined || new Date(previous).toDateString() !== new Date(timestamp).toDateString()
}

// The day divider: "Hoy", "Ayer", "12 nov"; the year only when it isn't this one
export function formatChatDay(timestamp: number, now: number, locale: string): string {
  const date = new Date(timestamp)
  // Rounded, so a day with a daylight saving change still counts as one
  const daysAgo = Math.round((startOfDay(now) - startOfDay(timestamp)) / DAY_MS)

  if (daysAgo === 0 || daysAgo === 1) {
    const day = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-daysAgo, 'day')

    return `${day.charAt(0).toLocaleUpperCase(locale)}${day.slice(1)}`
  }

  const isThisYear = date.getFullYear() === new Date(now).getFullYear()

  return new Intl.DateTimeFormat(locale, isThisYear ? SHORT_DATE : SHORT_DATE_WITH_YEAR).format(date)
}

// A message's own time, in the locale's clock: "14:31", "2:31 PM"
export function formatMessageTime(timestamp: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(timestamp)
}

const SHORT_DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
const SHORT_DATE_WITH_YEAR: Intl.DateTimeFormatOptions = { ...SHORT_DATE, year: 'numeric' }

function startOfDay(timestamp: number): number {
  return new Date(timestamp).setHours(0, 0, 0, 0)
}

// The open chat as of now: the friend or team by id, so their status and name stay live; none once they're gone
export function readChatTarget(chat: OpenChat, friends: Friend[], teams: ClashTeam[]): ChatTarget | null {
  if (chat.kind === 'clash') {
    const team = teams.find((candidate) => {
      return candidate.conversationId === chat.id
    })

    return team ? { kind: 'clash', team } : null
  }

  const friend = friends.find((candidate) => {
    return candidate.id === chat.id
  })

  return friend ? { friend, kind: 'friend' } : null
}

export function isChatSystemMessage(message: { text: string; type: string }): boolean {
  return (
    message.type === 'system' ||
    message.text.startsWith('joined_') ||
    message.text.startsWith('left_') ||
    message.text.startsWith('invited_')
  )
}
