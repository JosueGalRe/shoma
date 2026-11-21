import {
  array,
  boolean,
  fallback,
  type InferInput,
  type InferOutput,
  literal,
  nullable,
  object,
  optional,
  pipe,
  record,
  safeParse,
  string,
  transform,
  union,
} from 'valibot'

import { InvitationId, QueueId, SummonerId } from '@/core/types/branded'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from './base'

import type { GameMode } from './lobby-types'
import type { AssertSchemaContract, SchemaContractViolations } from './schema-contract'
import type { LCUTypes } from '@shoma/protocol-contract'

const LobbyRoleSchema = union([
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

const OptionalLobbyRoleSchema = fallback(optional(LobbyRoleSchema), 'UNSELECTED')

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

// Swift Play: the champion, skin, position, rune page (as JSON) and spells of each of a player's two options
const QuickPlaySlotSchema = object({
  championId: fallback(finiteNumber, 0),
  perks: fallback(string(), ''),
  positionPreference: fallback(string(), 'UNSELECTED'),
  skinId: fallback(finiteNumber, 0),
  spell1: fallback(finiteNumber, 0),
  spell2: fallback(finiteNumber, 0),
})

const LobbyMemberRecordSchema = object({
  allowedInviteOthers: OptionalBooleanSchema,
  displayName: OptionalStringSchema,
  fifthPositionPreference: OptionalLobbyRoleSchema,
  firstPositionPreference: fallback(optional(LobbyRoleSchema), 'UNSELECTED'),
  fourthPositionPreference: OptionalLobbyRoleSchema,
  gameName: OptionalStringSchema,
  isLeader: OptionalBooleanSchema,
  isLocalMember: OptionalBooleanSchema,
  // Swift Play's party ready is memberData.isPlayerReady, the string "true"
  memberData: fallback(optional(record(string(), string())), undefined),
  name: OptionalStringSchema,
  playerSlots: fallback(optional(array(QuickPlaySlotSchema)), []),
  profileIconId: OptionalNumberSchema,
  puuid: OptionalStringSchema,
  secondPositionPreference: fallback(optional(LobbyRoleSchema), 'UNSELECTED'),
  summonerIconId: OptionalNumberSchema,
  summonerId: SummonerIdSchema,
  summonerName: OptionalStringSchema,
  tagLine: OptionalStringSchema,
  thirdPositionPreference: OptionalLobbyRoleSchema,
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
  // False while a restriction keeps the party out of matchmaking; the client disables its search with it
  canStartActivity: fallback(optional(boolean()), true),
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
  restrictions: fallback(
    optional(array(object({ restrictionCode: string(), summonerIds: fallback(array(finiteNumber), []) }))),
    [],
  ),
  // The positions matchmaking is short of, which Swift Play marks as priority
  scarcePositions: fallback(optional(array(string())), []),
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

const LobbyMemberSchema = object({
  allowedInviteOthers: boolean(),
  displayName: string(),
  fifthPositionPreference: optional(LobbyRoleSchema),
  firstPositionPreference: LobbyRoleSchema,
  fourthPositionPreference: optional(LobbyRoleSchema),
  iconUrl: NullableStringSchema,
  isLeader: boolean(),
  isLocalMember: boolean(),
  // Swift Play only: ready for the leader to queue, and the two champion options
  isQuickPlayReady: optional(boolean()),
  profileIconId: nullable(finiteNumber),
  // Keys the player's banner, border and challenge tokens
  puuid: NullableStringSchema,
  quickPlaySlots: optional(array(QuickPlaySlotSchema)),
  secondPositionPreference: LobbyRoleSchema,
  summonerId: SummonerIdSchema,
  thirdPositionPreference: optional(LobbyRoleSchema),
})

const LobbyNotificationSchema = object({
  notificationId: string(),
  notificationReason: string(),
})

const LobbyQueueStatusSchema = object({
  isSearching: boolean(),
  queueId: nullable(QueueIdSchema),
  searchState: NullableStringSchema,
})

const LobbyInviteSchema = object({
  fromSummonerId: nullable(SummonerIdSchema),
  fromSummonerName: string(),
  id: InvitationIdSchema,
  state: NullableStringSchema,
})

const LobbySentInviteSchema = object({
  id: InvitationIdSchema,
  state: NullableStringSchema,
  toSummonerId: nullable(SummonerIdSchema),
  toSummonerName: string(),
})

export type LobbyMember = InferOutput<typeof LobbyMemberSchema>
export type QuickPlaySlot = InferOutput<typeof QuickPlaySlotSchema>
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
  4310: 'classic',
  4320: 'coop-vs-ai',
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
          fifthPositionPreference: member.fifthPositionPreference,
          firstPositionPreference: member.firstPositionPreference ?? 'UNSELECTED',
          fourthPositionPreference: member.fourthPositionPreference,
          iconUrl: iconUrls[member.summonerId] ?? null,
          isLeader: member.isLeader ?? false,
          isLocalMember,
          isQuickPlayReady: member.memberData?.isPlayerReady === 'true',
          profileIconId: member.summonerIconId ?? member.profileIconId ?? null,
          puuid: readNonEmptyString(member.puuid) ?? null,
          quickPlaySlots: member.playerSlots,
          secondPositionPreference: member.secondPositionPreference ?? 'UNSELECTED',
          summonerId: member.summonerId,
          thirdPositionPreference: member.thirdPositionPreference,
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
    // Canceled, AbandonedLowPriorityQueue, ServiceError and ServiceShutdown are terminal, not searching
    isSearching: searchState === 'Searching' || searchState === 'Found',
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

const QuickPlayPerksSchema = object({
  perkIds: array(finiteNumber),
  perkStyle: fallback(finiteNumber, 0),
  perkSubStyle: fallback(finiteNumber, 0),
})

export type QuickPlayPerks = InferOutput<typeof QuickPlayPerksSchema>

// A Swift Play option's rune page, which the lobby carries as JSON
export function readQuickPlayPerks(perks: string): QuickPlayPerks | null {
  if (!perks) {
    return null
  }

  try {
    const parsed = safeParse(QuickPlayPerksSchema, JSON.parse(perks))

    return parsed.success ? parsed.output : null
  } catch {
    return null
  }
}

// The keystone, the first of the page's perks
export function readQuickPlayKeystone(perks: string): number | null {
  return readQuickPlayPerks(perks)?.perkIds[0] ?? null
}

export function parseScarcePositions(content: unknown): LobbyRole[] {
  const candidate = parseObjectOrNull(LobbyModePayloadSchema, content)

  return (candidate?.scarcePositions ?? []).map(readRole).filter((role) => {
    return role !== 'UNSELECTED'
  })
}

export interface QueueRestriction {
  code: string
  // The players it is about
  summonerIds: number[]
}

export function parseQueueEligibility(content: unknown): { canStartActivity: boolean; restrictions: QueueRestriction[] } {
  const candidate = parseObjectOrNull(LobbyModePayloadSchema, content)

  return {
    canStartActivity: candidate?.canStartActivity ?? true,
    restrictions: (candidate?.restrictions ?? []).map(({ restrictionCode, summonerIds }) => {
      return { code: restrictionCode, summonerIds }
    }),
  }
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

// The client only reads the newest lobby notification; this is its id when it says the local player was kicked
export function readKickedNotificationId(content: unknown): string | null {
  const notification = parseObjectOrNull(LobbyNotificationSchema, (parseOrNull(unknownArray, content) ?? []).at(-1))

  return notification?.notificationReason === 'KICKED' ? notification.notificationId : null
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

// Contracts with the generated LCU schema; see ./schema-contract
// Allowed: shared name-reader candidates and legacy aliases; v2 participants carry summonerName and summonerIconId
export type LobbyMemberSchemaContract = AssertSchemaContract<
  SchemaContractViolations<
    InferInput<typeof LobbyMemberRecordSchema>,
    LCUTypes.LolLobbyLobbyParticipantDto,
    'displayName' | 'gameName' | 'isLocalMember' | 'name' | 'profileIconId' | 'tagLine'
  >
>

export type LobbyNotificationSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof LobbyNotificationSchema>, LCUTypes.LolLobbyLobbyNotification>
>

export type LobbyMembersSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof LobbyMembersPayloadSchema>, LCUTypes.LolLobbyLobbyDto>
>

export type LobbyModeSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof LobbyModePayloadSchema>, LCUTypes.LolLobbyLobbyDto>
>

// Allowed: legacy aliases; the search resource carries queueId and searchState
export type LobbyQueueSchemaContract = AssertSchemaContract<
  SchemaContractViolations<
    InferInput<typeof LobbyQueuePayloadSchema>,
    LCUTypes.LolMatchmakingMatchmakingSearchResource,
    'lobby' | 'state'
  >
>

// Allowed: legacy aliases; real fields are invitationId and fromSummonerName
export type LobbyReceivedInviteSchemaContract = AssertSchemaContract<
  SchemaContractViolations<
    InferInput<typeof LobbyInviteRecordSchema>,
    LCUTypes.LolLobbyReceivedInvitationDto,
    'fromSummonerDisplayName' | 'id'
  >
>

// Allowed: legacy aliases; real fields are invitationId and toSummonerName
export type LobbySentInviteSchemaContract = AssertSchemaContract<
  SchemaContractViolations<
    InferInput<typeof LobbySentInviteRecordSchema>,
    LCUTypes.LolLobbyLobbyInvitationDto,
    'id' | 'toSummonerDisplayName'
  >
>
