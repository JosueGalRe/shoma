import { useCallback, useEffect, useMemo, useRef } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useCancelQueue } from '@/core/lcu/lcu-mutations'
import { createLcuQueryOptions, gameflowPhaseDescriptor, queueSearchDescriptor } from '@/core/lcu/lcu-queries'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import type { QueueSearchState } from '@/core/lcu/parsers'
import { useLCUTransport, useRiftClient } from '@/core/rift'
import { useRiftStore } from '@/core/state/rift-store'
import { notify } from '@/features/notifications/notification-manager'

import { useQueueStore } from './queue-store'

export type UseQueueResult = {
  cancelQueue: () => Promise<boolean>
  dodgePenalty: number
  isInQueue: boolean
  isLoading: boolean
  queueType: string
  timer: number
}

function readQueueType(queueState: QueueSearchState | null): string {
  return queueState?.queueType ?? queueState?.searchState ?? 'Matchmaking'
}

function readDodgePenalty(queueState: QueueSearchState | null): number {
  const penalties = queueState?.errors?.map((error) => error.penaltyTimeRemaining ?? 0) ?? []
  return Math.max(0, ...penalties)
}

export function useQueue(): UseQueueResult {
  const { code, status } = useRiftStore()
  const { client } = useRiftClient({ code, enabled: status === 'connected' })
  const transport = useLCUTransport(client)
  const queryClient = useQueryClient()

  const queueQuery = useQuery(createLcuQueryOptions<QueueSearchState>(queueSearchDescriptor, transport))
  useLcuObserverSync(queueSearchDescriptor, transport)

  const gameflowQuery = useQuery(createLcuQueryOptions(gameflowPhaseDescriptor, transport))
  useLcuObserverSync(gameflowPhaseDescriptor, transport)

  const cancelQueueMutation = useCancelQueue(transport, queryClient)

  const { cancelQueue: resetQueue, setDodgePenalty, setTimer } = useQueueStore()
  const dodgePenalty = useQueueStore((state) => state.dodgePenalty)
  const isInQueue = useQueueStore((state) => state.isInQueue)
  const queueType = useQueueStore((state) => state.queueType)
  const timer = useQueueStore((state) => state.timer)
  const hasNotifiedQueueStart = useRef(false)
  const previousGameflowPhase = useRef<string | null>(null)

  useEffect(() => {
    if (!transport) {
      hasNotifiedQueueStart.current = false
      previousGameflowPhase.current = null
    }
  }, [transport])

  const queueState = useMemo(() => queueQuery.data ?? null, [queueQuery.data])

  useEffect(() => {
    if (!queueState) {
      resetQueue()
      hasNotifiedQueueStart.current = false
      return
    }

    const inQueue = Boolean(queueState.isCurrentlyInQueue)
    useQueueStore.setState({
      isInQueue: inQueue,
      queueType: readQueueType(queueState),
    })
    setTimer(queueState.timeInQueue ?? 0)
    setDodgePenalty(readDodgePenalty(queueState))

    if (inQueue && !hasNotifiedQueueStart.current) {
      notify('queue-started')
      hasNotifiedQueueStart.current = true
    }

    if (!inQueue) {
      hasNotifiedQueueStart.current = false
    }
  }, [queueState, resetQueue, setDodgePenalty, setTimer])

  useEffect(() => {
    const nextPhase = gameflowQuery.data ?? null

    if (previousGameflowPhase.current === 'Matchmaking' && nextPhase === 'ReadyCheck') {
      notify('match-found')
    }

    previousGameflowPhase.current = nextPhase
  }, [gameflowQuery.data])

  useEffect(() => {
    if (!isInQueue) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setTimer(useQueueStore.getState().timer + 1)
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [isInQueue, setTimer])

  const cancelQueue = useCallback(async () => {
    try {
      await cancelQueueMutation.mutateAsync()
      resetQueue()
      return true
    } catch {
      return false
    }
  }, [cancelQueueMutation, resetQueue])

  return {
    cancelQueue,
    dodgePenalty,
    isLoading: queueQuery.isLoading,
    isInQueue,
    queueType,
    timer,
  }
}
