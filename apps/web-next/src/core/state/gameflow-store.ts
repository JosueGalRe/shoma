import { create } from 'zustand'

export const gameflowPhases = ['None', 'Lobby', 'Matchmaking', 'ReadyCheck', 'ChampSelect', 'InProgress'] as const
export type GameflowPhase = (typeof gameflowPhases)[number]

export const validGameflowTransitions = {
  ChampSelect: ['InProgress', 'Lobby', 'None'],
  InProgress: ['None', 'Lobby'],
  Lobby: ['Matchmaking', 'None'],
  Matchmaking: ['ReadyCheck', 'Lobby', 'None'],
  None: ['Lobby'],
  ReadyCheck: ['ChampSelect', 'Matchmaking', 'Lobby', 'None'],
} as const satisfies Record<GameflowPhase, readonly GameflowPhase[]>

export type GameflowStoreState = {
  phase: GameflowPhase
  previousPhase: GameflowPhase | null
}

export type GameflowStoreActions = {
  goToNone: () => void
  goToLobby: () => void
  startMatchmaking: () => void
  startReadyCheck: () => void
  enterChampSelect: () => void
  enterInProgress: () => void
  reset: () => void
}

export type GameflowStore = GameflowStoreState & GameflowStoreActions

export const initialGameflowState: GameflowStoreState = {
  phase: 'None',
  previousPhase: null,
}

export function canTransitionGameflowPhase(from: GameflowPhase, to: GameflowPhase): boolean {
  if (from === to) {
    return true
  }

  const transitions = validGameflowTransitions[from] as readonly GameflowPhase[]
  return transitions.includes(to)
}

export function reduceGameflowTransition(state: GameflowStoreState, nextPhase: GameflowPhase): GameflowStoreState {
  if (!canTransitionGameflowPhase(state.phase, nextPhase)) {
    return state
  }

  if (state.phase === nextPhase) {
    return state
  }

  return {
    phase: nextPhase,
    previousPhase: state.phase,
  }
}

export function reduceGameflowReset(): GameflowStoreState {
  return initialGameflowState
}

export const useGameflowStore = create<GameflowStore>()((set) => ({
  ...initialGameflowState,
  enterChampSelect() {
    set((state) => reduceGameflowTransition(state, 'ChampSelect'))
  },
  enterInProgress() {
    set((state) => reduceGameflowTransition(state, 'InProgress'))
  },
  goToLobby() {
    set((state) => reduceGameflowTransition(state, 'Lobby'))
  },
  goToNone() {
    set((state) => reduceGameflowTransition(state, 'None'))
  },
  reset() {
    set(() => reduceGameflowReset())
  },
  startMatchmaking() {
    set((state) => reduceGameflowTransition(state, 'Matchmaking'))
  },
  startReadyCheck() {
    set((state) => reduceGameflowTransition(state, 'ReadyCheck'))
  },
}))
