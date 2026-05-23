import { useEffect, useState } from 'react'

function readElapsedSeconds(startTime: number | null): number {
  if (startTime === null) return 0

  return Math.max(0, Math.floor((Date.now() - startTime) / 1000))
}

export function formatElapsedSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function useElapsedTime(startTime: number | null, isRunning = true): number {
  const [elapsedSeconds, setElapsedSeconds] = useState(() => readElapsedSeconds(startTime))

  useEffect(() => {
    if (!isRunning || startTime === null) {
      setElapsedSeconds(0)
      return undefined
    }

    setElapsedSeconds(readElapsedSeconds(startTime))

    const interval = window.setInterval(() => {
      setElapsedSeconds(readElapsedSeconds(startTime))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isRunning, startTime])

  return elapsedSeconds
}
