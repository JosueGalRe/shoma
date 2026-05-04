/// <reference types="bun" />

import { beforeEach, describe, expect, it } from 'bun:test'

import { useGameflowStore } from '../../src/core/state/gameflow-store'
import { createChampSelectStore, type ChampSelectSession } from '../../src/features/champ-select/champ-select-store'

function createSession(actionType: 'ban' | 'pick', championId = 0): ChampSelectSession {
  return {
    actions: [
      [
        {
          actorCellId: 1,
          championId,
          completed: false,
          id: 7,
          type: actionType,
        },
      ],
    ],
    benchChampionIds: [12, 34],
    benchEnabled: true,
    localPlayerCellId: 1,
    myTeam: [{ cellId: 1, championId: 0, displayName: 'Local Player' }],
    theirTeam: [{ cellId: 6, championId: 0 }],
    timer: { adjustedTimeLeftInPhase: 27_400, phase: 'BAN_PICK' },
  }
}

describe('champ select store', () => {
  beforeEach(() => {
    useGameflowStore.getState().reset()
  })

  it('detects ban and pick phase transitions from active local actions', () => {
    const store = createChampSelectStore()

    store.getState().setChampSelectState(createSession('ban'))
    expect(store.getState().phase).toBe('ban')
    expect(store.getState().isMyTurn).toBe(true)
    expect(useGameflowStore.getState().phase).toBe('champSelect')

    store.getState().setChampSelectState(createSession('pick'))
    expect(store.getState().phase).toBe('pick')
    expect(store.getState().currentAction?.type).toBe('pick')
  })

  it('locks a pick and updates the local team champion', async () => {
    const store = createChampSelectStore()
    store.getState().setChampSelectState(createSession('pick'))

    const picked = await store.getState().pickChampion(99, async (actionId, body) => {
      expect(actionId).toBe(7)
      expect(body).toEqual({ championId: 99, completed: true, type: 'pick' })
    })

    expect(picked).toBe(true)
    expect(store.getState().myTeam[0]?.championId).toBe(99)
    expect(store.getState().actions[0]?.[0]?.completed).toBe(true)
    expect(store.getState().isMyTurn).toBe(false)
  })

  it('locks a ban without assigning a local champion', async () => {
    const store = createChampSelectStore()
    store.getState().setChampSelectState(createSession('ban'))

    const banned = await store.getState().banChampion(55, async (actionId, body) => {
      expect(actionId).toBe(7)
      expect(body).toEqual({ championId: 55, completed: true, type: 'ban' })
    })

    expect(banned).toBe(true)
    expect(store.getState().myTeam[0]?.championId).toBe(0)
    expect(store.getState().actions[0]?.[0]?.championId).toBe(55)
  })

  it('counts down timer seconds from LCU milliseconds', () => {
    const store = createChampSelectStore()
    store.getState().setChampSelectState(createSession('pick'))

    expect(store.getState().timer).toBe(28)

    store.getState().decrementTimer()
    store.getState().decrementTimer()

    expect(store.getState().timer).toBe(26)
  })

  it('keeps state stable when a pick request is rejected', async () => {
    const store = createChampSelectStore()
    store.getState().setChampSelectState(createSession('pick'))

    const picked = await store.getState().pickChampion(99, async () => {
      throw new Error('pick rejected')
    })

    expect(picked).toBe(false)
    expect(store.getState().error?.message).toBe('pick rejected')
    expect(store.getState().myTeam[0]?.championId).toBe(0)
    expect(store.getState().isMyTurn).toBe(true)
  })
})
