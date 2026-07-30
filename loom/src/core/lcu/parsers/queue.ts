import { array, boolean, fallback, type InferOutput, object, optional, string } from 'valibot'

import { finiteNumber, parseObjectOrNull, unknownArray } from './base'

const OptionalStringSchema = fallback(optional(string()), undefined)
const OptionalNumberSchema = fallback(optional(finiteNumber), undefined)
const OptionalBooleanSchema = fallback(optional(boolean()), undefined)

// @knip
export const QueueSearchErrorSchema = object({
  errorType: OptionalStringSchema,
  penaltyTimeRemaining: OptionalNumberSchema,
})

// @knip
export const LowPriorityDataSchema = object({
  bustedLeaverAccessToken: OptionalStringSchema,
  penalizedSummonerIds: fallback(optional(array(finiteNumber)), undefined),
  penaltyTime: OptionalNumberSchema,
  penaltyTimeRemaining: OptionalNumberSchema,
  reason: OptionalStringSchema,
})

// @knip
const QueueSearchStateSchema = object({
  errors: fallback(optional(array(QueueSearchErrorSchema)), undefined),
  isCurrentlyInQueue: OptionalBooleanSchema,
  lowPriorityData: fallback(optional(LowPriorityDataSchema), undefined),
  queueType: OptionalStringSchema,
  searchState: OptionalStringSchema,
  timeInQueue: OptionalNumberSchema,
})

const QueueSearchStateRecordSchema = object({
  errors: fallback(optional(unknownArray), undefined),
  isCurrentlyInQueue: OptionalBooleanSchema,
  lowPriorityData: fallback(optional(object({})), undefined),
  queueType: OptionalStringSchema,
  searchState: OptionalStringSchema,
  timeInQueue: OptionalNumberSchema,
})

// @knip
export type QueueSearchError = InferOutput<typeof QueueSearchErrorSchema>
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
    isCurrentlyInQueue: record.isCurrentlyInQueue,
    lowPriorityData: parseObjectOrNull(LowPriorityDataSchema, record.lowPriorityData) ?? undefined,
    queueType: record.queueType,
    searchState: record.searchState,
    timeInQueue: record.timeInQueue,
  }
}

export function readQueueType(queueState: QueueSearchState | null): string {
  return queueState?.queueType ?? queueState?.searchState ?? 'Matchmaking'
}

export function readDodgePenalty(queueState: QueueSearchState | null): number {
  const penalties =
    queueState?.errors?.map((error) => {
      return error.penaltyTimeRemaining ?? 0
    }) ?? []

  return Math.max(0, ...penalties)
}
