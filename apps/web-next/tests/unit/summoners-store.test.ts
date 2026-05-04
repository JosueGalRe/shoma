/// <reference types="bun" />

import { describe, expect, it } from 'bun:test'

import { createSummonersStore, type SummonerSpell } from '../../src/features/champ-select/summoners-store'

const spells: SummonerSpell[] = [
  { gameModes: ['CLASSIC', 'ARAM'], id: 4, name: 'Flash' },
  { gameModes: ['CLASSIC'], id: 7, name: 'Heal' },
  { gameModes: ['CLASSIC'], id: 11, name: 'Smite' },
  { gameModes: ['ARAM'], id: 32, name: 'Mark' },
]

describe('summoners store', () => {
  it('filters spells by game mode and role-locks smite to jungle', () => {
    const store = createSummonersStore()

    store.getState().setRole('middle')
    store.getState().setSummonerData({ gameMode: 'CLASSIC', selectedSpell1: 4, selectedSpell2: 7, spells })

    expect(store.getState().availableSpells.map((spell) => spell.id)).toEqual([4, 7])
    expect(store.getState().validateSpell(11)).toBe(false)
    expect(store.getState().error?.message).toBe('Smite is only available to jungle.')

    store.getState().setRole('jungle')

    expect(store.getState().availableSpells.map((spell) => spell.id)).toEqual([4, 7, 11])
    expect(store.getState().validateSpell(11)).toBe(true)
  })

  it('selects smite and flash for jungle and patches both slots', async () => {
    const store = createSummonersStore()
    const patchedBodies: unknown[] = []

    store.getState().setRole('jungle')
    store.getState().setSummonerData({ gameMode: 'CLASSIC', selectedSpell1: 4, selectedSpell2: 7, spells })

    const selectedSmite = await store.getState().selectSpell1(11, async (body) => {
      patchedBodies.push(body)
    })
    const selectedFlash = await store.getState().selectSpell2(4, async (body) => {
      patchedBodies.push(body)
    })

    expect(selectedSmite).toBe(true)
    expect(selectedFlash).toBe(true)
    expect(patchedBodies).toEqual([{ spell1Id: 11, spell2Id: 7 }, { spell1Id: 11, spell2Id: 4 }])
    expect(store.getState().selectedSpell1).toBe(11)
    expect(store.getState().selectedSpell2).toBe(4)
  })

  it('prevents unavailable spell selection before request', async () => {
    const store = createSummonersStore()
    let requestCount = 0

    store.getState().setRole('bottom')
    store.getState().setSummonerData({ gameMode: 'CLASSIC', selectedSpell1: 4, selectedSpell2: 7, spells })

    const selected = await store.getState().selectSpell1(11, async () => {
      requestCount += 1
    })

    expect(selected).toBe(false)
    expect(requestCount).toBe(0)
    expect(store.getState().selectedSpell1).toBe(4)
    expect(store.getState().selectedSpell2).toBe(7)
  })
})
