import { useCallback, useEffect, useRef, useState } from 'react'

import { normalizeSeconds } from './use-countdown-utils'

import type { UseCountdownResult } from './use-countdown-types'

export type { UseCountdownResult } from './use-countdown-types'

export function useCountdown(initialSeconds: number, onExpire?: () => void): UseCountdownResult {
  const normalizedInitialSeconds = normalizeSeconds(initialSeconds)
  const [renderTick, setRenderTick] = useState(0)
  const hasExpired = useRef(false)
  const initialSecondsRef = useRef(normalizedInitialSeconds)
  const remainingRef = useRef(normalizedInitialSeconds)
  const isRunningRef = useRef(normalizedInitialSeconds > 0)
  const previousInitialSecondsRef = useRef(normalizedInitialSeconds)
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onExpireRef.current = onExpire
  })

  useEffect(() => {
    if (previousInitialSecondsRef.current === normalizedInitialSeconds) {
      return
    }

    previousInitialSecondsRef.current = normalizedInitialSeconds
    initialSecondsRef.current = normalizedInitialSeconds
    remainingRef.current = normalizedInitialSeconds
    isRunningRef.current = normalizedInitialSeconds > 0
    hasExpired.current = false

    setRenderTick((currentTick) => {
      return currentTick + 1
    })
  }, [normalizedInitialSeconds])

  useEffect(() => {
    const interval = globalThis.setInterval(() => {
      if (!isRunningRef.current || remainingRef.current <= 0) {
        return
      }

      const nextRemaining = Math.max(0, remainingRef.current - 1)

      remainingRef.current = nextRemaining

      setRenderTick((currentTick) => {
        return currentTick + 1
      })
    }, 1000)

    return () => {
      return globalThis.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!isRunningRef.current || remainingRef.current !== 0 || hasExpired.current) {
      return
    }

    hasExpired.current = true
    isRunningRef.current = false
    onExpireRef.current?.()
  }, [normalizedInitialSeconds, renderTick])

  const start = useCallback(
    (seconds = normalizedInitialSeconds) => {
      const nextRemaining = normalizeSeconds(seconds)

      hasExpired.current = false
      initialSecondsRef.current = nextRemaining
      remainingRef.current = nextRemaining
      isRunningRef.current = nextRemaining > 0

      setRenderTick((currentTick) => {
        return currentTick + 1
      })
    },
    [normalizedInitialSeconds],
  )

  const stop = useCallback(() => {
    isRunningRef.current = false

    setRenderTick((currentTick) => {
      return currentTick + 1
    })
  }, [])

  const reset = useCallback(
    (seconds = normalizedInitialSeconds) => {
      const nextRemaining = normalizeSeconds(seconds)

      hasExpired.current = false
      initialSecondsRef.current = nextRemaining
      remainingRef.current = nextRemaining
      isRunningRef.current = nextRemaining > 0

      setRenderTick((currentTick) => {
        return currentTick + 1
      })
    },
    [normalizedInitialSeconds],
  )

  // When initialSeconds just changed, the reset effect has not committed yet; derive the
  // Post-reset values read-only so the transition render never shows stale countdown data.
  const hasPendingReset = previousInitialSecondsRef.current !== normalizedInitialSeconds

  const displayInitialSeconds = hasPendingReset ? normalizedInitialSeconds : initialSecondsRef.current
  const displayRemaining = hasPendingReset ? normalizedInitialSeconds : remainingRef.current
  const displayIsRunning = hasPendingReset ? normalizedInitialSeconds > 0 : isRunningRef.current

  return {
    elapsed: Math.max(0, displayInitialSeconds - displayRemaining),
    isActive: displayIsRunning && displayRemaining > 0,
    remaining: displayRemaining,
    reset,
    start,
    stop,
  }
}
