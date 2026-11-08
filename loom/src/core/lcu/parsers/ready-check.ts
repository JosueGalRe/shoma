import { fallback, type InferInput, type InferOutput, object, optional, string } from 'valibot'

import { finiteNumber, parseObjectOrNull } from './base'

import type { AssertSchemaContract, SchemaContractViolations } from './schema-contract'
import type { LCUTypes } from '@shoma/protocol-contract'

const OptionalStringSchema = fallback(optional(string()), undefined)

const ReadyCheckSnapshotSchema = object({
  playerResponse: OptionalStringSchema,
  state: OptionalStringSchema,
  timer: finiteNumber,
})

export type ReadyCheckSnapshot = InferOutput<typeof ReadyCheckSnapshotSchema>

export function parseReadyCheck(content: unknown): ReadyCheckSnapshot | null {
  return parseObjectOrNull(ReadyCheckSnapshotSchema, content)
}

// Contracts with the generated LCU schema; see ./schema-contract
export type ReadyCheckSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof ReadyCheckSnapshotSchema>, LCUTypes.LolMatchmakingMatchmakingReadyCheckResource>
>
