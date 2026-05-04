/// <reference types="bun" />

import { beforeEach, describe, expect, it } from 'bun:test'

import { createAramStore } from '../../src/features/champ-select/aram-store'

describe('aram store', () => {
  beforeEach(() => {})

  it('uses a reroll card and decrements count', async () => {
    const store = createAramStore()
    store.getState().setCards(2)

    const used = await store.getState().useRerollCard(async () => {})

    expect(used).toBe(true)
    expect(store.getState().cards).toBe(1)
    expect(store.getState().rerollsRemaining).toBe(1)
    expect(store.getState().error).toBeNull()
  })

  it('selects a champion from the bench', async () => {
    const store = createAramStore()
    store.getState().setBenchChampionIds([10, 20, 30])

    const selected = await store.getState().selectFromBench(20, async (championId) => {
      expect(championId).toBe(20)
    })

    expect(selected).toBe(true)
    expect(store.getState().selectedCard).toBe(20)
    expect(store.getState().error).toBeNull()
  })

  it('prevents reroll when no cards remain', async () => {
    const store = createAramStore()
    store.getState().setCards(0)

    const used = await store.getState().useRerollCard(async () => {
      throw new Error('should not be called')
    })

    expect(used).toBe(false)
    expect(store.getState().error?.message).toBe('No champion cards remaining.')
  })

  it('updates bench when a teammate rerolls', () => {
    const store = createAramStore()
    store.getState().setBenchChampionIds([5, 10])

    store.getState().setBenchChampionIds([5, 10, 15])

    expect(store.getState().benchChampionIds).toEqual([5, 10, 15])
  })

  it('preserves card count on failed reroll request', async () => {
    const store = createAramStore()
    store.getState().setCards(1)

    const used = await store.getState().useRerollCard(async () => {
      throw new Error('network error')
    })

    expect(used).toBe(false)
    expect(store.getState().cards).toBe(1)
    expect(store.getState().rerollsRemaining).toBe(1)
    expect(store.getState().error?.message).toBe('network error')
  })

  it('preserves selected card on failed bench swap', async () => {
    const store = createAramStore()
    store.getState().setBenchChampionIds([10, 20])
    store.getState().setSelectedCard(10)

    const selected = await store.getState().selectFromBench(20, async () => {
      throw new Error('swap failed')
    })

    expect(selected).toBe(false)
    expect(store.getState().selectedCard).toBe(10)
    expect(store.getState().error?.message).toBe('swap failed')
  })

  it('sets cards and rerollsRemaining together', () => {
    const store = createAramStore()

    store.getState().setCards(3)

    expect(store.getState().cards).toBe(3)
    expect(store.getState().rerollsRemaining).toBe(3)
  })

  it('resets error when setting cards', () => {
    const store = createAramStore()
    store.getState().setError(new Error('previous error'))

    store.getState().setCards(2)

    expect(store.getState().error).toBeNull()
  })
})
