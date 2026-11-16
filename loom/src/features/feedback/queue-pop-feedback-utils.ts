import { playMatchFoundAudio, showNotification, translateNotification } from '@/features/notifications/notification-utils'

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
      // The one place a pop alerts, whatever screen is open: a second play() restarts the sound, and each system
      // Notification rings on its own on Android
      if (previousPhase === 'Matchmaking' && phase === 'ReadyCheck') {
        const { body, title } = translateNotification('match-found')

        showNotification(title, { body, tag: 'match-found' })
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
