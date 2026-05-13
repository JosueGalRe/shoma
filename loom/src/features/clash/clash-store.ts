import { create } from 'zustand'

import type { SummonerId } from '@/core/types/branded'

export type ClashTeamMember = {
  summonerId: SummonerId
  name: string
  role: string
  isCaptain: boolean
}

export type ClashState = {
  teamName: string
  members: ClashTeamMember[]
  tickets: number
  phase: 'registration' | 'check-in' | 'lock-in' | 'scouting' | 'bracket'
  checkInTimeRemaining: number
  lockInTimeRemaining: number
  opponentTeam: { name: string; members: ClashTeamMember[] } | null
  bracket: { round: number; matches: { teamA: string; teamB: string; winner: string | null }[] }[]
}

// @knip
export type ClashActions = {
  setTeam: (teamName: string, members: ClashTeamMember[]) => void
  setPhase: (phase: ClashState['phase']) => void
  setTimers: (checkIn: number, lockIn: number) => void
  setOpponent: (opponent: ClashState['opponentTeam']) => void
  setBracket: (bracket: ClashState['bracket']) => void
  reset: () => void
}

export type ClashStore = ClashState & ClashActions

type ClashStoreSelector<T> = (state: ClashStore) => T

const clashPhaseSelectorCache = new Map<ClashState['phase'], ClashStoreSelector<boolean>>()

// @knip
export const initialClashState: ClashState = {
  teamName: '',
  members: [],
  tickets: 0,
  phase: 'registration',
  checkInTimeRemaining: 0,
  lockInTimeRemaining: 0,
  opponentTeam: null,
  bracket: [],
}

export const selectClashTeamName: ClashStoreSelector<string> = (state) => state.teamName

export const selectClashMembers: ClashStoreSelector<ClashTeamMember[]> = (state) => state.members

export const selectClashTickets: ClashStoreSelector<number> = (state) => state.tickets

export const selectClashPhase: ClashStoreSelector<ClashState['phase']> = (state) => state.phase

export const selectClashCheckInTimeRemaining: ClashStoreSelector<number> = (state) => state.checkInTimeRemaining

export const selectClashLockInTimeRemaining: ClashStoreSelector<number> = (state) => state.lockInTimeRemaining

export const selectClashOpponentTeam: ClashStoreSelector<ClashState['opponentTeam']> = (state) => state.opponentTeam

export const selectClashBracket: ClashStoreSelector<ClashState['bracket']> = (state) => state.bracket

export const selectClashHasOpponent: ClashStoreSelector<boolean> = (state) => state.opponentTeam !== null

export function selectIsClashPhase(phase: ClashState['phase']): ClashStoreSelector<boolean> {
  const cachedSelector = clashPhaseSelectorCache.get(phase)

  if (cachedSelector) {
    return cachedSelector
  }

  const selector: ClashStoreSelector<boolean> = (state) => state.phase === phase
  clashPhaseSelectorCache.set(phase, selector)
  return selector
}

export const selectIsClashRegistration = selectIsClashPhase('registration')
export const selectIsClashCheckIn = selectIsClashPhase('check-in')
export const selectIsClashLockIn = selectIsClashPhase('lock-in')
export const selectIsClashScouting = selectIsClashPhase('scouting')
export const selectIsClashBracket = selectIsClashPhase('bracket')

export const useClashStore = create<ClashStore>()((set) => ({
  ...initialClashState,
  setTeam(teamName, members) {
    set({
      members,
      teamName,
    })
  },
  setPhase(phase) {
    set({ phase })
  },
  setTimers(checkIn, lockIn) {
    set({
      checkInTimeRemaining: checkIn,
      lockInTimeRemaining: lockIn,
    })
  },
  setOpponent(opponent) {
    set({ opponentTeam: opponent })
  },
  setBracket(bracket) {
    set({ bracket })
  },
  reset() {
    set({ ...initialClashState })
  },
}))
