import * as v from 'valibot'

import { finiteNumber, parseObjectOrNull, unknownArray } from './base'

const OptionalStringSchema = v.fallback(v.optional(v.string()), undefined)
const OptionalNumberSchema = v.fallback(v.optional(finiteNumber), undefined)
const OptionalBooleanSchema = v.fallback(v.optional(v.boolean()), undefined)

// @knip
export const QueueSearchErrorSchema = v.object({
  errorType: OptionalStringSchema,
  penaltyTimeRemaining: OptionalNumberSchema,
})

// @knip
export const LowPriorityDataSchema = v.object({
  bustedLeaverAccessToken: OptionalStringSchema,
  penalizedSummonerIds: v.fallback(v.optional(v.array(finiteNumber)), undefined),
  penaltyTime: OptionalNumberSchema,
  penaltyTimeRemaining: OptionalNumberSchema,
  reason: OptionalStringSchema,
})

// @knip
export const QueueSearchStateSchema = v.object({
  errors: v.fallback(v.optional(v.array(QueueSearchErrorSchema)), undefined),
  isCurrentlyInQueue: OptionalBooleanSchema,
  lowPriorityData: v.fallback(v.optional(LowPriorityDataSchema), undefined),
  queueType: OptionalStringSchema,
  searchState: OptionalStringSchema,
  timeInQueue: OptionalNumberSchema,
})

const QueueSearchStateRecordSchema = v.object({
  errors: v.fallback(v.optional(unknownArray), undefined),
  isCurrentlyInQueue: OptionalBooleanSchema,
  lowPriorityData: v.fallback(v.optional(v.object({})), undefined),
  queueType: OptionalStringSchema,
  searchState: OptionalStringSchema,
  timeInQueue: OptionalNumberSchema,
})

// @knip
export type QueueSearchError = v.InferOutput<typeof QueueSearchErrorSchema>
export type LowPriorityData = v.InferOutput<typeof LowPriorityDataSchema>
export type QueueSearchState = v.InferOutput<typeof QueueSearchStateSchema>

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
  const penalties = queueState?.errors?.map((error) => error.penaltyTimeRemaining ?? 0) ?? []
  return Math.max(0, ...penalties)
}
