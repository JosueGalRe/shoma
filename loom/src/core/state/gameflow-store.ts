import { create } from 'zustand'

// @knip
export const gameflowPhases = ['None', 'Lobby', 'Matchmaking', 'ReadyCheck', 'ChampSelect', 'InProgress'] as const
export type GameflowPhase = (typeof gameflowPhases)[number]

// @knip
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

// @knip
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

type GameflowPhaseSelector<T> = (state: GameflowStore) => T

export const initialGameflowState: GameflowStoreState = {
  phase: 'None',
  previousPhase: null,
}

export function canTransitionGameflowPhase(from: GameflowPhase, to: GameflowPhase): boolean {
  if (from === to) {
    return true
  }

  const transitions = validGameflowTransitions[from]
  return transitions.some((transition) => transition === to)
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

export const selectGameflowPhase: GameflowPhaseSelector<GameflowPhase> = (state) => state.phase

export const selectPreviousGameflowPhase: GameflowPhaseSelector<GameflowPhase | null> = (state) => state.previousPhase

const gameflowPhaseSelectorCache = new Map<GameflowPhase, GameflowPhaseSelector<boolean>>()

export function selectIsGameflowPhase(phase: GameflowPhase): GameflowPhaseSelector<boolean> {
  const cachedSelector = gameflowPhaseSelectorCache.get(phase)

  if (cachedSelector) {
    return cachedSelector
  }

  const selector: GameflowPhaseSelector<boolean> = (state) => state.phase === phase
  gameflowPhaseSelectorCache.set(phase, selector)
  return selector
}

export const selectIsNone = selectIsGameflowPhase('None')
export const selectIsLobby = selectIsGameflowPhase('Lobby')
export const selectIsMatchmaking = selectIsGameflowPhase('Matchmaking')
export const selectIsReadyCheck = selectIsGameflowPhase('ReadyCheck')
export const selectIsChampSelect = selectIsGameflowPhase('ChampSelect')
export const selectIsInProgress = selectIsGameflowPhase('InProgress')

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
