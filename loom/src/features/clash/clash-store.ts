import { create } from 'zustand'

import { selectIsClashPhase } from './clash-store-utils'
export { selectIsClashPhase }
import type {
  ClashState,
  ClashStore,
  ClashStoreSelector,
  ClashTeamMember,
} from './clash-store-types'

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

export const selectClashTeamName: ClashStoreSelector<string> = (state) => state.teamName

export const selectClashMembers: ClashStoreSelector<ClashTeamMember[]> = (state) => state.members

export const selectClashTickets: ClashStoreSelector<number> = (state) => state.tickets

export const selectClashPhase: ClashStoreSelector<ClashState['phase']> = (state) => state.phase

export const selectClashCheckInTimeRemaining: ClashStoreSelector<number> = (state) => state.checkInTimeRemaining

export const selectClashLockInTimeRemaining: ClashStoreSelector<number> = (state) => state.lockInTimeRemaining

export const selectClashOpponentTeam: ClashStoreSelector<ClashState['opponentTeam']> = (state) => state.opponentTeam

export const selectClashBracket: ClashStoreSelector<ClashState['bracket']> = (state) => state.bracket

export const selectClashHasOpponent: ClashStoreSelector<boolean> = (state) => state.opponentTeam !== null

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
