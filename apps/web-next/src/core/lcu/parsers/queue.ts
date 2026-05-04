import { readArray, readBoolean, readNumber, readObject, readString } from './base'

export type QueueSearchError = {
  errorType?: string
  penaltyTimeRemaining?: number
}

export type QueueSearchState = {
  errors?: QueueSearchError[]
  isCurrentlyInQueue?: boolean
  queueType?: string
  searchState?: string
  timeInQueue?: number
}

function parseQueueSearchError(content: unknown): QueueSearchError | null {
  const candidate = readObject(content)
  if (!candidate) {
    return null
  }

  return {
    errorType: readString(candidate.errorType) ?? undefined,
    penaltyTimeRemaining: readNumber(candidate.penaltyTimeRemaining) ?? undefined,
  }
}

export function parseQueueSearchState(content: unknown): QueueSearchState | null {
  const candidate = readObject(content)
  if (!candidate) {
    return null
  }

  const errors = readArray(candidate.errors)
    ?.map(parseQueueSearchError)
    .filter((error): error is QueueSearchError => error !== null)

  return {
    errors,
    isCurrentlyInQueue: readBoolean(candidate.isCurrentlyInQueue) ?? undefined,
    queueType: readString(candidate.queueType) ?? undefined,
    searchState: readString(candidate.searchState) ?? undefined,
    timeInQueue: readNumber(candidate.timeInQueue) ?? undefined,
  }
}

export function readQueueType(queueState: QueueSearchState | null): string {
  return queueState?.queueType ?? queueState?.searchState ?? 'Matchmaking'
}

export function readDodgePenalty(queueState: QueueSearchState | null): number {
  const penalties = queueState?.errors?.map((error) => error.penaltyTimeRemaining ?? 0) ?? []
  return Math.max(0, ...penalties)
}
