import { create } from 'zustand'

import { selectIsClashPhase } from './clash-store-utils'
export { selectIsClashPhase }
import type { ClashState, ClashStore, ClashTeamMember } from './clash-store-types';



export type { ClashActions, ClashBracketRound, ClashPhase, ClashState, ClashStore, ClashTeamMember } from './clash-store-types'

export const initialClashState: ClashState = {
  bracket: [],
  checkInTimeRemaining: 0,
  lockInTimeRemaining: 0,
  members: [],
  opponentTeam: null,
  phase: 'registration',
  teamName: '',
  tickets: 0,
}

export function selectClashTeamName(state: ClashStore): string {
  return state.teamName
}

export function selectClashMembers(state: ClashStore): ClashTeamMember[] {
  return state.members
}

export function selectClashTickets(state: ClashStore): number {
  return state.tickets
}

export function selectClashPhase(state: ClashStore): ClashState['phase'] {
  return state.phase
}

export function selectClashCheckInTimeRemaining(state: ClashStore): number {
  return state.checkInTimeRemaining
}

export function selectClashLockInTimeRemaining(state: ClashStore): number {
  return state.lockInTimeRemaining
}

export function selectClashOpponentTeam(state: ClashStore): ClashState['opponentTeam'] {
  return state.opponentTeam
}

export function selectClashBracket(state: ClashStore): ClashState['bracket'] {
  return state.bracket
}

export function selectClashHasOpponent(state: ClashStore): boolean {
  return state.opponentTeam !== null
}

export const selectIsClashRegistration = selectIsClashPhase('registration')
export const selectIsClashCheckIn = selectIsClashPhase('check-in')
export const selectIsClashLockIn = selectIsClashPhase('lock-in')
export const selectIsClashScouting = selectIsClashPhase('scouting')
export const selectIsClashBracket = selectIsClashPhase('bracket')

export const useClashStore = create<ClashStore>()((set) => {
  return {
    ...initialClashState,
    reset() {
      set({ ...initialClashState })
    },
    setBracket(bracket) {
      set({ bracket })
    },
    setOpponent(opponent) {
      set({ opponentTeam: opponent })
    },
    setPhase(phase) {
      set({ phase })
    },
    setTeam(teamName, members) {
      set({
        members,
        teamName,
      })
    },
    setTimers(checkIn, lockIn) {
      set({
        checkInTimeRemaining: checkIn,
        lockInTimeRemaining: lockIn,
      })
    },
  }
})
