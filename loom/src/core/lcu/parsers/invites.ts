import { fallback, type InferOutput, object, optional, pipe, string, transform } from 'valibot'

import { InvitationId } from '@/core/types/branded'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from './base'

const OptionalStringSchema = fallback(optional(string()), undefined)
const OptionalNumberSchema = fallback(optional(finiteNumber), undefined)
const InvitationIdSchema = pipe(
  string(),
  transform((value) => {
    return InvitationId(value)
  }),
)

const GameConfigSchema = object({
  gameMode: OptionalStringSchema,
  mapId: OptionalNumberSchema,
  queueId: OptionalNumberSchema,
})

const InviteRecordSchema = object({
  fromDisplayName: OptionalStringSchema,
  fromName: OptionalStringSchema,
  fromSummonerName: OptionalStringSchema,
  gameConfig: fallback(optional(GameConfigSchema), undefined),
  gameMode: OptionalStringSchema,
  id: OptionalStringSchema,
  invitationId: OptionalStringSchema,
  inviteId: OptionalStringSchema,
  inviterName: OptionalStringSchema,
  mapId: OptionalNumberSchema,
  queueId: OptionalNumberSchema,
})

// @knip
export const InviteSchema = object({
  gameMode: string(),
  id: InvitationIdSchema,
  inviterName: string(),
})

export type Invite = InferOutput<typeof InviteSchema>

type InviteRecord = InferOutput<typeof InviteRecordSchema>

function readTrimmedString(value: string | undefined): string | null {
  const trimmed = value?.trim()

  return trimmed || null
}

function readGameMode(record: InviteRecord): string {
  const directMode = readTrimmedString(record.gameMode)

  if (directMode) {
    return directMode
  }

  const nestedMode = readTrimmedString(record.gameConfig?.gameMode)

  if (nestedMode) {
    return nestedMode
  }

  const queueId = record.gameConfig?.queueId ?? record.queueId

  if (queueId !== undefined) {
    return `Queue ${queueId}`
  }

  const mapId = record.gameConfig?.mapId ?? record.mapId

  if (mapId !== undefined) {
    return `Map ${mapId}`
  }

  return 'Unknown mode'
}

function readInviterName(record: InviteRecord): string {
  return (
    readTrimmedString(record.inviterName) ??
    readTrimmedString(record.fromSummonerName) ??
    readTrimmedString(record.fromDisplayName) ??
    readTrimmedString(record.fromName) ??
    'Unknown player'
  )
}

function readInviteId(record: InviteRecord): string | null {
  return readTrimmedString(record.id) ?? readTrimmedString(record.invitationId) ?? readTrimmedString(record.inviteId)
}

function toInvite(value: unknown): Invite | null {
  const record = parseObjectOrNull(InviteRecordSchema, value)

  if (!record) {
    return null
  }

  const id = readInviteId(record)

  if (!id) {
    return null
  }

  return {
    gameMode: readGameMode(record),
    id: InvitationId(id),
    inviterName: readInviterName(record),
  }
}

export function parseInvites(content: unknown): Invite[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((value) => {
    const invite = toInvite(value)

    return invite ? [invite] : []
  })
}
