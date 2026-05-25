import { type InferOutput, object, string } from 'valibot'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from './base'

// @knip
export const GameQueueSchema = object({
  category: string(),
  description: string(),
  gameMode: string(),
  id: finiteNumber,
  mapId: finiteNumber,
  queueAvailability: string(),
})

export type GameQueue = InferOutput<typeof GameQueueSchema>

export function parseGameQueue(content: unknown): GameQueue | null {
  return parseObjectOrNull(GameQueueSchema, content)
}

export function parseGameQueues(content: unknown): GameQueue[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((queue) => {
    const parsed = parseGameQueue(queue)

    return parsed ? [parsed] : []
  })
}
