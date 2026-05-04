import { readObject, readString } from './base'

export type Invite = {
  gameMode: string
  id: string
  inviterName: string
}

type LcuInviteRecord = Record<string, unknown>

function readTrimmedString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function readGameMode(record: LcuInviteRecord): string {
  const directMode = readTrimmedString(record.gameMode)
  if (directMode) {
    return directMode
  }

  const nestedConfig = readObject(record.gameConfig)
  const nestedMode = nestedConfig ? readTrimmedString(nestedConfig.gameMode) : null
  if (nestedMode) {
    return nestedMode
  }

  const queueId = nestedConfig?.queueId ?? record.queueId
  if (typeof queueId === 'number') {
    return `Queue ${queueId}`
  }

  const mapId = nestedConfig?.mapId ?? record.mapId
  if (typeof mapId === 'number') {
    return `Map ${mapId}`
  }

  return 'Unknown mode'
}

function readInviterName(record: LcuInviteRecord): string {
  return (
    readTrimmedString(record.inviterName)
    ?? readTrimmedString(record.fromSummonerName)
    ?? readTrimmedString(record.fromDisplayName)
    ?? readTrimmedString(record.fromName)
    ?? 'Unknown player'
  )
}

function readInviteId(record: LcuInviteRecord): string | null {
  return readTrimmedString(record.id) ?? readTrimmedString(record.invitationId) ?? readTrimmedString(record.inviteId)
}

function toInvite(value: unknown): Invite | null {
  const record = readObject(value)
  if (!record) {
    return null
  }

  const id = readInviteId(record)
  if (!id) {
    return null
  }

  return {
    gameMode: readGameMode(record),
    id,
    inviterName: readInviterName(record),
  }
}

export function parseInvites(content: unknown): Invite[] {
  const values = Array.isArray(content) ? content : []

  return values.map(toInvite).filter((invite): invite is Invite => invite !== null)
}

export { readString }
