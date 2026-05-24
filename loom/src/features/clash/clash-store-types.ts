import type { SummonerId } from '@/core/types/branded'

export type ClashPhase = 'registration' | 'check-in' | 'lock-in' | 'scouting' | 'bracket'

export type ClashTeamMember = {
  summonerId: SummonerId
  name: string
  role: string
  isCaptain: boolean
}

export type ClashOpponentTeam = {
  name: string
  members: ClashTeamMember[]
}

export type ClashBracketMatch = {
  teamA: string
  teamB: string
  winner: string | null
}

export type ClashBracketRound = {
  round: number
  matches: ClashBracketMatch[]
}

export type ClashState = {
  teamName: string
  members: ClashTeamMember[]
  tickets: number
  phase: ClashPhase
  checkInTimeRemaining: number
  lockInTimeRemaining: number
  opponentTeam: ClashOpponentTeam | null
  bracket: ClashBracketRound[]
}

export type ClashActions = {
  setTeam: (teamName: string, members: ClashTeamMember[]) => void
  setPhase: (phase: ClashPhase) => void
  setTimers: (checkIn: number, lockIn: number) => void
  setOpponent: (opponent: ClashState['opponentTeam']) => void
  setBracket: (bracket: ClashState['bracket']) => void
  reset: () => void
}

export type ClashStore = ClashState & ClashActions

export type ClashStoreSelector<T> = (state: ClashStore) => T
