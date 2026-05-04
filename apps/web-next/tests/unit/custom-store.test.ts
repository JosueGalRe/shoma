/// <reference types="bun" />

import { beforeEach, describe, expect, test } from 'bun:test'

import { useCustomGameStore } from '../../src/features/custom/custom-store'

beforeEach(() => {
  useCustomGameStore.getState().reset()
})

describe('custom game store', () => {
  test('adds and removes players', () => {
    useCustomGameStore.getState().addPlayer({
      id: 'player-1',
      name: 'Player One',
      team: 'blue',
      isBot: false,
    })

    expect(useCustomGameStore.getState().players).toEqual([
      {
        id: 'player-1',
        name: 'Player One',
        team: 'blue',
        isBot: false,
      },
    ])

    useCustomGameStore.getState().removePlayer('player-1')

    expect(useCustomGameStore.getState().players).toEqual([])
  })

  test('moves players between teams', () => {
    useCustomGameStore.getState().addPlayer({
      id: 'player-1',
      name: 'Player One',
      team: 'blue',
      isBot: false,
    })

    useCustomGameStore.getState().movePlayer('player-1', 'red')

    expect(useCustomGameStore.getState().players[0]).toMatchObject({
      id: 'player-1',
      team: 'red',
    })
  })

  test('adds bots with difficulty', () => {
    useCustomGameStore.getState().addBot('hard', 'red')

    expect(useCustomGameStore.getState().players).toEqual([
      {
        id: 'bot-1',
        name: 'Bot 1',
        team: 'red',
        isBot: true,
        botDifficulty: 'hard',
      },
    ])
  })

  test('toggles spectator mode', () => {
    expect(useCustomGameStore.getState().isSpectatorEnabled).toBe(true)

    useCustomGameStore.getState().toggleSpectator()

    expect(useCustomGameStore.getState().isSpectatorEnabled).toBe(false)
  })
})
