import { create } from 'zustand'

export type ClashTeamMember = {
  summonerId: string
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

export type ClashActions = {
  setTeam: (teamName: string, members: ClashTeamMember[]) => void
  setPhase: (phase: ClashState['phase']) => void
  setTimers: (checkIn: number, lockIn: number) => void
  setOpponent: (opponent: ClashState['opponentTeam']) => void
  setBracket: (bracket: ClashState['bracket']) => void
  reset: () => void
}

export type ClashStore = ClashState & ClashActions

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
