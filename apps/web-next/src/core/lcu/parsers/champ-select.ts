import type { ChampSelectAction, ChampSelectMember, ChampSelectSession, ChampSelectTimer } from '@/features/champ-select/champ-select-store'
import {
  CellId,
  ChampionId,
  QueueId,
  SpellId,
  SummonerId,
  type CellId as CellIdType,
  type ChampionId as ChampionIdType,
  type QueueId as QueueIdType,
  type SpellId as SpellIdType,
  type SummonerId as SummonerIdType,
} from '@/core/types/branded'

import { readArray, readBoolean, readNumber, readObject, readString } from './base'

export type RerollPoints = {
  currentPoints?: number
  maxRolls?: number
  numberOfRolls?: number
  pointsCostToRoll?: number
  pointsToReroll?: number
}

export function parseRerollPoints(content: unknown): RerollPoints | null {
  const candidate = readObject(content)
  if (!candidate) {
    return null
  }

  return {
    currentPoints: readNumber(candidate.currentPoints) ?? undefined,
    maxRolls: readNumber(candidate.maxRolls) ?? undefined,
    numberOfRolls: readNumber(candidate.numberOfRolls) ?? undefined,
    pointsCostToRoll: readNumber(candidate.pointsCostToRoll) ?? undefined,
    pointsToReroll: readNumber(candidate.pointsToReroll) ?? undefined,
  }
}

function readOptionalNumber(value: unknown): number | undefined {
  return readNumber(value) ?? undefined
}

function readOptionalChampionId(value: unknown): ChampionIdType | undefined {
  const championId = readNumber(value)
  return championId === null ? undefined : ChampionId(championId)
}

function readOptionalCellId(value: unknown): CellIdType | undefined {
  const cellId = readNumber(value)
  return cellId === null ? undefined : CellId(cellId)
}

function readOptionalQueueId(value: unknown): QueueIdType | undefined {
  const queueId = readNumber(value)
  return queueId === null ? undefined : QueueId(queueId)
}

function readOptionalSpellId(value: unknown): SpellIdType | undefined {
  const spellId = readNumber(value)
  return spellId === null ? undefined : SpellId(spellId)
}

function readOptionalSummonerId(value: unknown): SummonerIdType | undefined {
  const summonerId = readNumber(value)
  return summonerId === null ? undefined : SummonerId(summonerId)
}

function parseChampSelectAction(content: unknown): ChampSelectAction | null {
  const action = readObject(content)
  if (!action) {
    return null
  }

  const actorCellId = readNumber(action.actorCellId)
  const championId = readNumber(action.championId)
  const completed = readBoolean(action.completed)
  const id = readNumber(action.id)
  const type = readString(action.type)

  if (actorCellId === null || championId === null || completed === null || id === null || (type !== 'pick' && type !== 'ban')) {
    return null
  }

  return {
    actorCellId: CellId(actorCellId),
    championId: ChampionId(championId),
    completed,
    id,
    isAllyAction: readBoolean(action.isAllyAction) ?? undefined,
    isInProgress: readBoolean(action.isInProgress) ?? undefined,
    type,
  }
}

function parseChampSelectActionTurns(content: unknown): ChampSelectAction[][] | null {
  const turns = readArray(content)
  if (!turns) {
    return null
  }

  const parsedTurns: ChampSelectAction[][] = []
  for (const turn of turns) {
    const actions = readArray(turn)
    if (!actions) {
      return null
    }

    const parsedActions: ChampSelectAction[] = []
    for (const action of actions) {
      const parsedAction = parseChampSelectAction(action)
      if (!parsedAction) {
        return null
      }
      parsedActions.push(parsedAction)
    }

    parsedTurns.push(parsedActions)
  }

  return parsedTurns
}

function parseChampSelectMember(content: unknown): ChampSelectMember | null {
  const member = readObject(content)
  if (!member) {
    return null
  }

  const cellId = readNumber(member.cellId)
  const championId = readNumber(member.championId)
  if (cellId === null || championId === null) {
    return null
  }

  return {
    assignedPosition: readString(member.assignedPosition) ?? undefined,
    cellId: CellId(cellId),
    championId: ChampionId(championId),
    championPickIntent: readOptionalChampionId(member.championPickIntent),
    displayName: readString(member.displayName) ?? undefined,
    selectedSkinId: readOptionalNumber(member.selectedSkinId),
    spell1Id: readOptionalSpellId(member.spell1Id),
    spell2Id: readOptionalSpellId(member.spell2Id),
    summonerId: readOptionalSummonerId(member.summonerId),
    team: readOptionalNumber(member.team),
  }
}

function parseChampSelectTeam(content: unknown): ChampSelectMember[] | null {
  const members = readArray(content)
  if (!members) {
    return null
  }

  const parsedMembers: ChampSelectMember[] = []
  for (const member of members) {
    const parsedMember = parseChampSelectMember(member)
    if (!parsedMember) {
      return null
    }
    parsedMembers.push(parsedMember)
  }

  return parsedMembers
}

function parseChampSelectTimer(content: unknown): ChampSelectTimer | null {
  const timer = readObject(content)
  if (!timer) {
    return null
  }

  return {
    adjustedTimeLeftInPhase: readOptionalNumber(timer.adjustedTimeLeftInPhase),
    internalNowInEpochMs: readOptionalNumber(timer.internalNowInEpochMs),
    isInfinite: readBoolean(timer.isInfinite) ?? undefined,
    phase: readString(timer.phase) ?? undefined,
    totalTimeInPhase: readOptionalNumber(timer.totalTimeInPhase),
  }
}

function parseChampionIdArray(content: unknown): ChampionIdType[] | undefined {
  const values = readArray(content)
  if (!values) {
    return undefined
  }

  const championIds: ChampionIdType[] = []
  for (const value of values) {
    const parsedValue = readNumber(value)
    if (parsedValue === null) {
      return undefined
    }
    championIds.push(ChampionId(parsedValue))
  }

  return championIds
}

export function parseChampSelectSession(content: unknown): ChampSelectSession | null {
  const session = readObject(content)
  if (!session) {
    return null
  }

  const actions = parseChampSelectActionTurns(session.actions)
  const timer = parseChampSelectTimer(session.timer)
  const myTeam = parseChampSelectTeam(session.myTeam)
  const theirTeam = parseChampSelectTeam(session.theirTeam)

  if (!actions || !timer || !myTeam || !theirTeam) {
    return null
  }

  return {
    actions,
    benchChampionIds: parseChampionIdArray(session.benchChampionIds),
    benchEnabled: readBoolean(session.benchEnabled) ?? undefined,
    gameMode: readString(session.gameMode) ?? undefined,
    localPlayerCellId: readOptionalCellId(session.localPlayerCellId),
    mapId: readOptionalNumber(session.mapId),
    myTeam,
    queueId: readOptionalQueueId(session.queueId),
    theirTeam,
    timer,
  }
}
