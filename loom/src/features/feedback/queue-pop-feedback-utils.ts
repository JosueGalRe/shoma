import { playMatchFoundAudio } from '@/features/notifications/notification-utils'

import type { QueuePopFeedbackTracker } from './queue-pop-feedback-types'

const QUEUE_POP_VIBRATION_PATTERN: number[] = [500, 250, 500, 250, 500, 250, 500, 250]

export function playQueuePopSound(): void {
  playMatchFoundAudio()
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
        playQueuePopSound()
        triggerQueuePopVibration()
      }

      previousPhase = phase
    },
    reset(): void {
      previousPhase = null
    },
  }
}
