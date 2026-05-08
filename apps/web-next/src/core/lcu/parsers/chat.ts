import * as v from 'valibot'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from './base'

const OptionalStringSchema = v.fallback(v.optional(v.string()), undefined)
const OptionalNumberSchema = v.fallback(v.optional(finiteNumber), undefined)

const ChatParticipantSchema = v.object({
  id: v.string(),
  name: OptionalStringSchema,
})

const ChatConversationRecordSchema = v.object({
  id: v.string(),
  lastMessage: v.fallback(v.optional(v.object({ body: OptionalStringSchema })), undefined),
  participants: v.fallback(v.optional(unknownArray), []),
  type: v.string(),
  unreadCount: OptionalNumberSchema,
})

const ChatMessageRecordSchema = v.object({
  body: v.string(),
  fromId: OptionalStringSchema,
  fromPuuid: v.string(),
  id: v.string(),
  timestamp: v.union([finiteNumber, v.string()]),
})

export type LcuConversation = {
  id: string
  participantPuuids: string[]
  type: string
}

export type LcuConversationMessage = {
  body: string
  fromPuuid: string
  id: string
  timestamp: number
}

function readParticipantPuuids(participants: unknown[]): string[] {
  return participants.flatMap((entry): string[] => {
    const participant = parseObjectOrNull(ChatParticipantSchema, entry)
    return participant ? [participant.id] : []
  })
}

function readTimestamp(timestamp: number | string): number | null {
  if (typeof timestamp === 'number') {
    return timestamp
  }

  const parsed = Date.parse(timestamp)
  return Number.isFinite(parsed) ? parsed : null
}

export function parseLcuConversations(content: unknown): LcuConversation[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((entry): LcuConversation[] => {
    const conversation = parseObjectOrNull(ChatConversationRecordSchema, entry)
    if (!conversation) {
      return []
    }

    return [{
      id: conversation.id,
      participantPuuids: readParticipantPuuids(conversation.participants ?? []),
      type: conversation.type,
    }]
  })
}

export function parseLcuConversationMessages(content: unknown): LcuConversationMessage[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((entry): LcuConversationMessage[] => {
    const message = parseObjectOrNull(ChatMessageRecordSchema, entry)
    if (!message) {
      return []
    }

    const timestamp = readTimestamp(message.timestamp)
    if (timestamp === null) {
      return []
    }

    return [{
      body: message.body,
      fromPuuid: message.fromPuuid,
      id: message.id,
      timestamp,
    }]
  })
}
