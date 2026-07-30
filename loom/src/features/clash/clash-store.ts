import { create } from 'zustand'

import { selectIsClashPhase } from './clash-store-utils'

import type { ClashState, ClashStore, ClashTeamMember } from './clash-store-types'

export { selectIsClashPhase }

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

export function selectClashMembers(state: ClashStore): ClashTeamMember[] {
  return state.members
}

export function selectClashPhase(state: ClashStore): ClashState['phase'] {
  return state.phase
}

export function selectClashCheckInTimeRemaining(state: ClashStore): number {
  return state.checkInTimeRemaining
}

export function selectClashHasOpponent(state: ClashStore): boolean {
  return state.opponentTeam !== null
}

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
