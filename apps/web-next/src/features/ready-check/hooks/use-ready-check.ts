import { useCallback, useEffect, useRef } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useAcceptReadyCheck, useDeclineReadyCheck } from '@/core/lcu/lcu-mutations'
import { createLcuQueryOptions, readyCheckDescriptor } from '@/core/lcu/lcu-queries'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { useLCUTransport, useRiftClient } from '@/core/rift/hooks'
import { useRiftStore } from '@/core/state/rift-store'
import { notify, vibrate } from '@/features/notifications/notification-manager'

import { useReadyCheckStore } from '../ready-check-store'

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
  const hasNotifiedReadyCheck = useRef(false)
  const { client } = useRiftClient({ code, enabled: code.length > 0 })
  const transport = useLCUTransport(client)
  const queryClient = useQueryClient()
  const readyCheckQuery = useQuery(createLcuQueryOptions(readyCheckDescriptor, transport))
  useLcuObserverSync(readyCheckDescriptor, transport)
  const acceptMutation = useAcceptReadyCheck(transport, queryClient)
  const declineMutation = useDeclineReadyCheck(transport, queryClient)

  useEffect(() => {
    const snapshot = readyCheckQuery.data

    if (!snapshot) {
      return
    }

    setTimerState(snapshot.timer)

    if (snapshot.state === 'Expired' || snapshot.timer <= 0) {
      expireState()
    }
  }, [expireState, readyCheckQuery.data, setTimerState])

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

  useEffect(() => {
    if (status !== 'pending' || timer <= 0) {
      hasNotifiedReadyCheck.current = false
      return
    }

    if (hasNotifiedReadyCheck.current) {
      return
    }

    hasNotifiedReadyCheck.current = true
    notify('ready-check')
    vibrate([200, 100, 200])
  }, [status, timer])

  const accept = useCallback(async () => {
    if (status !== 'pending') {
      return false
    }

    try {
      await acceptMutation.mutateAsync()
      acceptState()
      return true
    } catch {
      return false
    }
  }, [acceptMutation, acceptState, status])

  const decline = useCallback(async () => {
    if (status !== 'pending') {
      return false
    }

    try {
      await declineMutation.mutateAsync()
      declineState()
      return true
    } catch {
      return false
    }
  }, [declineMutation, declineState, status])

  return {
    accept,
    decline,
    error: readyCheckQuery.error,
    isLoading: readyCheckQuery.isLoading,
    status,
    timer,
  }
}
