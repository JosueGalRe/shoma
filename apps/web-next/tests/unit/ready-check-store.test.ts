/// <reference types="bun" />

import { beforeEach, describe, expect, it } from 'bun:test'

import { useGameflowStore } from '../../src/core/state/gameflow-store'
import { createReadyCheckStore } from '../../src/features/ready-check/ready-check-store'

describe('ready check store', () => {
  beforeEach(() => {
    useGameflowStore.getState().reset()
  })

  it('accepts an active ready check and transitions gameflow state', async () => {
    const store = createReadyCheckStore()
    store.getState().setReadyCheckState({ playerResponse: 'None', state: 'InProgress', timer: 10 })

    const accepted = await store.getState().accept(async () => Promise.resolve())

    expect(accepted).toBe(true)
    expect(store.getState().playerResponse).toBe('Accepted')
    expect(store.getState().isActive).toBe(false)
    expect(useGameflowStore.getState().phase).toBe('champSelect')
  })

  it('declines an active ready check and returns to queue phase', async () => {
    const store = createReadyCheckStore()
    store.getState().setReadyCheckState({ playerResponse: 'None', state: 'InProgress', timer: 8 })

    const declined = await store.getState().decline(async () => Promise.resolve())

    expect(declined).toBe(true)
    expect(store.getState().playerResponse).toBe('Declined')
    expect(store.getState().isActive).toBe(false)
    expect(useGameflowStore.getState().phase).toBe('queue')
  })

  it('counts down the ready check timer while active', () => {
    const store = createReadyCheckStore()
    store.getState().setReadyCheckState({ playerResponse: 'None', state: 'InProgress', timer: 3 })

    store.getState().decrementTimer()
    store.getState().decrementTimer()

    expect(store.getState().timer).toBe(1)
    expect(store.getState().state).toBe('InProgress')
    expect(store.getState().isActive).toBe(true)
  })

  it('marks an expired ready check inactive without auto-accepting', () => {
    const store = createReadyCheckStore()
    store.getState().setReadyCheckState({ playerResponse: 'None', state: 'InProgress', timer: 1 })

    store.getState().decrementTimer()

    expect(store.getState().timer).toBe(0)
    expect(store.getState().state).toBe('Expired')
    expect(store.getState().playerResponse).toBe('None')
    expect(store.getState().isActive).toBe(false)
    expect(useGameflowStore.getState().phase).toBe('queue')
  })
})
