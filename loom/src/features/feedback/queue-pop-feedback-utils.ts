import type { QueuePopFeedbackTracker } from './queue-pop-feedback-types'

const QUEUE_POP_VIBRATION_PATTERN: number[] = [500, 250, 500, 250, 500, 250, 500, 250]

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

export function createQueuePopFeedbackTracker(): QueuePopFeedbackTracker {
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
