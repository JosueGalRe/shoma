import type { ReadyCheckSnapshot } from '@/core/lcu/parsers/ready-check'

import type { ReadyCheckStatus } from './ready-check-types'

export function formatTimer(seconds: number): string {
  const safeSeconds = Math.max(0, seconds)
  return safeSeconds.toString()
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
