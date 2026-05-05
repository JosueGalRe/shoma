import { readArray, readBoolean, readNumber, readObject, readString } from './base'

export type SkinItem = {
  championId: number
  id: number
  name: string
  ownership: { owned: boolean }
}

export function parseSkinItem(content: unknown): SkinItem | null {
  const candidate = readObject(content)
  if (!candidate) {
    return null
  }

  const championId = readNumber(candidate.championId)
  const id = readNumber(candidate.id)
  const name = readString(candidate.name)
  const ownership = readObject(candidate.ownership)
  const owned = readBoolean(ownership?.owned)

  if (championId === null || id === null || name === null || owned === null) {
    return null
  }

  return {
    championId,
    id,
    name,
    ownership: { owned },
  }
}

export function parseSkinInventory(content: unknown): SkinItem[] {
  const values = readArray(content) ?? []

  return values.map(parseSkinItem).filter((skin): skin is SkinItem => skin !== null)
}
