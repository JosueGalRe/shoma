import { boolean, fallback, type InferInput, type InferOutput, object, optional, string } from 'valibot'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from './base'

import type { AssertSchemaContract, SchemaContractViolations } from './schema-contract'
import type { LCUTypes } from '@shoma/protocol-contract'

const GameQueueSchema = object({
  category: string(),
  description: string(),
  gameMode: string(),
  // Its id is the pick strategy a custom game sends as `mutators`
  gameTypeConfig: fallback(optional(object({ id: finiteNumber })), undefined),
  id: finiteNumber,
  isEnabled: fallback(optional(boolean()), true),
  mapId: finiteNumber,
  name: fallback(optional(string()), undefined),
  queueAvailability: string(),
  type: fallback(optional(string()), undefined),
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

// Contracts with the generated LCU schema; see ./schema-contract
export type GameQueueSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof GameQueueSchema>, LCUTypes.LolGameQueuesQueue>
>
