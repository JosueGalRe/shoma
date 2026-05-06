import * as v from 'valibot'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from './base'

export const GameQueueSchema = v.object({
  category: v.string(),
  description: v.string(),
  gameMode: v.string(),
  id: finiteNumber,
  mapId: finiteNumber,
  queueAvailability: v.string(),
})

export type GameQueue = v.InferOutput<typeof GameQueueSchema>

export function parseGameQueue(content: unknown): GameQueue | null {
  return parseObjectOrNull(GameQueueSchema, content)
}

export function parseGameQueues(content: unknown): GameQueue[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((queue) => {
    const parsed = parseGameQueue(queue)
    return parsed ? [parsed] : []
  })
}
