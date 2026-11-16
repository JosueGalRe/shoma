import { boolean, fallback, type InferInput, type InferOutput, object, optional, string, union } from 'valibot'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from './base'

import type { AssertSchemaContract, SchemaContractViolations } from './schema-contract'
import type { LCUTypes } from '@shoma/protocol-contract'

const OptionalStringSchema = fallback(optional(string()), undefined)
const OptionalNumberSchema = fallback(optional(finiteNumber), undefined)

const ChatParticipantSchema = object({
  id: string(),
  name: OptionalStringSchema,
})

const ChatParticipantEntrySchema = union([ChatParticipantSchema, string()])

const ChatConversationRecordSchema = object({
  id: string(),
  isMuted: fallback(optional(boolean()), undefined),
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
  // The client leaves a muted conversation out of its unread badges
  isMuted?: boolean
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
        isMuted: conversation.isMuted,
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

const ChatParticipantRecordSchema = object({
  gameName: OptionalStringSchema,
  icon: OptionalNumberSchema,
  id: string(),
  name: OptionalStringSchema,
  puuid: OptionalStringSchema,
})

export interface LcuChatParticipant {
  iconId: number | undefined
  // The user's chat id, as a message's fromId has it
  id: string
  name: string
  puuid: string
}

// Who is in a group chat: a Clash team's members, by the picture and name its messages show
export function parseLcuChatParticipants(content: unknown): LcuChatParticipant[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((entry): LcuChatParticipant[] => {
    const participant = parseObjectOrNull(ChatParticipantRecordSchema, entry)

    if (!participant) {
      return []
    }

    return [
      {
        iconId: participant.icon,
        id: participant.id,
        name: participant.gameName || participant.name || '',
        puuid: participant.puuid || participant.id.split('@')[0] || participant.id,
      },
    ]
  })
}

// Contracts with the generated LCU schema; see ./schema-contract
// Allowed: participants come from /conversations/{id}/participants (redesign); unreadCount is a dead alias of unreadMessageCount
export type ChatConversationSchemaContract = AssertSchemaContract<
  SchemaContractViolations<
    InferInput<typeof ChatConversationRecordSchema>,
    LCUTypes.LolChatConversationResource,
    'participants' | 'unreadCount'
  >
>

export type ChatParticipantSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof ChatParticipantRecordSchema>, LCUTypes.LolChatUserResource>
>

export type ChatMessageSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof ChatMessageRecordSchema>, LCUTypes.LolChatConversationMessageResource>
>
