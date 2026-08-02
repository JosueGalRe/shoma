import { matchesPuuid } from './friend-utils'

import type { Friend, MapChatMessagesContext, SocialChatMessage } from '../social-types'

export function mapChatMessages(
  messages: { body: string; fromPuuid: string; id: string; timestamp: number; type: string }[],
  context: MapChatMessagesContext,
): SocialChatMessage[] {
  const { activeConversation, currentUserPuuid, friends } = context

  return messages.flatMap((msg) => {
    if (isChatSystemMessage({ text: msg.body, type: msg.type })) {
      return []
    }

    const sender = friends.find((friend) => {
      return matchesPuuid(friend.id, msg.fromPuuid)
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
        senderIconId: sender?.iconId,
        senderName: sender?.name ?? participantName,
        text: msg.body,
        timestamp: msg.timestamp,
        type: msg.type,
      },
    ]
  })
}

export function isChatSystemMessage(message: { text: string; type: string }): boolean {
  return (
    message.type === 'system' ||
    message.text.startsWith('joined_') ||
    message.text.startsWith('left_') ||
    message.text.startsWith('invited_')
  )
}

export function readConversationTitle(conversation: { name?: string; participantNames: string[] }): string | undefined {
  const name = conversation.name?.trim()

  if (name) {
    return name
  }

  return conversation.participantNames.length > 0 ? conversation.participantNames.join(', ') : undefined
}

export function findFriendForConversation(
  conversation: { id: string; participantNames: string[]; participantPuuids: string[] },
  friends: Friend[],
): Friend | undefined {
  if (conversation.participantPuuids.length > 2) {
    return undefined
  }

  return friends.find((friend) => {
    if (matchesPuuid(friend.id, conversation.id)) {
      return true
    }

    const matchesParticipant = conversation.participantPuuids.some((participantId) => {
      return matchesPuuid(friend.id, participantId)
    })

    if (matchesParticipant) {
      return true
    }

    // eslint-disable-next-line react-doctor/js-set-map-lookups -- participantNames is capped at 2 entries right above
    return conversation.participantNames.length <= 2 && conversation.participantNames.includes(friend.name)
  })
}

const messageTimeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
})

export function formatMessageTime(timestamp: number): string {
  return messageTimeFormatter.format(timestamp)
}

const messageDateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function isSameDay(leftTimestamp: number, rightTimestamp: number): boolean {
  const left = new Date(leftTimestamp)
  const right = new Date(rightTimestamp)

  return (
    left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate()
  )
}

export function needsDateDivider(previousTimestamp: number | undefined, timestamp: number): boolean {
  return previousTimestamp === undefined || !isSameDay(previousTimestamp, timestamp)
}

export function formatChatDate(timestamp: number, now: number, labels: { today: string; yesterday: string }): string {
  if (isSameDay(timestamp, now)) {
    return labels.today
  }

  if (isSameDay(timestamp, now - 86_400_000)) {
    return labels.yesterday
  }

  return messageDateFormatter.format(timestamp)
}
