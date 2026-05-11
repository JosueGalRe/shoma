import { LcuHttpMethod } from '@mimic/protocol-contract'
import { useCallback, useEffect } from 'react'

import { useLCUObserver, useLCURequest } from '@core/rift/hooks'
import {
  champSelectRequestPaths,
  type ChampSelectSession,
  useChampSelectStore,
} from './champ-select-store'

export type UseChampSelectResult = {
  ban: (championId: number) => Promise<boolean>
  champSelectState: ChampSelectSession | null
  error: Error | null
  hover: (championId: number) => Promise<boolean>
  isLoading: boolean
  pick: (championId: number) => Promise<boolean>
  timer: number
}

export function useChampSelect(): UseChampSelectResult {
  const observedChampSelect = useLCUObserver<ChampSelectSession>(champSelectRequestPaths.observer)
  const initialChampSelectRequest = useLCURequest<ChampSelectSession>(champSelectRequestPaths.observer, LcuHttpMethod.GET)
  const {
    banChampion,
    champSelectState,
    decrementTimer,
    error: storeError,
    hoverChampion,
    pickChampion,
    setChampSelectState,
    setError,
    timer,
  } = useChampSelectStore()

  useEffect(() => {
    if (initialChampSelectRequest.data) {
      setChampSelectState(initialChampSelectRequest.data)
    }
  }, [initialChampSelectRequest.data, setChampSelectState])

  useEffect(() => {
    if (observedChampSelect.data) {
      setChampSelectState(observedChampSelect.data)
    }
  }, [observedChampSelect.data, setChampSelectState])

  useEffect(() => {
    if (observedChampSelect.error) {
      setError(observedChampSelect.error)
    }
  }, [observedChampSelect.error, setError])

  useEffect(() => {
    if (!champSelectState || timer <= 0) {
      return
    }

    const countdownId = window.setInterval(() => {
      decrementTimer()
    }, 1000)

    return () => {
      window.clearInterval(countdownId)
    }
  }, [champSelectState, decrementTimer, timer])

  const pick = useCallback(
    async (championId: number) => {
      const result = await pickChampion(championId)
      initialChampSelectRequest.refetch()
      return result
    },
    [initialChampSelectRequest, pickChampion],
  )

  const ban = useCallback(
    async (championId: number) => {
      const result = await banChampion(championId)
      initialChampSelectRequest.refetch()
      return result
    },
    [banChampion, initialChampSelectRequest],
  )

  const hover = useCallback(
    async (championId: number) => {
      const result = await hoverChampion(championId)
      initialChampSelectRequest.refetch()
      return result
    },
    [hoverChampion, initialChampSelectRequest],
  )

  return {
    ban,
    champSelectState,
    error: observedChampSelect.error ?? initialChampSelectRequest.error ?? storeError,
    hover,
    isLoading: observedChampSelect.isLoading || initialChampSelectRequest.isLoading,
    pick,
    timer,
  }
}
