import { useEffect, useState } from 'react'

import { readElapsedSeconds } from './use-elapsed-time-utils'

export { formatElapsedSeconds } from './use-elapsed-time-utils'

export function useElapsedTime(startTime: number | null, isRunning = true): number {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!isRunning || startTime === null) {
      return undefined
    }

    const interval = window.setInterval(() => {
      setTick((currentTick) => {
        return currentTick + 1
      })
    }, 1000)

    return () => {
      return window.clearInterval(interval)
    }
  }, [isRunning, startTime])

  return readElapsedSeconds(startTime)
}
