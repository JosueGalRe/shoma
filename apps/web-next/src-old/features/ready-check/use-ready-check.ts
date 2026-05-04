import { LcuHttpMethod } from '@mimic/protocol-contract'
import { useCallback, useEffect } from 'react'

import { useLCUObserver, useLCURequest } from '@core/rift/hooks'
import { useGameflowStore } from '@core/state/gameflow-store'
import { readyCheckRequestPaths, type ReadyCheckState, useReadyCheckStore } from './ready-check-store'

export type UseReadyCheckResult = {
  accept: () => Promise<boolean>
  decline: () => Promise<boolean>
  error: Error | null
  isLoading: boolean
  readyCheckState: ReadyCheckState | null
  timeRemaining: number
}

export function useReadyCheck(): UseReadyCheckResult {
  const observedReadyCheck = useLCUObserver<ReadyCheckState>(readyCheckRequestPaths.observer)
  const initialReadyCheckRequest = useLCURequest<ReadyCheckState>(readyCheckRequestPaths.observer, LcuHttpMethod.GET)
  const {
    accept: commitAccept,
    decline: commitDecline,
    decrementTimer,
    error: storeError,
    isActive,
    readyCheckState,
    setError,
    setReadyCheckState,
    timer,
  } = useReadyCheckStore()

  useEffect(() => {
    if (initialReadyCheckRequest.data) {
      setReadyCheckState(initialReadyCheckRequest.data)
    }
  }, [initialReadyCheckRequest.data, setReadyCheckState])

  useEffect(() => {
    if (observedReadyCheck.data) {
      setReadyCheckState(observedReadyCheck.data)
    }
  }, [observedReadyCheck.data, setReadyCheckState])

  useEffect(() => {
    if (observedReadyCheck.error) {
      setError(observedReadyCheck.error)
    }
  }, [observedReadyCheck.error, setError])

  useEffect(() => {
    if (!isActive || timer <= 0) {
      return
    }

    const countdownId = window.setInterval(() => {
      decrementTimer()
    }, 1000)

    return () => {
      window.clearInterval(countdownId)
    }
  }, [decrementTimer, isActive, timer])

  const accept = useCallback(() => {
    return commitAccept(async () => {
      await useGameflowStore.getState().acceptReadyCheck()
      initialReadyCheckRequest.refetch()
    })
  }, [commitAccept, initialReadyCheckRequest])

  const decline = useCallback(() => {
    return commitDecline(async () => {
      await useGameflowStore.getState().declineReadyCheck()
      initialReadyCheckRequest.refetch()
    })
  }, [commitDecline, initialReadyCheckRequest])

  return {
    accept,
    decline,
    error: observedReadyCheck.error ?? initialReadyCheckRequest.error ?? storeError,
    isLoading: observedReadyCheck.isLoading || initialReadyCheckRequest.isLoading,
    readyCheckState,
    timeRemaining: timer,
  }
}
