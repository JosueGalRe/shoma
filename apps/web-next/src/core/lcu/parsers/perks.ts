import { RuneId, type RuneId as RuneIdType } from '@/core/types/branded'

import { readArray, readBoolean, readNumber, readObject, readString } from './base'

export type PerkPage = {
  id: number
  name: string
  isEditable: boolean
  isActive: boolean
  order: number
  primaryStyleId: RuneIdType
  subStyleId: RuneIdType
  selectedPerkIds: RuneIdType[]
}

function readRuneIdArray(value: unknown): RuneIdType[] | null {
  const values = readArray(value)
  if (!values) {
    return null
  }

  const runeIds: RuneIdType[] = []
  for (const value of values) {
    const number = readNumber(value)
    if (number === null) {
      return null
    }
    runeIds.push(RuneId(number))
  }

  return runeIds
}

export function parsePerkPage(content: unknown): PerkPage | null {
  const candidate = readObject(content)
  if (!candidate) {
    return null
  }

  const id = readNumber(candidate.id)
  const name = readString(candidate.name)
  const isEditable = readBoolean(candidate.isEditable)
  const isActive = readBoolean(candidate.isActive)
  const order = readNumber(candidate.order)
  const primaryStyleId = readNumber(candidate.primaryStyleId)
  const subStyleId = readNumber(candidate.subStyleId)
  const selectedPerkIds = readRuneIdArray(candidate.selectedPerkIds)

  if (
    id === null
    || name === null
    || isEditable === null
    || isActive === null
    || order === null
    || primaryStyleId === null
    || subStyleId === null
    || selectedPerkIds === null
  ) {
    return null
  }

  return {
    id,
    name,
    isEditable,
    isActive,
    order,
    primaryStyleId: RuneId(primaryStyleId),
    subStyleId: RuneId(subStyleId),
    selectedPerkIds,
  }
}

export function parsePerkPages(content: unknown): PerkPage[] {
  const values = readArray(content) ?? []

  return values.map(parsePerkPage).filter((page): page is PerkPage => page !== null)
}
