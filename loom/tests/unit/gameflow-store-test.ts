import { beforeEach, describe, expect, test } from 'vitest'

import {
  canTransitionGameflowPhase,
  initialGameflowState,
  selectGameflowPhase,
  selectIsChampSelect,
  selectIsGameflowPhase,
  selectIsInProgress,
  selectIsLobby,
  selectIsMatchmaking,
  selectIsNone,
  selectIsReadyCheck,
  selectPreviousGameflowPhase,
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
  test('exposes memoized phase selectors', () => {
    useGameflowStore.setState({ phase: 'Lobby', previousPhase: 'None' })
    const state = useGameflowStore.getState()

    expect(selectGameflowPhase(state)).toBe('Lobby')
    expect(selectPreviousGameflowPhase(state)).toBe('None')
    expect(selectIsNone(state)).toBe(false)
    expect(selectIsLobby(state)).toBe(true)
    expect(selectIsMatchmaking(state)).toBe(false)
    expect(selectIsReadyCheck(state)).toBe(false)
    expect(selectIsChampSelect(state)).toBe(false)
    expect(selectIsInProgress(state)).toBe(false)
    expect(selectIsGameflowPhase('Lobby')).toBe(selectIsLobby)
    expect(selectIsGameflowPhase('ReadyCheck')).toBe(selectIsReadyCheck)
  })

  test('does not use persist middleware', () => {
    expect((useGameflowStore as typeof useGameflowStore & { persist?: unknown }).persist).toBeUndefined()
  })

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
})
