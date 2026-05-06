import { InvitationId, QueueId, SummonerId, type InvitationId as InvitationIdType, type QueueId as QueueIdType, type SummonerId as SummonerIdType } from '@/core/types/branded'

import { readBoolean, readNumber, readObject, readString } from './base'

export type GameMode =
  | 'ranked-solo-duo'
  | 'ranked-flex'
  | 'normal-draft'
  | 'swiftplay'
  | 'aram'
  | 'arena'
  | 'clash'
  | 'custom'

export const lobbyRoles = ['UNSELECTED', 'FILL', 'TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as const

export type LobbyRole = (typeof lobbyRoles)[number]

export type LobbyMember = {
  allowedInviteOthers: boolean
  displayName: string
  firstPositionPreference: LobbyRole
  iconUrl: string | null
  isLeader: boolean
  isLocalMember: boolean
  profileIconId: number | null
  secondPositionPreference: LobbyRole
  summonerId: SummonerIdType
}

export type LobbyQueueStatus = {
  isSearching: boolean
  queueId: QueueIdType | null
  searchState: string | null
}

export type LobbyInvite = {
  fromSummonerId: SummonerIdType | null
  fromSummonerName: string
  id: InvitationIdType
  state: string | null
}

export type LobbySentInvite = {
  id: InvitationIdType
  state: string | null
  toSummonerId: SummonerIdType | null
  toSummonerName: string
}

export const emptyLobbyQueueStatus: LobbyQueueStatus = {
  isSearching: false,
  queueId: null,
  searchState: null,
}

const queueIdToMode: Partial<Record<number, GameMode>> = {
  400: 'normal-draft',
  420: 'ranked-solo-duo',
  440: 'ranked-flex',
  450: 'aram',
  480: 'swiftplay',
  490: 'normal-draft',
  700: 'clash',
  1700: 'arena',
  1710: 'arena',
}

function getModeFromQueueId(queueId: number | null | undefined): GameMode | null {
  if (typeof queueId !== 'number' || !Number.isFinite(queueId)) {
    return null
  }

  return queueIdToMode[queueId] ?? null
}

function getModeFromLcuGameMode(gameMode: string | null | undefined): GameMode | null {
  const normalizedMode = gameMode?.trim().toUpperCase()
  if (!normalizedMode) {
    return null
  }

  if (normalizedMode.includes('CHERRY')) return 'arena'
  if (normalizedMode.includes('ARAM')) return 'aram'
  if (normalizedMode.includes('CLASH')) return 'clash'
  if (normalizedMode.includes('SWIFTPLAY')) return 'swiftplay'
  if (normalizedMode.includes('CUSTOM')) return 'custom'
  if (normalizedMode.includes('RANKED_FLEX')) return 'ranked-flex'
  if (normalizedMode.includes('RANKED_SOLO')) return 'ranked-solo-duo'
  if (normalizedMode.includes('NORMAL_DRAFT') || normalizedMode.includes('CLASSIC')) return 'normal-draft'

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

function isLobbyRole(value: unknown): value is LobbyRole {
  return typeof value === 'string' && lobbyRoles.includes(value as LobbyRole)
}

export function readRole(value: unknown): LobbyRole {
  return isLobbyRole(value) ? value : 'UNSELECTED'
}

export function readDisplayName(candidate: Record<string, unknown>): string {
  const baseName =
    readString(candidate.displayName) ??
    readString(candidate.gameName) ??
    readString(candidate.name) ??
    readString(candidate.summonerName) ??
    'Unknown summoner'
  const tagLine = readString(candidate.tagLine)

  return tagLine && !baseName.includes('#') ? `${baseName}#${tagLine}` : baseName
}

export function parseLobbyMembers(
  content: unknown,
  iconUrls: Record<number, string | null>,
  currentSummoner: Record<string, unknown> | null,
): { members: LobbyMember[], localSummonerId: SummonerIdType | null } {
  const candidate = readObject(content)
  const rawMembers = Array.isArray(candidate?.members) ? candidate.members : []
  const localMemberPayload = readObject(candidate?.localMember)
  const rawLocalSummonerId = readNumber(localMemberPayload?.summonerId)
  const localSummonerId = rawLocalSummonerId === null ? null : SummonerId(rawLocalSummonerId)

  const members = rawMembers
    .map((entry): LobbyMember | null => {
      const member = readObject(entry)
      if (!member) {
        return null
      }

      const rawSummonerId = readNumber(member.summonerId)
      if (rawSummonerId === null) {
        return null
      }
      const summonerId = SummonerId(rawSummonerId)

      const isLocalMember = (readBoolean(member.isLocalMember) ?? false) || summonerId === localSummonerId
      const profileIconId = readNumber(member.summonerIconId) ?? readNumber(member.profileIconId)
      let displayName = readDisplayName(member)

      if (displayName === 'Unknown summoner' && isLocalMember && currentSummoner) {
        displayName = readDisplayName(currentSummoner)
      }

      return {
        allowedInviteOthers: readBoolean(member.allowedInviteOthers) ?? false,
        displayName,
        firstPositionPreference: readRole(member.firstPositionPreference),
        iconUrl: iconUrls[summonerId] ?? null,
        isLeader: readBoolean(member.isLeader) ?? false,
        isLocalMember,
        profileIconId,
        secondPositionPreference: readRole(member.secondPositionPreference),
        summonerId,
      }
    })
    .filter((member): member is LobbyMember => member !== null)
    .sort((left, right) => {
      if (left.isLocalMember && !right.isLocalMember) return -1
      if (!left.isLocalMember && right.isLocalMember) return 1
      if (left.isLeader && !right.isLeader) return -1
      if (!left.isLeader && right.isLeader) return 1
      return left.displayName.localeCompare(right.displayName)
    })

  return { members, localSummonerId }
}

export function parseQueueStatus(content: unknown, status: number | null): LobbyQueueStatus {
  if (status === 404 || content === null || content === undefined) {
    return emptyLobbyQueueStatus
  }

  const candidate = readObject(content)
  if (!candidate) {
    return emptyLobbyQueueStatus
  }

  const searchState = readString(candidate.searchState) ?? readString(candidate.state)
  const rawQueueId = readNumber(candidate.queueId) ?? readNumber(readObject(candidate.lobby)?.queueId)
  const queueId = rawQueueId === null ? null : QueueId(rawQueueId)

  return {
    isSearching: Boolean(searchState && searchState !== 'Invalid' && searchState !== 'Error'),
    queueId,
    searchState,
  }
}

export function parseLobbyMode(content: unknown): GameMode {
  const candidate = readObject(content)
  const gameConfig = readObject(candidate?.gameConfig)

  return resolveLobbyGameMode({
    gameMode: readString(gameConfig?.gameMode),
    mapId: readNumber(gameConfig?.mapId),
    queueId: readNumber(gameConfig?.queueId),
  })
}

export function parseLobbyInvites(content: unknown): LobbyInvite[] {
  if (!Array.isArray(content)) {
    return []
  }

  return content
    .map((entry): LobbyInvite | null => {
      const invite = readObject(entry)
      if (!invite) {
        return null
      }

      const id = readString(invite.invitationId) ?? readString(invite.id)
      if (!id) {
        return null
      }

      const fromSummonerId = readNumber(invite.fromSummonerId)

      return {
        fromSummonerId: fromSummonerId === null ? null : SummonerId(fromSummonerId),
        fromSummonerName: readString(invite.fromSummonerName) ?? readString(invite.fromSummonerDisplayName) ?? 'Unknown summoner',
        id: InvitationId(id),
        state: readString(invite.state),
      }
    })
    .filter((invite): invite is LobbyInvite => invite !== null)
}

export function parseLobbySentInvites(content: unknown): LobbySentInvite[] {
  if (!Array.isArray(content)) {
    return []
  }

  return content
    .map((entry): LobbySentInvite | null => {
      const invite = readObject(entry)
      if (!invite) {
        return null
      }

      const id = readString(invite.invitationId) ?? readString(invite.id)
      if (!id) {
        return null
      }

      const toSummonerId = readNumber(invite.toSummonerId)

      return {
        id: InvitationId(id),
        state: readString(invite.state),
        toSummonerId: toSummonerId === null ? null : SummonerId(toSummonerId),
        toSummonerName: readString(invite.toSummonerName) ?? readString(invite.toSummonerDisplayName) ?? 'Unknown summoner',
      }
    })
    .filter((invite): invite is LobbySentInvite => invite !== null)
}
