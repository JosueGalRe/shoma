import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

function normalizeSeconds(seconds: number): number {
  return Math.max(0, Math.ceil(seconds))
}

export function useCountdown(initialSeconds: number, onExpire?: () => void) {
  const normalizedInitialSeconds = normalizeSeconds(initialSeconds)
  const [remaining, setRemaining] = useState(normalizedInitialSeconds)
  const [isRunning, setIsRunning] = useState(normalizedInitialSeconds > 0)
  const hasExpired = useRef(false)

  // Internal state reset: align countdown with prop changes
  useEffect(() => {
    hasExpired.current = false
    setRemaining(normalizedInitialSeconds)
    setIsRunning(normalizedInitialSeconds > 0)
  }, [normalizedInitialSeconds])

  // External system sync: keep React countdown state aligned with the browser clock.
  // External system sync: invoke callback when countdown expires
  useEffect(() => {
    if (!isRunning || remaining <= 0) {
      return undefined
    }

    const interval = window.setInterval(() => {
      setRemaining((currentRemaining) => Math.max(0, currentRemaining - 1))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isRunning, remaining])

  // External system sync: stop countdown and invoke expiration callback when timer reaches zero
  useEffect(() => {
    if (!isRunning || remaining !== 0) {
      return
    }

    setIsRunning(false)

    if (!hasExpired.current) {
      hasExpired.current = true
      onExpire?.()
    }
  }, [isRunning, onExpire, remaining])

  const start = useCallback((seconds = normalizedInitialSeconds) => {
    const nextRemaining = normalizeSeconds(seconds)
    hasExpired.current = false
    setRemaining(nextRemaining)
    setIsRunning(nextRemaining > 0)
  }, [normalizedInitialSeconds])

  const stop = useCallback(() => {
    setIsRunning(false)
  }, [])

  const reset = useCallback((seconds = normalizedInitialSeconds) => {
    const nextRemaining = normalizeSeconds(seconds)
    hasExpired.current = false
    setRemaining(nextRemaining)
    setIsRunning(nextRemaining > 0)
  }, [normalizedInitialSeconds])

  return useMemo(() => ({
    elapsed: Math.max(0, normalizedInitialSeconds - remaining),
    isActive: isRunning && remaining > 0,
    remaining,
    reset,
    start,
    stop,
  }), [isRunning, normalizedInitialSeconds, remaining, reset, start, stop])
}
