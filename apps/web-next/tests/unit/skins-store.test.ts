/// <reference types="bun" />

import { describe, expect, it } from 'bun:test'

import { createSkinsStore, type ChampionSkin } from '../../src/features/champ-select/skins-store'

const skins: ChampionSkin[] = [
  { championId: 22, id: 22_000, isBase: true, name: 'Default', ownership: { owned: true } },
  { championId: 22, id: 22_001, name: 'Freljord Ashe', ownership: { owned: true } },
  { championId: 22, id: 22_002, name: 'Sherwood Forest Ashe', ownership: { owned: false } },
  { championId: 99, id: 99_001, name: 'Annie-Versary', ownership: { owned: true } },
]

describe('skins store', () => {
  it('shows only owned skins for the current champion and keeps default available', () => {
    const store = createSkinsStore()

    store.getState().setSkinData({ skins })
    store.getState().setChampion(22)

    expect(store.getState().ownedSkins.map((skin) => skin.id)).toEqual([22_000, 22_001])
    expect(store.getState().selectedSkin).toBe(22_000)
  })

  it('adds a default skin option when inventory omits base skin', () => {
    const store = createSkinsStore()

    store.getState().setSkinData({ skins: [{ championId: 99, id: 99_001, name: 'Annie-Versary', ownership: { owned: true } }] })
    store.getState().setChampion(99)

    expect(store.getState().ownedSkins.map((skin) => skin.id)).toEqual([99_000, 99_001])
    expect(store.getState().ownedSkins[0]?.name).toBe('Default')
  })

  it('selects an owned skin and patches champ-select selection', async () => {
    const store = createSkinsStore()
    const patchedBodies: unknown[] = []

    store.getState().setSkinData({ skins })
    store.getState().setChampion(22)

    const selected = await store.getState().selectSkin(22_001, async (body) => {
      patchedBodies.push(body)
    })

    expect(selected).toBe(true)
    expect(patchedBodies).toEqual([{ selectedSkinId: 22_001 }])
    expect(store.getState().selectedSkin).toBe(22_001)
  })

  it('clears unavailable selected skin when champion changes', () => {
    const store = createSkinsStore()

    store.getState().setSkinData({ selectedSkin: 22_001, skins })
    store.getState().setChampion(22)
    expect(store.getState().selectedSkin).toBe(22_001)

    store.getState().setChampion(99)

    expect(store.getState().ownedSkins.map((skin) => skin.id)).toEqual([99_000, 99_001])
    expect(store.getState().selectedSkin).toBe(99_000)
  })

  it('prevents unowned skin selection before request', async () => {
    const store = createSkinsStore()
    let requestCount = 0

    store.getState().setSkinData({ skins })
    store.getState().setChampion(22)

    const selected = await store.getState().selectSkin(22_002, async () => {
      requestCount += 1
    })

    expect(selected).toBe(false)
    expect(requestCount).toBe(0)
    expect(store.getState().error?.message).toBe('Skin is unavailable for the selected champion.')
  })
})
