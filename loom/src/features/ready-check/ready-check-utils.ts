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

// "5vs5" as the Figma's match-found line has it. The LCU only says how many fit in a party, which is a team on the
// Two-team maps but the whole match in TFT (8) and Arena (18), so those get no matchup.
// Shortcut: assumes no two-team queue takes parties over 5, revisit if one does
export function formatMatchup(playersPerTeam: number | undefined): string | undefined {
  return playersPerTeam !== undefined && playersPerTeam <= 5 ? `${playersPerTeam}vs${playersPerTeam}` : undefined
}

const SUMMONERS_RIFT_MAP_ID = 11

// The match-found line as the Figma writes it: Summoner's Rift as "S.R" (in its Spanish frames too) with no matchup,
// Since the map already says 5vs5; other maps by name, with the matchup
export function formatMatchDetails(
  map: { id: number | undefined; name: string | undefined },
  description: string | undefined,
  playersPerTeam: number | undefined,
): { details: string[]; matchup: string | undefined } {
  const isSummonersRift = map.id === SUMMONERS_RIFT_MAP_ID
  const matchup = isSummonersRift ? undefined : formatMatchup(playersPerTeam)
  const details = [isSummonersRift ? 'S.R' : map.name, description, matchup].filter((detail): detail is string => {
    return detail !== undefined && detail !== ''
  })

  return { details, matchup }
}

export function normalizeTimer(timer: number): number {
  return Math.max(0, Math.ceil(timer))
}

// An answer outlives the countdown: the LCU may wait on the others past it
export function deriveReadyCheckStatus(snapshot: ReadyCheckSnapshot | null, timer: number): ReadyCheckStatus {
  if (!snapshot) {
    return 'expired'
  }

  if (snapshot.playerResponse === 'Accepted') {
    return 'accepted'
  }

  if (snapshot.playerResponse === 'Declined') {
    return 'declined'
  }

  if (snapshot.state === 'Expired' || timer <= 0) {
    return 'expired'
  }

  return 'pending'
}
