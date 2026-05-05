/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test'

import { parseSkinInventory, parseSkinItem } from '../../../src/core/lcu/parsers/skins'

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
})
