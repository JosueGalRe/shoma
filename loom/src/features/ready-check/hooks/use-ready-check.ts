import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'

import { useAcceptReadyCheck, useDeclineReadyCheck } from '@/core/lcu/lcu-mutations'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { createLcuQueryOptions, readyCheckDescriptor } from '@/core/lcu/lcu-queries'
import { useSharedLCUTransport } from '@/core/relay/relay-client-provider'
import { notify } from '@/features/notifications/notification-manager'
import { useCountdown } from '@/hooks/use-countdown'

import { useReadyCheckStore } from '../ready-check-store'
import type { UseReadyCheckResult } from '../ready-check-types'
import { deriveReadyCheckStatus } from '../ready-check-utils'

export type { UseReadyCheckResult } from '../ready-check-types'

export function useReadyCheck(): UseReadyCheckResult {
  const acceptState = useReadyCheckStore((state) => { return state.accept; })
  const declineState = useReadyCheckStore((state) => { return state.decline; })
  const hasNotifiedReadyCheck = useRef(false)
  const transport = useSharedLCUTransport()
  const readyCheckQuery = useQuery(createLcuQueryOptions(readyCheckDescriptor, transport))
  useLcuObserverSync(readyCheckDescriptor, transport)
  const acceptMutation = useAcceptReadyCheck()
  const declineMutation = useDeclineReadyCheck()
  const isRespondingRef = useRef(false)

  const readyCheckSnapshot = readyCheckQuery.data ?? null
  const remainingTimer = Math.max(0, Math.ceil(readyCheckSnapshot?.timer ?? 0))
  const countdown = useCountdown(readyCheckSnapshot ? remainingTimer : 0)
  const derivedTimer = countdown.remaining
  const derivedStatus = deriveReadyCheckStatus(readyCheckSnapshot, derivedTimer)

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
