/// <reference types="bun" />

import { describe, expect, it } from 'bun:test'

import { createRunesStore, type RunePage, type RuneStyle } from '../../src/features/champ-select/runes-store'

const styles: RuneStyle[] = [
  {
    id: 8000,
    name: 'Precision',
    slots: [
      { perks: [{ id: 8005, name: 'Press the Attack' }, { id: 8008, name: 'Lethal Tempo' }] },
      { perks: [{ id: 9101, name: 'Overheal' }, { id: 9111, name: 'Triumph' }] },
      { perks: [{ id: 9104, name: 'Legend: Alacrity' }, { id: 9105, name: 'Legend: Haste' }] },
      { perks: [{ id: 8014, name: 'Coup de Grace' }, { id: 8299, name: 'Last Stand' }] },
    ],
  },
  {
    id: 8100,
    name: 'Domination',
    slots: [
      { perks: [{ id: 8112, name: 'Electrocute' }] },
      { perks: [{ id: 8126, name: 'Cheap Shot' }, { id: 8139, name: 'Taste of Blood' }] },
      { perks: [{ id: 8136, name: 'Zombie Ward' }, { id: 8120, name: 'Ghost Poro' }] },
      { perks: [{ id: 8135, name: 'Treasure Hunter' }] },
    ],
  },
]

function page(overrides: Partial<RunePage> = {}): RunePage {
  return {
    championIds: [],
    current: false,
    id: 1,
    isActive: false,
    isEditable: true,
    name: 'Precision preset',
    order: 1,
    primaryStyleId: 8000,
    selectedPerkIds: [8005, 9101, 9104, 8014, 8126, 8136],
    subStyleId: 8100,
    ...overrides,
  }
}

describe('runes store', () => {
  it('selects one of three presets and updates current page', async () => {
    const store = createRunesStore()
    const selectedIds: number[] = []

    store.getState().setRuneData({
      pages: [page({ id: 1, name: 'Preset 1' }), page({ id: 2, name: 'Preset 2', order: 2 }), page({ id: 3, name: 'Preset 3', order: 3 })],
      styles,
    })

    const selected = await store.getState().selectPreset(1, async (pageId) => {
      selectedIds.push(pageId)
    })

    expect(selected).toBe(true)
    expect(selectedIds).toEqual([2])
    expect(store.getState().currentPage?.id).toBe(2)
    expect(store.getState().selectedPreset).toBe(1)
    expect(store.getState().presets.map((preset) => preset.isActive)).toEqual([false, true, false])
  })

  it('edits and saves an editable rune page', async () => {
    const store = createRunesStore()
    const savedPages: RunePage[] = []
    const edited = page({ id: 4, name: 'Editable preset' })

    store.getState().setRuneData({ currentPage: edited, pages: [edited], styles })

    expect(store.getState().editRunePage({ ...edited, selectedPerkIds: [8008, 9101, 9104, 8014, 8126, 8136] })).toBe(true)
    expect(store.getState().isEditing).toBe(true)

    const saved = await store.getState().saveRunePage(async (savedPage) => {
      savedPages.push(savedPage)
    })

    expect(saved).toBe(true)
    expect(savedPages[0]?.selectedPerkIds[0]).toBe(8008)
    expect(store.getState().isEditing).toBe(false)
    expect(store.getState().error).toBeNull()
  })

  it('prevents invalid rune combinations before selection or save', async () => {
    const store = createRunesStore()
    const invalid = page({ id: 9, selectedPerkIds: [8005, 8008, 9104, 8014, 8126, 8136] })
    let requestCount = 0

    store.getState().setRuneData({ pages: [invalid], styles })

    const selected = await store.getState().selectPreset(0, async () => {
      requestCount += 1
    })

    expect(selected).toBe(false)
    expect(requestCount).toBe(0)
    expect(store.getState().validation.isValid).toBe(false)
    expect(store.getState().error?.message).toBe('Only one primary rune can be selected per slot.')
  })

  it('auto-selects a champion-specific preset', async () => {
    const store = createRunesStore()
    const selectedIds: number[] = []

    store.getState().setRuneData({
      pages: [page({ id: 1, championIds: [11], order: 1 }), page({ id: 2, championIds: [22], order: 2 }), page({ id: 3, championIds: [33], order: 3 })],
      styles,
    })

    const autoSelected = await store.getState().autoSelectForChampion(22, async (pageId) => {
      selectedIds.push(pageId)
    })

    expect(autoSelected).toBe(true)
    expect(selectedIds).toEqual([2])
    expect(store.getState().selectedPreset).toBe(1)
  })
})
