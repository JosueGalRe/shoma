import { describe, expect, test } from 'vitest'

import type { RegaliaBannerInventoryEntry } from './lcu-normalizers-types'
import {
  isRegaliaBannerInventoryEntry,
  normalizeChampionPickIntent,
  normalizeRegaliaInventory,
  normalizeRegionCode,
} from './lcu-normalizers'

describe('lcu normalizers', () => {
  describe('normalizeChampionPickIntent', () => {
    test('treats empty LCU pick intent sentinels as undefined', () => {
      expect(normalizeChampionPickIntent(0)).toBeUndefined()
      expect(normalizeChampionPickIntent(null)).toBeUndefined()
      expect(normalizeChampionPickIntent(undefined)).toBeUndefined()
    })

    test('keeps finite numeric champion ids', () => {
      expect(normalizeChampionPickIntent(1)).toBe(1)
      expect(normalizeChampionPickIntent(266)).toBe(266)
    })

    test('rejects malformed values', () => {
      expect(normalizeChampionPickIntent('266')).toBeUndefined()
      expect(normalizeChampionPickIntent(Number.NaN)).toBeUndefined()
      expect(normalizeChampionPickIntent(Number.POSITIVE_INFINITY)).toBeUndefined()
    })
  })

  describe('isRegaliaBannerInventoryEntry', () => {
    test('accepts objects with an items array', () => {
      expect(isRegaliaBannerInventoryEntry({ isOwned: true, items: [] })).toBe(true)
    })

    test('rejects missing or malformed items arrays', () => {
      expect(isRegaliaBannerInventoryEntry(null)).toBe(false)
      expect(isRegaliaBannerInventoryEntry({ items: 'banner' })).toBe(false)
      expect(isRegaliaBannerInventoryEntry([])).toBe(false)
    })
  })

  describe('normalizeRegaliaInventory', () => {
    const ownedBanner: RegaliaBannerInventoryEntry = { isOwned: true, items: [{ id: 'banner-1' }] }
    const unownedBanner: RegaliaBannerInventoryEntry = { isOwned: false, items: [{ id: 'banner-2' }] }

    test('filters valid entries from array responses', () => {
      expect(normalizeRegaliaInventory([ownedBanner, { items: 'bad' }, null, unownedBanner])).toEqual([
        ownedBanner,
        unownedBanner,
      ])
    })

    test('normalizes object responses into filtered arrays', () => {
      expect(
        normalizeRegaliaInventory({
          'banner-1': ownedBanner,
          'banner-2': { items: 'bad' },
          'banner-3': unownedBanner,
        }),
      ).toEqual([ownedBanner, unownedBanner])
    })

    test('returns an empty array for unsupported response shapes', () => {
      expect(normalizeRegaliaInventory(null)).toEqual([])
      expect(normalizeRegaliaInventory('bad')).toEqual([])
      expect(normalizeRegaliaInventory(1)).toEqual([])
    })
  })

  describe('normalizeRegionCode', () => {
    test('maps common Riot platform ids to normalized region codes', () => {
      expect(normalizeRegionCode('EUW1')).toBe('EUW')
      expect(normalizeRegionCode('NA1')).toBe('NA')
      expect(normalizeRegionCode('LA1')).toBe('LAN')
      expect(normalizeRegionCode('LA2')).toBe('LAS')
      expect(normalizeRegionCode('OC1')).toBe('OCE')
      expect(normalizeRegionCode('SG2')).toBe('SG')
    })

    test('normalizes Chinese Tencent platform ids', () => {
      expect(normalizeRegionCode('HN1')).toBe('TENCENT_HN1')
      expect(normalizeRegionCode('hn10')).toBe('TENCENT_HN10')
      expect(normalizeRegionCode('TENCENT_NJ100')).toBe('TENCENT_NJ100')
    })

    test('uppercases unknown platform ids without inventing mappings', () => {
      expect(normalizeRegionCode(' custom1 ')).toBe('CUSTOM1')
    })
  })
})
