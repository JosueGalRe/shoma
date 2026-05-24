import { create } from 'zustand'

import { selectIsClashPhase } from './clash-store-utils'
export { selectIsClashPhase }
import type { ClashState } from './clash-store-types';
import type { ClashStore } from './clash-store-types';
import type { ClashTeamMember } from './clash-store-types';

export type { ClashActions, ClashBracketRound, ClashPhase, ClashState, ClashStore, ClashTeamMember } from './clash-store-types'

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
