import type { QueueSearchState } from '@/core/lcu/parsers'

export const MAX_QUEUE_TIMER_SECONDS = 24 * 60 * 60

export function formatTimer(seconds: number): string {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
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
