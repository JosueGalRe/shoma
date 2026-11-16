import { matchesPuuid } from './friend-utils'

import type { MapChatMessagesContext, SocialChatMessage } from '../social-types'

export function mapChatMessages(
  messages: { body: string; fromPuuid: string; id: string; timestamp: number; type: string }[],
  context: MapChatMessagesContext,
): SocialChatMessage[] {
  const { activeConversation, currentUserPuuid, friends } = context
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
