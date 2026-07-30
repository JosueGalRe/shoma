import { create } from 'zustand'

const gameflowPhases = ['None', 'Lobby', 'Matchmaking', 'ReadyCheck', 'ChampSelect', 'InProgress'] as const

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

export interface GameflowStoreState {
  phase: GameflowPhase
  previousPhase: GameflowPhase | null
}

// @knip
export interface GameflowStoreActions {
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

  return transitions.some((transition) => {
    return transition === to
  })
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

export function selectGameflowPhase(state: GameflowStore): GameflowPhase {
  return state.phase
}

export function selectPreviousGameflowPhase(state: GameflowStore): GameflowPhase | null {
  return state.previousPhase
}

const gameflowPhaseSelectorCache = new Map<GameflowPhase, GameflowPhaseSelector<boolean>>()

export function selectIsGameflowPhase(phase: GameflowPhase): GameflowPhaseSelector<boolean> {
  const cachedSelector = gameflowPhaseSelectorCache.get(phase)

  if (cachedSelector) {
    return cachedSelector
  }

  function selector(state: GameflowStore): boolean {
    return state.phase === phase
  }

  gameflowPhaseSelectorCache.set(phase, selector)

  return selector
}

export const selectIsNone = selectIsGameflowPhase('None')
export const selectIsLobby = selectIsGameflowPhase('Lobby')
export const selectIsMatchmaking = selectIsGameflowPhase('Matchmaking')
export const selectIsReadyCheck = selectIsGameflowPhase('ReadyCheck')
export const selectIsChampSelect = selectIsGameflowPhase('ChampSelect')
export const selectIsInProgress = selectIsGameflowPhase('InProgress')

export const useGameflowStore = create<GameflowStore>()((set) => {
  return {
    ...initialGameflowState,
    enterChampSelect() {
      set((state) => {
        return reduceGameflowTransition(state, 'ChampSelect')
      })
    },
    enterInProgress() {
      set((state) => {
        return reduceGameflowTransition(state, 'InProgress')
      })
    },
    goToLobby() {
      set((state) => {
        return reduceGameflowTransition(state, 'Lobby')
      })
    },
    goToNone() {
      set((state) => {
        return reduceGameflowTransition(state, 'None')
      })
    },
    reset() {
      set(() => {
        return reduceGameflowReset()
      })
    },
    startMatchmaking() {
      set((state) => {
        return reduceGameflowTransition(state, 'Matchmaking')
      })
    },
    startReadyCheck() {
      set((state) => {
        return reduceGameflowTransition(state, 'ReadyCheck')
      })
    },
  }
})
