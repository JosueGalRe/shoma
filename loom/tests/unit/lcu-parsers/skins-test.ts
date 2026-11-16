import { describe, expect, test } from 'vitest'

import {
  findSkinOf,
  isSkinOwned,
  parseChampionSkins,
  parseSkinInventory,
  parseSkinItem,
} from '../../../src/core/lcu/parsers/skins'

describe('lcu skin inventory parsers', () => {
  describe('parseSkinItem', () => {
    test('parses a valid skin payload', () => {
      expect(
        parseSkinItem({
          championId: 1,
          id: 1000,
          name: 'Annie',
          ownership: { owned: true },
        }),
      ).toEqual({
        championId: 1,
        id: 1000,
        name: 'Annie',
        ownership: { owned: true },
      })
    })

    test('returns null for invalid and malformed payloads', () => {
      expect(parseSkinItem(null)).toBeNull()
      expect(parseSkinItem('bad')).toBeNull()
      expect(parseSkinItem([])).toBeNull()
    })

    test('returns null when required fields are missing or malformed', () => {
      expect(
        parseSkinItem({
          championId: 1,
          id: 1000,
          name: 'Annie',
        }),
      ).toBeNull()

      expect(
        parseSkinItem({
          championId: 1,
          id: 1000,
          name: 'Annie',
          ownership: { owned: 'true' },
        }),
      ).toBeNull()
    })
  })

  describe('parseSkinInventory', () => {
    test('returns empty array for non-array content', () => {
      expect(parseSkinInventory(null)).toEqual([])
      expect(parseSkinInventory({ id: 1000 })).toEqual([])
    })

    test('parses arrays and filters invalid entries', () => {
      expect(
        parseSkinInventory([
          {
            championId: 1,
            id: 1000,
            name: 'Annie',
            ownership: { owned: true },
          },
          { championId: 2, id: 2000, name: 'Olaf' },
          null,
          {
            championId: 3,
            id: 3000,
            name: 'Galio',
            ownership: { owned: false },
          },
        ]),
      ).toEqual([
        {
          championId: 1,
          id: 1000,
          name: 'Annie',
          ownership: { owned: true },
        },
        {
          championId: 3,
          id: 3000,
          name: 'Galio',
          ownership: { owned: false },
        },
      ])
    })
  })

  describe('parseChampionSkins', () => {
    test('keeps every skin but the disabled and nameless ones, and tells the owned ones', () => {
      const skins = parseChampionSkins([
        { id: 1000, isBase: true, name: 'Annie', ownership: { owned: false } },
        { id: 1001, name: 'Goth Annie', ownership: { owned: true } },
        { id: 1002, name: 'Red Riding Annie', ownership: { owned: false } },
        { disabled: true, id: 1003, name: 'Annie in Wonderland', ownership: { owned: false } },
        { id: 1004, name: '', ownership: { owned: false } },
      ])

      expect(
        skins.map((skin) => {
          return [skin.id, isSkinOwned(skin)]
        }),
      ).toEqual([
        [1000, true],
        [1001, true],
        [1002, false],
      ])
    })
  })

  describe('chromas', () => {
    test('keeps the enabled chromas with their swatch colors, and finds the skin of a picked one', () => {
      const chroma = { colors: ['#2E38C4', '#C8003F'], id: 103052, name: 'Dynasty Ahri (Pearl)', ownership: { owned: true } }
      const skins = parseChampionSkins([
        {
          chromas: [
            chroma,
            { ...chroma, colors: ['red'], id: 103053 },
            { ...chroma, disabled: true, id: 103054 },
          ],
          id: 103001,
          name: 'Dynasty Ahri',
          ownership: { owned: true },
        },
      ])

      expect(skins[0]?.chromas).toMatchObject([
        { colors: ['#2E38C4', '#C8003F'], id: 103052 },
        { colors: [], id: 103053 },
      ])
      expect(findSkinOf(skins, 103052)?.id).toBe(103001)
      expect(findSkinOf(skins, 103001)?.id).toBe(103001)
      expect(findSkinOf(skins, 1)).toBeUndefined()
    })
  })
})
