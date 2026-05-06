import type { ChampSelectAction, ChampSelectMember, ChampSelectSession, ChampSelectTimer } from '@/features/champ-select/champ-select-store'

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
    actorCellId,
    championId,
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
    cellId,
    championId,
    championPickIntent: readOptionalNumber(member.championPickIntent),
    displayName: readString(member.displayName) ?? undefined,
    selectedSkinId: readOptionalNumber(member.selectedSkinId),
    spell1Id: readOptionalNumber(member.spell1Id),
    spell2Id: readOptionalNumber(member.spell2Id),
    summonerId: readOptionalNumber(member.summonerId),
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

function parseNumberArray(content: unknown): number[] | undefined {
  const values = readArray(content)
  if (!values) {
    return undefined
  }

  const numbers: number[] = []
  for (const value of values) {
    const parsedValue = readNumber(value)
    if (parsedValue === null) {
      return undefined
    }
    numbers.push(parsedValue)
  }

  return numbers
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
    benchChampionIds: parseNumberArray(session.benchChampionIds),
    benchEnabled: readBoolean(session.benchEnabled) ?? undefined,
    gameMode: readString(session.gameMode) ?? undefined,
    localPlayerCellId: readOptionalNumber(session.localPlayerCellId),
    mapId: readOptionalNumber(session.mapId),
    myTeam,
    queueId: readOptionalNumber(session.queueId),
    theirTeam,
    timer,
  }
}
