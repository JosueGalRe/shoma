import { describe, expect, test } from 'vitest'

import {
  getSecondaryRows,
  isRunePageDraftComplete,
  pickSecondaryPerk,
  setPrimaryStyle,
  setSubStyle,
  toRunePageDraft,
  toSelectedPerkIds,
} from './rune-page-draft'

import type { PerkStyle } from '@/core/lcu/parsers/perks'

const SHARDS = [
  { perks: [5008, 5005, 5007], type: 'kStatMod' },
  { perks: [5008, 5010, 5001], type: 'kStatMod' },
  { perks: [5011, 5013, 5001], type: 'kStatMod' },
]

// The first allowed sub path is the default one
function style(id: number, rows: number[][], allowedSubStyles: number[]): PerkStyle {
  return {
    allowedSubStyles,
    defaultSubStyle: allowedSubStyles[0] ?? 0,
    iconPath: '',
    id,
    name: String(id),
    slots: [
      { perks: rows[0] ?? [], type: 'kKeyStone' },
      ...rows.slice(1).map((perks) => {
        return { perks, type: 'kMixedRegularSplashable' }
      }),
      ...SHARDS,
    ],
  }
}

const PRECISION = style(
  8000,
  [
    [8005, 8008, 8021, 8010],
    [9101, 9111, 8009],
    [9104, 9105, 9103],
    [8014, 8017, 8299],
  ],
  [8100, 8200, 8300, 8400],
)
const DOMINATION = style(
  8100,
  [
    [8112, 8128, 9923],
    [8126, 8139, 8143],
    [8137, 8140, 8141],
    [8135, 8105, 8106],
  ],
  [8000, 8200, 8300, 8400],
)
const SORCERY = style(
  8200,
  [
    [8214, 8229, 8230],
    [8224, 8226, 8275],
    [8210, 8234, 8233],
    [8237, 8232, 8236],
  ],
  [8000, 8100, 8300, 8400],
)
const STYLES = [PRECISION, DOMINATION, SORCERY]

// Fleet Footwork, Triumph, Legend: Alacrity, Coup de Grace | Taste of Blood, Treasure Hunter | shards
const PAGE = {
  primaryStyleId: 8000,
  selectedPerkIds: [8021, 9111, 9104, 8014, 8139, 8135, 5008, 5008, 5001],
  subStyleId: 8100,
}

describe('rune page draft', () => {
  test('reads a page into its rows and back in the same order', () => {
    const draft = toRunePageDraft(PAGE, STYLES)

    expect(draft).toEqual({
      primary: [8021, 9111, 9104, 8014],
      primaryStyleId: 8000,
      secondary: [8139, 8135],
      shards: [5008, 5008, 5001],
      subStyleId: 8100,
    })

    expect(isRunePageDraftComplete(draft)).toBe(true)
    expect(toSelectedPerkIds(draft, getSecondaryRows(DOMINATION))).toEqual(PAGE.selectedPerkIds)
  })

  test('a secondary pick replaces its row, and a third row drops the oldest pick', () => {
    const rows = getSecondaryRows(DOMINATION)
    const draft = toRunePageDraft(PAGE, STYLES)
    const sameRow = pickSecondaryPerk(draft, rows, 8143)

    expect(sameRow.secondary).toEqual([8135, 8143])

    const thirdRow = pickSecondaryPerk(sameRow, rows, 8140)

    expect(thirdRow.secondary).toEqual([8143, 8140])
    expect(toSelectedPerkIds(thirdRow, rows).slice(4, 6)).toEqual([8143, 8140])
  })

  test('a new primary path clears its rows and keeps the shards', () => {
    const draft = setPrimaryStyle(toRunePageDraft(PAGE, STYLES), 8200, STYLES)

    expect(draft.primary).toEqual([0, 0, 0, 0])
    expect(draft.secondary).toEqual([8139, 8135])
    expect(draft.shards).toEqual([5008, 5008, 5001])
    expect(isRunePageDraftComplete(draft)).toBe(false)
  })

  test('taking the sub path as primary moves the sub path to the default one', () => {
    const draft = setPrimaryStyle(toRunePageDraft(PAGE, STYLES), 8100, STYLES)

    expect(draft.subStyleId).toBe(8000)
    expect(draft.secondary).toEqual([])
  })

  test('a new sub path clears its picks', () => {
    expect(setSubStyle(toRunePageDraft(PAGE, STYLES), 8200).secondary).toEqual([])
  })
})
