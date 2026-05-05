import { readArray, readNumber, readObject, readString } from './base'

export type GameQueue = {
  category: string
  description: string
  gameMode: string
  id: number
  mapId: number
  queueAvailability: string
}

export function parseGameQueue(content: unknown): GameQueue | null {
  const candidate = readObject(content)
  if (!candidate) {
    return null
  }

  const category = readString(candidate.category)
  const description = readString(candidate.description)
  const gameMode = readString(candidate.gameMode)
  const id = readNumber(candidate.id)
  const mapId = readNumber(candidate.mapId)
  const queueAvailability = readString(candidate.queueAvailability)

  if (
    category === null
    || description === null
    || gameMode === null
    || id === null
    || mapId === null
    || queueAvailability === null
  ) {
    return null
  }

  return {
    category,
    description,
    gameMode,
    id,
    mapId,
    queueAvailability,
  }
}

export function parseGameQueues(content: unknown): GameQueue[] {
  const values = readArray(content) ?? []

  return values.map(parseGameQueue).filter((queue): queue is GameQueue => queue !== null)
}
