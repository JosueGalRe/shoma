import { LcuHttpMethod } from '@mimic/protocol-contract'
import { useCallback, useEffect, useMemo } from 'react'

import { useLCUObserver, useLCURequest } from '@core/rift/hooks'
import { createLCUClient } from '@core/rift/lcu-transport'
import { useGameflowStore } from '@core/state/gameflow-store'
import { queueRequestPaths, type QueueSearchState, useQueueStore } from './queue-store'

const lcuClient = createLCUClient({ connectOnCreate: false })

export type UseQueueResult = {
  cancelQueue: () => Promise<boolean>
  dodgeTimer: number | null
  error: Error | null
  errors: string[]
  estimatedTime: number | null
  isInQueue: boolean
  isLoading: boolean
  queueState: QueueSearchState | null
  startQueue: () => Promise<boolean>
}

function readQueueErrorMessage(errors: string[]): Error | null {
  const [firstError] = errors
  return firstError ? new Error(firstError) : null
}

export function useQueue(): UseQueueResult {
  const observedQueue = useLCUObserver<QueueSearchState>(queueRequestPaths.observer)
  const initialQueueRequest = useLCURequest<QueueSearchState>(queueRequestPaths.observer, LcuHttpMethod.GET)
  const {
    cancelQueue: commitCancelQueue,
    dodgeTimer,
    errors,
    estimatedTime,
    isInQueue,
    queueState,
    setError,
    setQueueState,
    startQueue: commitStartQueue,
  } = useQueueStore()

  useEffect(() => {
    if (initialQueueRequest.data) {
      setQueueState(initialQueueRequest.data)
    }
  }, [initialQueueRequest.data, setQueueState])

  useEffect(() => {
    if (observedQueue.data) {
      setQueueState(observedQueue.data)
    }
  }, [observedQueue.data, setQueueState])

  useEffect(() => {
    if (observedQueue.error) {
      setError(observedQueue.error)
    }
  }, [observedQueue.error, setError])

  const startQueue = useCallback(() => {
    return commitStartQueue(async () => {
      await useGameflowStore.getState().startQueue()
      initialQueueRequest.refetch()
    })
  }, [commitStartQueue, initialQueueRequest])

  const cancelQueue = useCallback(() => {
    return commitCancelQueue(async () => {
      const result = await lcuClient.request(queueRequestPaths.cancel, LcuHttpMethod.DELETE)
      if (result.status < 200 || result.status >= 300) {
        throw new Error(`LCU request failed (${result.status}): ${queueRequestPaths.cancel}`)
      }
      initialQueueRequest.refetch()
    })
  }, [commitCancelQueue, initialQueueRequest])

  const errorMessages = useMemo(() => errors.map((error) => error.errorType), [errors])
  const error = observedQueue.error ?? initialQueueRequest.error ?? readQueueErrorMessage(errorMessages)

  return {
    cancelQueue,
    dodgeTimer,
    error,
    errors: errorMessages,
    estimatedTime,
    isInQueue,
    isLoading: observedQueue.isLoading || initialQueueRequest.isLoading,
    queueState,
    startQueue,
  }
}
