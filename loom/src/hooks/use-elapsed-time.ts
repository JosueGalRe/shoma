import { useEffect, useState } from 'react'

import { readElapsedSeconds } from './use-elapsed-time-utils'

export { formatElapsedSeconds } from './use-elapsed-time-utils'

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
