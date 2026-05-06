import { useCallback, useEffect, useRef } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useAcceptReadyCheck, useDeclineReadyCheck } from '@/core/lcu/lcu-mutations'
import { createLcuQueryOptions, readyCheckDescriptor } from '@/core/lcu/lcu-queries'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { useLCUTransport, useRiftClient } from '@/core/rift/hooks'
import { useRiftStore } from '@/core/state/rift-store'
import { notify } from '@/features/notifications/notification-manager'
import { useCountdown } from '@/hooks/useCountdown'

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
  const status = useReadyCheckStore((state) => state.status)
  const hasNotifiedReadyCheck = useRef(false)
  const { client } = useRiftClient({ code, enabled: code.length > 0 })
  const transport = useLCUTransport(client)
  const queryClient = useQueryClient()
  const readyCheckQuery = useQuery(createLcuQueryOptions(readyCheckDescriptor, transport))
  useLcuObserverSync(readyCheckDescriptor, transport)
  const acceptMutation = useAcceptReadyCheck(transport, queryClient)
  const declineMutation = useDeclineReadyCheck(transport, queryClient)
  const isRespondingRef = useRef(false)

  const readyCheckSnapshot = readyCheckQuery.data ?? null
  const countdown = useCountdown(readyCheckSnapshot?.timer ?? 0)
  const derivedTimer = countdown.remaining
  const derivedStatus = status === 'pending' && readyCheckSnapshot && (readyCheckSnapshot.state === 'Expired' || derivedTimer <= 0) ? 'expired' : status

  // External system sync: Browser notification API
  useEffect(() => {
    if (transport === null || derivedStatus !== 'pending' || derivedTimer <= 0) {
      hasNotifiedReadyCheck.current = false
      return
    }

    if (!hasNotifiedReadyCheck.current) {
      hasNotifiedReadyCheck.current = true
      notify('ready-check')
    }
  }, [derivedStatus, derivedTimer, transport])

  const accept = useCallback(async () => {
    if (derivedStatus !== 'pending' || isRespondingRef.current) {
      return false
    }

    isRespondingRef.current = true
    try {
      await acceptMutation.mutateAsync()
      acceptState()
      return true
    } catch {
      return false
    } finally {
      isRespondingRef.current = false
    }
  }, [acceptMutation, acceptState, derivedStatus])

  const decline = useCallback(async () => {
    if (derivedStatus !== 'pending' || isRespondingRef.current) {
      return false
    }

    isRespondingRef.current = true
    try {
      await declineMutation.mutateAsync()
      declineState()
      return true
    } catch {
      return false
    } finally {
      isRespondingRef.current = false
    }
  }, [declineMutation, declineState, derivedStatus])

  return {
    accept,
    decline,
    error: readyCheckQuery.error,
    isLoading: readyCheckQuery.isLoading,
    status: derivedStatus,
    timer: derivedTimer,
  }
}
