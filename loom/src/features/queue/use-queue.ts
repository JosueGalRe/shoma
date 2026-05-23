import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'

import { useCancelQueue } from '@/core/lcu/lcu-mutations'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { createLcuQueryOptions, gameflowPhaseDescriptor, queueSearchDescriptor } from '@/core/lcu/lcu-queries'
import type { QueueSearchState } from '@/core/lcu/parsers'
import { useSharedLCUTransport } from '@/core/relay/relay-client-provider'
import { notify } from '@/features/notifications/notification-manager'
import { useCountdown } from '@/hooks/use-countdown'

export type UseQueueResult = {
  cancelQueue: () => Promise<boolean>
  dodgePenalty: number
  gameflowPhase: string | null
  isInQueue: boolean
  isLoading: boolean
  queueType: string
  timer: number
}

const MAX_QUEUE_TIMER_SECONDS = 24 * 60 * 60

function readQueueType(queueState: QueueSearchState | null): string {
  return queueState?.queueType ?? queueState?.searchState ?? 'Matchmaking'
}

function readDodgePenalty(queueState: QueueSearchState | null): number {
  const penalties = queueState?.errors?.map((error) => error.penaltyTimeRemaining ?? 0) ?? []
  return Math.max(0, ...penalties)
}

export function useQueue(): UseQueueResult {
  const transport = useSharedLCUTransport()

  const queueQuery = useQuery(createLcuQueryOptions<QueueSearchState>(queueSearchDescriptor, transport))
  useLcuObserverSync(queueSearchDescriptor, transport)

  const gameflowQuery = useQuery(createLcuQueryOptions(gameflowPhaseDescriptor, transport))
  useLcuObserverSync(gameflowPhaseDescriptor, transport)

  const cancelQueueMutation = useCancelQueue()

  const previousTransport = useRef<typeof transport>(null)
  const previousQueueInQueue = useRef(false)
  const previousGameflowPhase = useRef<string | null>(null)
  const isCancellingQueueRef = useRef(false)

  const queueState = queueQuery.data ?? null
  const isInQueue = Boolean(queueState?.isCurrentlyInQueue)
  const queueType = readQueueType(queueState)
  const dodgePenalty = readDodgePenalty(queueState)
  const snapshotTimer = queueState?.timeInQueue ?? 0
  const queueProgression = useCountdown(isInQueue ? Math.max(0, MAX_QUEUE_TIMER_SECONDS - snapshotTimer) : 0)
  const timer = isInQueue ? snapshotTimer + queueProgression.elapsed : snapshotTimer
  const nextPhase = gameflowQuery.data ?? null

  // External system sync: Browser notification API
  useEffect(() => {
    if (previousTransport.current !== transport) {
      previousTransport.current = transport
      previousQueueInQueue.current = false
      previousGameflowPhase.current = null
    }

    if (isInQueue && !previousQueueInQueue.current) {
      notify('queue-started')
    }
    previousQueueInQueue.current = isInQueue

    if (previousGameflowPhase.current === 'Matchmaking' && nextPhase === 'ReadyCheck') {
      notify('match-found')
    }
    previousGameflowPhase.current = nextPhase
  }, [isInQueue, nextPhase, transport])

  const cancelQueue = useCallback(async () => {
    if (isCancellingQueueRef.current) {
      return false
    }

    isCancellingQueueRef.current = true
    try {
      await cancelQueueMutation.mutateAsync()
      return true
    } catch {
      return false
    } finally {
      isCancellingQueueRef.current = false
    }
  }, [cancelQueueMutation])

  return {
    cancelQueue,
    dodgePenalty,
    gameflowPhase: nextPhase,
    isLoading: queueQuery.isLoading,
    isInQueue,
    queueType,
    timer,
  }
}
