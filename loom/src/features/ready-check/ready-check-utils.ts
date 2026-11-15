import type { ReadyCheckStatus } from './ready-check-types'
import type { ReadyCheckSnapshot } from '@/core/lcu/parsers/ready-check'

export function formatTimer(seconds: number): string {
  const safeSeconds = Math.max(0, seconds)

  return safeSeconds.toString()
}

// The client's countdown video (timer-countdown.webm), which it plays to end this long after the pop
export const READY_CHECK_SECONDS = 10.733

// The LCU's ready-check timer is the seconds since the pop, not the seconds left
export function readSecondsLeft(elapsedSeconds: number): number {
  return normalizeTimer(READY_CHECK_SECONDS - elapsedSeconds)
}

export function normalizeTimer(timer: number): number {
  return Math.max(0, Math.ceil(timer))
}

export function deriveReadyCheckStatus(snapshot: ReadyCheckSnapshot | null, timer: number): ReadyCheckStatus {
  if (!snapshot) {
    return 'expired'
  }

  if (snapshot.state === 'Expired' || timer <= 0) {
    return 'expired'
  }

  if (snapshot.playerResponse === 'Accepted') {
    return 'accepted'
  }

  if (snapshot.playerResponse === 'Declined') {
    return 'declined'
  }

  return 'pending'
}
