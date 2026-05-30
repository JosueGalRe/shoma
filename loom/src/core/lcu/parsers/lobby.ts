import {
  boolean,
  fallback,
  type InferOutput,
  literal,
  nullable,
  object,
  optional,
  pipe,
  safeParse,
  string,
  transform,
  union,
} from 'valibot'

import { InvitationId, QueueId, SummonerId } from '@/core/types/branded'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from './base'

export type GameMode =
  | 'ranked-solo-duo'
  | 'ranked-flex'
  | 'normal-draft'
  | 'swiftplay'
  | 'aram'
  | 'arena'
  | 'clash'
  | 'custom'
  | 'coop-vs-ai'

// @knip
export const LobbyRoleSchema = union([
  literal('UNSELECTED'),
  literal('FILL'),
  literal('TOP'),
  literal('JUNGLE'),
  literal('MIDDLE'),
  literal('BOTTOM'),
  literal('UTILITY'),
])
export type LobbyRole = InferOutput<typeof LobbyRoleSchema>
export const lobbyRoles: LobbyRole[] = ['UNSELECTED', 'FILL', 'TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY']

const OptionalStringSchema = fallback(optional(string()), undefined)
const OptionalNumberSchema = fallback(optional(finiteNumber), undefined)
const OptionalBooleanSchema = fallback(optional(boolean()), undefined)
const NullableStringSchema = nullable(string())
const SummonerIdSchema = pipe(
  finiteNumber,
  transform((value) => {
    return SummonerId(value)
  }),
)
const QueueIdSchema = pipe(
  finiteNumber,
  transform((value) => {
    return QueueId(value)
  }),
)
const InvitationIdSchema = pipe(
  string(),
  transform((value) => {
    return InvitationId(value)
  }),
)

const DisplayNameCandidateSchema = object({
  displayName: OptionalStringSchema,
  gameName: OptionalStringSchema,
  name: OptionalStringSchema,
  summonerName: OptionalStringSchema,
  tagLine: OptionalStringSchema,
})

const LobbyMemberRecordSchema = object({
  allowedInviteOthers: OptionalBooleanSchema,
  displayName: OptionalStringSchema,
  firstPositionPreference: fallback(optional(LobbyRoleSchema), 'UNSELECTED'),
  gameName: OptionalStringSchema,
  isLeader: OptionalBooleanSchema,
  isLocalMember: OptionalBooleanSchema,
  name: OptionalStringSchema,
  profileIconId: OptionalNumberSchema,
  secondPositionPreference: fallback(optional(LobbyRoleSchema), 'UNSELECTED'),
  summonerIconId: OptionalNumberSchema,
  summonerId: SummonerIdSchema,
  summonerName: OptionalStringSchema,
  tagLine: OptionalStringSchema,
})

const LobbyMembersPayloadSchema = object({
  localMember: fallback(optional(object({ summonerId: OptionalNumberSchema })), undefined),
  members: fallback(optional(unknownArray), []),
})

const LobbyQueuePayloadSchema = object({
  lobby: fallback(optional(object({ queueId: OptionalNumberSchema })), undefined),
  queueId: OptionalNumberSchema,
  searchState: OptionalStringSchema,
  state: OptionalStringSchema,
})

const LobbyModePayloadSchema = object({
  gameConfig: fallback(
    optional(
      object({
        gameMode: OptionalStringSchema,
        mapId: OptionalNumberSchema,
        queueId: OptionalNumberSchema,
      }),
    ),
    undefined,
  ),
  partyType: OptionalStringSchema,
})

const LobbyInviteRecordSchema = object({
  fromSummonerDisplayName: OptionalStringSchema,
  fromSummonerId: fallback(optional(nullable(finiteNumber)), null),
  fromSummonerName: OptionalStringSchema,
  id: OptionalStringSchema,
  invitationId: OptionalStringSchema,
  state: fallback(optional(NullableStringSchema), null),
})

const LobbySentInviteRecordSchema = object({
  id: OptionalStringSchema,
  invitationId: OptionalStringSchema,
  state: fallback(optional(NullableStringSchema), null),
  toSummonerDisplayName: OptionalStringSchema,
  toSummonerId: fallback(optional(nullable(finiteNumber)), null),
  toSummonerName: OptionalStringSchema,
})

