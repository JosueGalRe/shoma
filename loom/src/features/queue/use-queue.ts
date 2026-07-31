import { useCallback, useEffect, useRef, useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { useCancelQueue } from '@/core/lcu/lcu-mutations'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { createLcuQueryOptions, gameflowPhaseDescriptor, queueSearchDescriptor } from '@/core/lcu/lcu-queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { notify } from '@/features/notifications/notification-manager'

import { readDodgePenalty, readQueueType } from './queue-utils'

import type { UseQueueResult } from './queue-types'
import type { QueueSearchState } from '@/core/lcu/parsers'

export type { UseQueueResult } from './queue-types'

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
  const isLowPriorityQueue =
    queueState?.searchState === 'AbandonedLowPriorityQueue' || (queueState?.lowPriorityData?.penaltyTimeRemaining ?? 0) > 0
  const queueType = readQueueType(queueState)
  const dodgePenalty = readDodgePenalty(queueState)
  const snapshotTimer = queueState?.timeInQueue ?? 0
  const queueStartAnchorRef = useRef<{ base: number; startedAt: number } | null>(null)
  const [, setTimerTick] = useState(0)

  // Local 1s ticker anchored to the first timeInQueue snapshot; later LCU snapshots are ignored
  useEffect(() => {
    if (!isInQueue) {
      queueStartAnchorRef.current = null

      return undefined
    }

    queueStartAnchorRef.current ??= { base: snapshotTimer, startedAt: Date.now() }

    const interval = globalThis.setInterval(() => {
      setTimerTick((currentTick) => {
        return currentTick + 1
      })
    }, 1000)

    return () => {
      globalThis.clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- anchor must not reset on later LCU timeInQueue snapshots
  }, [isInQueue])

  const anchor = queueStartAnchorRef.current
  const timer = anchor ? anchor.base + Math.floor((Date.now() - anchor.startedAt) / 1000) : snapshotTimer
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
    isInQueue,
    isLoading: queueQuery.isLoading,
    isLowPriorityQueue,
    queueType,
    timer,
  }
}
