import { beforeEach, describe, expect, test } from 'bun:test'

import {
  canTransitionGameflowPhase,
  initialGameflowState,
  reduceGameflowReset,
  reduceGameflowTransition,
  useGameflowStore,
  type GameflowPhase,
  type GameflowStoreState,
} from '../../src/core/state/gameflow-store'

const validFlow: GameflowPhase[] = ['Lobby', 'Matchmaking', 'ReadyCheck', 'ChampSelect', 'InProgress', 'None']

beforeEach(() => {
  useGameflowStore.setState(reduceGameflowReset())
})

describe('gameflow reducer', () => {
  test('allows valid transitions and records the previous phase', () => {
    let state: GameflowStoreState = initialGameflowState

    for (const phase of validFlow) {
      const previous = state.phase
      state = reduceGameflowTransition(state, phase)

      expect(state.phase).toBe(phase)
      expect(state.previousPhase).toBe(previous)
    }
  })

  test('keeps invalid transitions as no-ops', () => {
    const state: GameflowStoreState = { phase: 'None', previousPhase: null }
    const next = reduceGameflowTransition(state, 'ChampSelect')

    expect(next).toBe(state)
    expect(canTransitionGameflowPhase('None', 'ChampSelect')).toBe(false)
  })

  test('keeps repeated transitions as no-ops', () => {
    const state: GameflowStoreState = { phase: 'Lobby', previousPhase: 'None' }
    const next = reduceGameflowTransition(state, 'Lobby')

    expect(next).toBe(state)
  })

  test('resets back to the initial phase', () => {
    expect(reduceGameflowReset()).toEqual({ phase: 'None', previousPhase: null })
  })
})

describe('useGameflowStore', () => {
  test('applies valid action transitions', () => {
    useGameflowStore.getState().goToLobby()
    useGameflowStore.getState().startMatchmaking()
    useGameflowStore.getState().startReadyCheck()
    useGameflowStore.getState().enterChampSelect()

    expect(useGameflowStore.getState()).toMatchObject({ phase: 'ChampSelect', previousPhase: 'ReadyCheck' })
  })

  test('ignores invalid action transitions', () => {
    useGameflowStore.getState().enterChampSelect()

    expect(useGameflowStore.getState()).toMatchObject({ phase: 'None', previousPhase: null })
  })
}
)
