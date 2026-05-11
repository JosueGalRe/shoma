import { expect, test } from '@playwright/test'

import {
  canTransitionGameflowPhase,
  initialGameflowState,
  reduceGameflowReset,
  reduceGameflowTransition,
  useGameflowStore,
  type GameflowPhase,
} from '../../src/core/state/gameflow-store'

test.describe('gameflow transitions', () => {
  test.beforeEach(() => {
    useGameflowStore.getState().reset()
  })

  test('allows the rebuilt happy path from lobby to champ select', () => {
    const phases: GameflowPhase[] = ['Lobby', 'Matchmaking', 'ReadyCheck', 'ChampSelect', 'InProgress']
    const state = phases.reduce(reduceGameflowTransition, initialGameflowState)

    expect(state).toEqual({ phase: 'InProgress', previousPhase: 'ChampSelect' })
    expect(canTransitionGameflowPhase('Lobby', 'Matchmaking')).toBe(true)
    expect(canTransitionGameflowPhase('Matchmaking', 'ReadyCheck')).toBe(true)
    expect(canTransitionGameflowPhase('ReadyCheck', 'ChampSelect')).toBe(true)
    expect(canTransitionGameflowPhase('ChampSelect', 'InProgress')).toBe(true)
  })

  test('rejects invalid rebuilt transitions as no-ops', () => {
    const lobbyState = reduceGameflowTransition(initialGameflowState, 'Lobby')
    const skippedState = reduceGameflowTransition(lobbyState, 'ChampSelect')

    expect(canTransitionGameflowPhase('Lobby', 'ChampSelect')).toBe(false)
    expect(skippedState).toBe(lobbyState)
    expect(reduceGameflowTransition(lobbyState, 'Lobby')).toBe(lobbyState)
    expect(reduceGameflowReset()).toEqual(initialGameflowState)
  })

  test('store actions preserve previous phase and reset state', () => {
    const store = useGameflowStore

    store.getState().goToLobby()
    expect(store.getState()).toMatchObject({ phase: 'Lobby', previousPhase: 'None' })

    store.getState().startMatchmaking()
    expect(store.getState()).toMatchObject({ phase: 'Matchmaking', previousPhase: 'Lobby' })

    store.getState().enterChampSelect()
    expect(store.getState()).toMatchObject({ phase: 'Matchmaking', previousPhase: 'Lobby' })

    store.getState().startReadyCheck()
    store.getState().enterChampSelect()
    expect(store.getState()).toMatchObject({ phase: 'ChampSelect', previousPhase: 'ReadyCheck' })

    store.getState().reset()
    expect(store.getState()).toMatchObject(initialGameflowState)
  })
})
