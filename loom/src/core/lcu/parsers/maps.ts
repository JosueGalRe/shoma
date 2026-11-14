import { type InferInput, type InferOutput, object, optional, string } from 'valibot'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from './base'

import type { AssertSchemaContract, SchemaContractViolations } from './schema-contract'
import type { LCUTypes } from '@shoma/protocol-contract'

// One entry per map and game mode; only the game-select icon the client shows when picking a mode
const GameMapSchema = object({
  assets: object({
    'game-select-icon-active': optional(string()),
    'game-select-icon-active-video': optional(string()),
    'game-select-icon-default': optional(string()),
    'game-select-icon-intro-video': optional(string()),
  }),
  gameMode: string(),
  id: finiteNumber,
})

export type GameMap = InferOutput<typeof GameMapSchema>

export function parseGameMaps(content: unknown): GameMap[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((map) => {
    const parsed = parseObjectOrNull(GameMapSchema, map)

    return parsed ? [parsed] : []
  })
}

// Contract with the generated LCU schema; see ./schema-contract
export type GameMapSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof GameMapSchema>, LCUTypes.LolMapsMaps>
>
