import { useCallback, useEffect, useRef, useState } from 'react'

import type { UseCountdownResult } from './use-countdown-types'
import { normalizeSeconds } from './use-countdown-utils'

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

  onExpireRef.current = onExpire

  if (previousInitialSecondsRef.current !== normalizedInitialSeconds) {
    previousInitialSecondsRef.current = normalizedInitialSeconds
    initialSecondsRef.current = normalizedInitialSeconds
    remainingRef.current = normalizedInitialSeconds
    isRunningRef.current = normalizedInitialSeconds > 0
    hasExpired.current = false
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
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
      return window.clearInterval(interval)
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

  return {
    elapsed: Math.max(0, initialSecondsRef.current - remainingRef.current),
    isActive: isRunningRef.current && remainingRef.current > 0,
    remaining: remainingRef.current,
    reset,
    start,
    stop,
  }
}
