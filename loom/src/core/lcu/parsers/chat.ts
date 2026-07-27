import { fallback, type InferOutput, object, optional, string, union } from 'valibot'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from './base'

const OptionalStringSchema = fallback(optional(string()), undefined)
const OptionalNumberSchema = fallback(optional(finiteNumber), undefined)

const ChatParticipantSchema = object({
  id: string(),
  name: OptionalStringSchema,
})

const ChatParticipantEntrySchema = union([ChatParticipantSchema, string()])

const ChatConversationRecordSchema = object({
  id: string(),
  lastMessage: fallback(
    optional(
      object({
        body: OptionalStringSchema,
        fromPuuid: OptionalStringSchema,
        timestamp: fallback(optional(union([finiteNumber, string()])), undefined),
      }),
    ),
    undefined,
  ),
  name: OptionalStringSchema,
  participants: fallback(optional(unknownArray), []),
  type: string(),
  unreadCount: OptionalNumberSchema,
  unreadMessageCount: OptionalNumberSchema,
})

const ChatMessageRecordSchema = object({
  body: string(),
  fromId: OptionalStringSchema,
  fromPuuid: fallback(optional(string()), ''),
  id: string(),
  timestamp: union([finiteNumber, string()]),
  type: fallback(optional(string()), ''),
})

export interface LcuConversation {
  id: string
  lastMessage?: string
  lastMessageFromPuuid?: string
  lastMessageTimestamp?: number
  name?: string
  participantNames: string[]
  participantPuuids: string[]
  type: string
  unreadCount: number
}

export interface LcuConversationMessage {
  body: string
  fromPuuid: string
  id: string
  timestamp: number
  type: string
}

function readParticipants(participants: unknown[]): Pick<LcuConversation, 'participantNames' | 'participantPuuids'> {
  const parsedParticipants = participants.flatMap((entry): InferOutput<typeof ChatParticipantEntrySchema>[] => {
    const participant = parseOrNull(ChatParticipantEntrySchema, entry)

    return participant ? [participant] : []
  })

  return {
    participantNames: parsedParticipants.flatMap((participant): string[] => {
      if (typeof participant === 'string' || participant.name === undefined) {
        return []
      }

      return [participant.name]
    }),
    participantPuuids: parsedParticipants.map((participant) => {
      return typeof participant === 'string' ? participant : participant.id
    }),
  }
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

    const participants = readParticipants(conversation.participants ?? [])

    return [
      {
        id: conversation.id,
        lastMessage: conversation.lastMessage?.body,
        lastMessageFromPuuid: conversation.lastMessage?.fromPuuid,
        lastMessageTimestamp: conversation.lastMessage?.timestamp
          ? (readTimestamp(conversation.lastMessage.timestamp) ?? undefined)
          : undefined,
        name: conversation.name,
        participantNames: participants.participantNames,
        participantPuuids: participants.participantPuuids,
        type: conversation.type,
        unreadCount: conversation.unreadMessageCount ?? conversation.unreadCount ?? 0,
      },
    ]
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

    return [
      {
        body: message.body,
        fromPuuid: message.fromPuuid ?? '',
        id: message.id,
        timestamp,
        type: message.type ?? '',
      },
    ]
  })
}
