import { readNumber, readObject } from './base'

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
