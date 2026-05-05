import { readArray, readBoolean, readNumber, readObject, readString } from './base'

export type PerkPage = {
  id: number
  name: string
  isEditable: boolean
  isActive: boolean
  order: number
  primaryStyleId: number
  subStyleId: number
  selectedPerkIds: number[]
}

function readNumberArray(value: unknown): number[] | null {
  const values = readArray(value)
  if (!values) {
    return null
  }

  const numbers = values.map(readNumber)
  if (numbers.some((number) => number === null)) {
    return null
  }

  return numbers as number[]
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
  const selectedPerkIds = readNumberArray(candidate.selectedPerkIds)

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
    primaryStyleId,
    subStyleId,
    selectedPerkIds,
  }
}

export function parsePerkPages(content: unknown): PerkPage[] {
  const values = readArray(content) ?? []

  return values.map(parsePerkPage).filter((page): page is PerkPage => page !== null)
}