// @knip
export const LobbyMemberSchema = object({
  allowedInviteOthers: boolean(),
  displayName: string(),
  firstPositionPreference: LobbyRoleSchema,
  iconUrl: NullableStringSchema,
  isLeader: boolean(),
  isLocalMember: boolean(),
  profileIconId: nullable(finiteNumber),
  secondPositionPreference: LobbyRoleSchema,
  summonerId: SummonerIdSchema,
})

// @knip
export const LobbyQueueStatusSchema = object({
  isSearching: boolean(),
  queueId: nullable(QueueIdSchema),
  searchState: NullableStringSchema,
})

// @knip
export const LobbyInviteSchema = object({
  fromSummonerId: nullable(SummonerIdSchema),
  fromSummonerName: string(),
  id: InvitationIdSchema,
  state: NullableStringSchema,
})

// @knip
export const LobbySentInviteSchema = object({
  id: InvitationIdSchema,
  state: NullableStringSchema,
  toSummonerId: nullable(SummonerIdSchema),
  toSummonerName: string(),
})

export type LobbyMember = InferOutput<typeof LobbyMemberSchema>
export type LobbyQueueStatus = InferOutput<typeof LobbyQueueStatusSchema>
export type LobbyInvite = InferOutput<typeof LobbyInviteSchema>
export type LobbySentInvite = InferOutput<typeof LobbySentInviteSchema>

export const emptyLobbyQueueStatus: LobbyQueueStatus = {
  isSearching: false,
  queueId: null,
  searchState: null,
}

const queueIdToMode: Partial<Record<number, GameMode>> = {
  1700: 'arena',
  1710: 'arena',
  2400: 'aram',
  400: 'normal-draft',
  420: 'ranked-solo-duo',
  440: 'ranked-flex',
  450: 'aram',
  480: 'swiftplay',
  490: 'normal-draft',
  700: 'clash',
  840: 'coop-vs-ai',
  860: 'coop-vs-ai',
  890: 'coop-vs-ai',
}

function getModeFromQueueId(queueId: number | null | undefined): GameMode | null {
  return queueId === undefined || queueId === null ? null : (queueIdToMode[queueId] ?? null)
}

function getModeFromLcuGameMode(gameMode: string | null | undefined): GameMode | null {
  const normalizedMode = gameMode?.trim().toUpperCase()

  if (!normalizedMode) {
    return null
  }

  if (normalizedMode.includes('CHERRY')) {
    return 'arena'
  }

  if (normalizedMode.includes('ARAM')) {
    return 'aram'
  }

  if (normalizedMode.includes('CLASH')) {
    return 'clash'
  }

  if (normalizedMode.includes('SWIFTPLAY')) {
    return 'swiftplay'
  }

  if (normalizedMode.includes('CUSTOM')) {
    return 'custom'
  }

  if (normalizedMode.includes('RANKED_FLEX')) {
    return 'ranked-flex'
  }

  if (normalizedMode.includes('RANKED_SOLO')) {
    return 'ranked-solo-duo'
  }

  if (normalizedMode.includes('NORMAL_DRAFT') || normalizedMode.includes('CLASSIC')) {
    return 'normal-draft'
  }

  return null
}

function resolveLobbyGameMode({
  gameMode,
  mapId,
  queueId,
}: {
  gameMode?: string | null
  mapId?: number | null
  queueId?: number | null
}): GameMode {
  return getModeFromQueueId(queueId) ?? getModeFromLcuGameMode(gameMode) ?? (mapId === 12 ? 'aram' : 'normal-draft')
}

export function readRole(value: unknown): LobbyRole {
  const parsed = safeParse(LobbyRoleSchema, value)

  return parsed.success ? parsed.output : 'UNSELECTED'
}

function readNonEmptyString(value: string | undefined): string | undefined {
  return value && value.trim().length > 0 ? value.trim() : undefined
}

export function readDisplayName(candidate: unknown): string {
  const parsed = parseObjectOrNull(DisplayNameCandidateSchema, candidate)
  const baseName =
    readNonEmptyString(parsed?.displayName) ??
    readNonEmptyString(parsed?.gameName) ??
    readNonEmptyString(parsed?.name) ??
    readNonEmptyString(parsed?.summonerName) ??
    'Unknown summoner'
  const tagLine = readNonEmptyString(parsed?.tagLine)

  return tagLine && !baseName.includes('#') ? `${baseName}#${tagLine}` : baseName
}

