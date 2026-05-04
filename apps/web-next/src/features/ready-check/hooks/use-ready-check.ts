import { LcuHttpMethod, LcuPaths } from '@mimic/protocol-contract'
import { useCallback, useEffect } from 'react'

import { useLCUObserver, useLCUTransport, useRiftClient } from '@/core/rift/hooks'
import { useRiftStore } from '@/core/state/rift-store'

import { useReadyCheckStore } from '../ready-check-store'

type ReadyCheckSnapshot = {
  playerResponse?: string
  state?: string
  timer: number
}

export type UseReadyCheckResult = {
  accept: () => Promise<boolean>
  decline: () => Promise<boolean>
  error: Error | null
  isLoading: boolean
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  timer: number
}

export function useReadyCheck(): UseReadyCheckResult {
  const code = useRiftStore((state) => state.code)
  const acceptState = useReadyCheckStore((state) => state.accept)
  const declineState = useReadyCheckStore((state) => state.decline)
  const expireState = useReadyCheckStore((state) => state.expire)
  const setTimerState = useReadyCheckStore((state) => state.setTimer)
  const status = useReadyCheckStore((state) => state.status)
  const timer = useReadyCheckStore((state) => state.timer)
  const { client } = useRiftClient({ code, enabled: code.length > 0 })
  const transport = useLCUTransport(client)
  const readyCheck = useLCUObserver<ReadyCheckSnapshot>(transport, LcuPaths.matchmaking.readyCheck)

  useEffect(() => {
    const snapshot = readyCheck.data?.content

    if (!snapshot) {
      return
    }

    setTimerState(snapshot.timer)

    if (snapshot.state === 'Expired' || snapshot.timer <= 0) {
      expireState()
    }
  }, [expireState, readyCheck.data, setTimerState])

  useEffect(() => {
    if (status !== 'pending' || timer <= 0) {
      return
    }

    const countdownId = window.setInterval(() => {
      setTimerState(timer - 1)
    }, 1000)

    return () => {
      window.clearInterval(countdownId)
    }
  }, [setTimerState, status, timer])

  const accept = useCallback(async () => {
    if (!transport || status !== 'pending') {
      return false
    }

    try {
      await transport.request(LcuPaths.matchmaking.readyCheckAccept, LcuHttpMethod.PUT)
      acceptState()
      return true
    } catch {
      return false
    }
  }, [acceptState, status, transport])

  const decline = useCallback(async () => {
    if (!transport || status !== 'pending') {
      return false
    }

    try {
      await transport.request(LcuPaths.matchmaking.readyCheckDecline, LcuHttpMethod.PUT)
      declineState()
      return true
    } catch {
      return false
    }
  }, [declineState, status, transport])

  return {
    accept,
    decline,
    error: readyCheck.error,
    isLoading: readyCheck.isLoading,
    status,
    timer,
  }
}
