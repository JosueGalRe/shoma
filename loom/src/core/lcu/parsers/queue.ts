import { array, boolean, fallback, type InferInput, type InferOutput, object, optional, string } from 'valibot'

import { finiteNumber, parseObjectOrNull, unknownArray, unknownRecord } from './base'

import type { AssertSchemaContract, SchemaContractViolations } from './schema-contract'
import type { LCUTypes } from '@shoma/protocol-contract'

const OptionalStringSchema = fallback(optional(string()), undefined)
const OptionalNumberSchema = fallback(optional(finiteNumber), undefined)
const OptionalBooleanSchema = fallback(optional(boolean()), undefined)

const QueueSearchErrorSchema = object({
  errorType: OptionalStringSchema,
  penaltyTimeRemaining: OptionalNumberSchema,
})

const LowPriorityDataSchema = object({
  bustedLeaverAccessToken: OptionalStringSchema,
  penalizedSummonerIds: fallback(optional(array(finiteNumber)), undefined),
  penaltyTime: OptionalNumberSchema,
  penaltyTimeRemaining: OptionalNumberSchema,
  reason: OptionalStringSchema,
})

const QueueSearchStateSchema = object({
  errors: fallback(optional(array(QueueSearchErrorSchema)), undefined),
  estimatedQueueTime: OptionalNumberSchema,
  isCurrentlyInQueue: OptionalBooleanSchema,
  lowPriorityData: fallback(optional(LowPriorityDataSchema), undefined),
  queueId: OptionalNumberSchema,
  searchState: OptionalStringSchema,
  timeInQueue: OptionalNumberSchema,
})

const QueueSearchStateRecordSchema = object({
  errors: fallback(optional(unknownArray), undefined),
  estimatedQueueTime: OptionalNumberSchema,
  isCurrentlyInQueue: OptionalBooleanSchema,
  lowPriorityData: fallback(optional(unknownRecord), undefined),
  queueId: OptionalNumberSchema,
  searchState: OptionalStringSchema,
  timeInQueue: OptionalNumberSchema,
})

export type LowPriorityData = InferOutput<typeof LowPriorityDataSchema>
export type QueueSearchState = InferOutput<typeof QueueSearchStateSchema>

export function parseQueueSearchState(content: unknown): QueueSearchState | null {
  const record = parseObjectOrNull(QueueSearchStateRecordSchema, content)

  if (!record) {
    return null
  }

  return {
    errors: record.errors?.flatMap((error) => {
      const parsed = parseObjectOrNull(QueueSearchErrorSchema, error)

      return parsed ? [parsed] : []
    }),
    estimatedQueueTime: record.estimatedQueueTime,
    isCurrentlyInQueue: record.isCurrentlyInQueue,
    lowPriorityData: parseObjectOrNull(LowPriorityDataSchema, record.lowPriorityData) ?? undefined,
    queueId: record.queueId,
    searchState: record.searchState,
    timeInQueue: record.timeInQueue,
  }
}

export function readQueueType(queueState: QueueSearchState | null): string {
  return queueState?.searchState ?? 'Matchmaking'
}

export function readDodgePenalty(queueState: QueueSearchState | null): number {
  const penalties =
    queueState?.errors?.map((error) => {
      return error.penaltyTimeRemaining ?? 0
    }) ?? []

  return Math.max(0, ...penalties)
}

// Contracts with the generated LCU schema; see ./schema-contract
export type QueueSearchErrorSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof QueueSearchErrorSchema>, LCUTypes.LolMatchmakingMatchmakingSearchErrorResource>
>

export type LowPriorityDataSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof LowPriorityDataSchema>, LCUTypes.LolMatchmakingMatchmakingLowPriorityData>
>

export type QueueSearchStateSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof QueueSearchStateRecordSchema>, LCUTypes.LolMatchmakingMatchmakingSearchResource>
>
