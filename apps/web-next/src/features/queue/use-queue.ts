import { LcuHttpMethod, LcuPaths } from '@mimic/protocol-contract'
import { useCallback, useEffect, useMemo } from 'react'

import { useLCUObserver, useLCURequest, useLCUTransport, useRiftClient } from '@/core/rift'
import { useRiftStore } from '@/core/state/rift-store'

import { useQueueStore } from './queue-store'

type QueueSearchState = {
  errors?: Array<{
    errorType?: string
    penaltyTimeRemaining?: number
  }>
  isCurrentlyInQueue?: boolean
  queueType?: string
  searchState?: string
  timeInQueue?: number
}

export type UseQueueResult = {
  cancelQueue: () => Promise<boolean>
  dodgePenalty: number
  isInQueue: boolean
  isLoading: boolean
  queueType: string
  timer: number
}

const queueObserverPath = LcuPaths.matchmaking.search
const queueCancelPath = LcuPaths.lobby.matchmakingSearch

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

  const queueObserver = useLCUObserver<QueueSearchState>(transport, queueObserverPath)
  const queueRequest = useLCURequest<QueueSearchState>(transport, queueObserverPath, LcuHttpMethod.GET)

  const { cancelQueue: resetQueue, setDodgePenalty, setTimer } = useQueueStore()
  const dodgePenalty = useQueueStore((state) => state.dodgePenalty)
  const isInQueue = useQueueStore((state) => state.isInQueue)
  const queueType = useQueueStore((state) => state.queueType)
  const timer = useQueueStore((state) => state.timer)

  const queueState = useMemo(
    () => queueObserver.data?.content ?? queueRequest.data ?? null,
    [queueObserver.data, queueRequest.data],
  )

  useEffect(() => {
    if (!queueState) {
      resetQueue()
      return
    }

    const inQueue = Boolean(queueState.isCurrentlyInQueue)
    useQueueStore.setState({
      isInQueue: inQueue,
      queueType: readQueueType(queueState),
    })
    setTimer(queueState.timeInQueue ?? 0)
    setDodgePenalty(readDodgePenalty(queueState))
  }, [queueState, resetQueue, setDodgePenalty, setTimer])

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
    if (!transport) {
      resetQueue()
      return false
    }

    try {
      const result = await transport.request(queueCancelPath, LcuHttpMethod.DELETE)
      if (result.status < 200 || result.status >= 300) {
        throw new Error(`LCU request failed (${result.status}): ${queueCancelPath}`)
      }

      resetQueue()
      return true
    } catch {
      return false
    }
  }, [resetQueue, transport])

  return {
    cancelQueue,
    dodgePenalty,
    isLoading: queueObserver.isLoading || queueRequest.isLoading,
    isInQueue,
    queueType,
    timer,
  }
}
