import { useEffect, useRef } from 'react'

const QUEUE_POP_VIBRATION_PATTERN = [500, 250, 500, 250, 500, 250, 500, 250] as const

export async function playQueuePopSound(): Promise<void> {
  if (typeof Audio === 'undefined') {
    return
  }

  try {
    const audio = new Audio('/queue-pop.mp3')
    await audio.play()
  } catch {
    // Ignore autoplay and playback policy failures.
  }
}

export function triggerQueuePopVibration(): void {
  if (typeof navigator === 'undefined') {
    return
  }

  if (typeof navigator.vibrate !== 'function') {
    return
  }

  try {
    navigator.vibrate(QUEUE_POP_VIBRATION_PATTERN)
  } catch {
    // Ignore unsupported or blocked vibration calls.
  }
}

export function createQueuePopFeedbackTracker(): {
  handlePhase: (phase: string | null) => void
  reset: () => void
} {
  let previousPhase: string | null = null

  return {
    handlePhase(phase: string | null): void {
      if (previousPhase === 'Matchmaking' && phase === 'ReadyCheck') {
        void playQueuePopSound()
        triggerQueuePopVibration()
      }

      previousPhase = phase
    },
    reset(): void {
      previousPhase = null
    },
  }
}

export function useQueuePopFeedback(phase: string | null): void {
  const tracker = useRef(createQueuePopFeedbackTracker())

  useEffect(() => {
    tracker.current.handlePhase(phase)
  }, [phase])
}
