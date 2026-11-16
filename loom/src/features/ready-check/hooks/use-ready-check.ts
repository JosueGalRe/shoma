import { useCallback, useRef } from 'react'

import { useQuery } from '@tanstack/react-query'

import { useAcceptReadyCheck, useDeclineReadyCheck } from '@/core/lcu/lcu-mutations'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { createLcuQueryOptions, readyCheckDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { useCountdown } from '@/hooks/use-countdown'

import { useReadyCheckStore } from '../ready-check-store'
import { deriveReadyCheckStatus, readSecondsLeft } from '../ready-check-utils'

import type { UseReadyCheckResult } from '../ready-check-types'

export type { UseReadyCheckResult } from '../ready-check-types'

export function useReadyCheck(): UseReadyCheckResult {
  const acceptState = useReadyCheckStore((state) => {
    return state.accept
  })
  const declineState = useReadyCheckStore((state) => {
    return state.decline
  })
  const transport = useSharedLCUTransport()
  const readyCheckQuery = useQuery(createLcuQueryOptions(readyCheckDescriptor, transport))

  useLcuObserverSync(readyCheckDescriptor, transport)

  const acceptMutation = useAcceptReadyCheck()
  const declineMutation = useDeclineReadyCheck()
  const isRespondingRef = useRef(false)

  const readyCheckSnapshot = readyCheckQuery.data ?? null
  const remainingTimer = readyCheckSnapshot ? readSecondsLeft(readyCheckSnapshot.timer) : 0
  const countdown = useCountdown(readyCheckSnapshot ? remainingTimer : 0)
  const derivedTimer = countdown.remaining
  const derivedStatus = deriveReadyCheckStatus(readyCheckSnapshot, derivedTimer)

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

  // As in the client, accepting doesn't commit: the player can still decline while the countdown runs
  const decline = useCallback(async () => {
    if ((derivedStatus !== 'pending' && derivedStatus !== 'accepted') || derivedTimer <= 0 || isRespondingRef.current) {
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
  }, [declineMutation, declineState, derivedStatus, derivedTimer])

  return {
    accept,
    decline,
    elapsedSeconds: readyCheckSnapshot?.timer ?? 0,
    hasReadyCheck: readyCheckSnapshot !== null,
    isResponding: acceptMutation.isPending || declineMutation.isPending,
    status: derivedStatus,
    timer: derivedTimer,
  }
}