export function parseLobbyMembers(
  content: unknown,
  iconUrls: Record<number, string | null>,
  currentSummoner: Record<string, unknown> | null,
): { members: LobbyMember[]; localSummonerId: InferOutput<typeof SummonerIdSchema> | null } {
  const payload = parseObjectOrNull(LobbyMembersPayloadSchema, content)
  const localSummonerId = payload?.localMember?.summonerId === undefined ? null : SummonerId(payload.localMember.summonerId)

  const members = (payload?.members ?? [])
    .flatMap((entry): LobbyMember[] => {
      const member = parseObjectOrNull(LobbyMemberRecordSchema, entry)

      if (!member) {
        return []
      }

      const isLocalMember = (member.isLocalMember ?? false) || member.summonerId === localSummonerId
      let displayName = readDisplayName(entry)

      if (displayName === 'Unknown summoner' && isLocalMember && currentSummoner) {
        displayName = readDisplayName(currentSummoner)
      }

      return [
        {
          allowedInviteOthers: member.allowedInviteOthers ?? false,
          displayName,
          firstPositionPreference: member.firstPositionPreference ?? 'UNSELECTED',
          iconUrl: iconUrls[member.summonerId] ?? null,
          isLeader: member.isLeader ?? false,
          isLocalMember,
          profileIconId: member.summonerIconId ?? member.profileIconId ?? null,
          secondPositionPreference: member.secondPositionPreference ?? 'UNSELECTED',
          summonerId: member.summonerId,
        },
      ]
    })
    .toSorted((left, right) => {
      if (left.isLocalMember && !right.isLocalMember) {
        return -1
      }

      if (!left.isLocalMember && right.isLocalMember) {
        return 1
      }

      if (left.isLeader && !right.isLeader) {
        return -1
      }

      if (!left.isLeader && right.isLeader) {
        return 1
      }

      return left.displayName.localeCompare(right.displayName)
    })

  return { localSummonerId, members }
}

export function parseQueueStatus(content: unknown, status: number | null): LobbyQueueStatus {
  if (status === 404 || content === null || content === undefined) {
    return emptyLobbyQueueStatus
  }

  const candidate = parseObjectOrNull(LobbyQueuePayloadSchema, content)

  if (!candidate) {
    return emptyLobbyQueueStatus
  }

  const searchState = candidate.searchState ?? candidate.state ?? null
  const rawQueueId = candidate.queueId ?? candidate.lobby?.queueId

  return {
    isSearching: Boolean(searchState && searchState !== 'Invalid' && searchState !== 'Error'),
    queueId: rawQueueId === undefined ? null : QueueId(rawQueueId),
    searchState,
  }
}

export function parseLobbyMode(content: unknown): GameMode {
  const candidate = parseObjectOrNull(LobbyModePayloadSchema, content)

  return resolveLobbyGameMode({
    gameMode: candidate?.gameConfig?.gameMode,
    mapId: candidate?.gameConfig?.mapId,
    queueId: candidate?.gameConfig?.queueId,
  })
}

export function parseLobbyQueueId(content: unknown): number | null {
  const candidate = parseObjectOrNull(LobbyModePayloadSchema, content)

  return candidate?.gameConfig?.queueId ?? null
}

export function parsePartyType(content: unknown): string | null {
  const candidate = parseObjectOrNull(LobbyModePayloadSchema, content)

  return candidate?.partyType ?? null
}

export function parseLobbyInvites(content: unknown): LobbyInvite[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((entry): LobbyInvite[] => {
    const invite = parseObjectOrNull(LobbyInviteRecordSchema, entry)
    const id = invite?.invitationId ?? invite?.id

    if (!invite || !id) {
      return []
    }

    return [
      {
        fromSummonerId: invite.fromSummonerId == null ? null : SummonerId(invite.fromSummonerId),
        fromSummonerName: invite.fromSummonerName ?? invite.fromSummonerDisplayName ?? 'Unknown summoner',
        id: InvitationId(id),
        state: invite.state ?? null,
      },
    ]
  })
}

export function parseLobbySentInvites(content: unknown): LobbySentInvite[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((entry): LobbySentInvite[] => {
    const invite = parseObjectOrNull(LobbySentInviteRecordSchema, entry)
    const id = invite?.invitationId ?? invite?.id

    if (!invite || !id) {
      return []
    }

    return [
      {
        id: InvitationId(id),
        state: invite.state ?? null,
        toSummonerId: invite.toSummonerId == null ? null : SummonerId(invite.toSummonerId),
        toSummonerName: invite.toSummonerName ?? invite.toSummonerDisplayName ?? 'Unknown summoner',
      },
    ]
  })
}
