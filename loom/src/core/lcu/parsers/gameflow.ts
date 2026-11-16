import { fallback, type InferInput, type InferOutput, object, optional, string } from 'valibot'

import { finiteNumber, parseObjectOrNull } from './base'

import type { AssertSchemaContract, SchemaContractViolations } from './schema-contract'
import type { LCUTypes } from '@shoma/protocol-contract'

const GameflowQueueSchema = object({
  gameMode: fallback(optional(string()), undefined),
  id: finiteNumber,
  mapId: fallback(optional(finiteNumber), undefined),
})

const GameflowGameDataSchema = object({
  queue: GameflowQueueSchema,
})

const GameflowSessionSchema = object({
  gameData: GameflowGameDataSchema,
})

export type GameflowQueue = InferOutput<typeof GameflowQueueSchema>

// The game's queue; the lobby that had it is gone once the game starts
export function parseGameflowQueue(content: unknown): GameflowQueue | null {
  return parseObjectOrNull(GameflowSessionSchema, content)?.gameData.queue ?? null
}

// Contracts with the generated LCU schema; see ./schema-contract
export type GameflowQueueSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof GameflowQueueSchema>, LCUTypes.LolGameflowQueue>
>
export type GameflowGameDataSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof GameflowGameDataSchema>, LCUTypes.LolGameflowGameflowGameData>
>
export type GameflowSessionSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof GameflowSessionSchema>, LCUTypes.LolGameflowGameflowSession>
>
