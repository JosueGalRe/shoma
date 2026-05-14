
import { describe, expect, test } from 'bun:test'
import * as v from 'valibot'

import { finiteNumber, parseOrNull, unknownArray, unknownRecord } from '../../../src/core/lcu/parsers/base'

describe('lcu base Valibot helpers', () => {
  describe('unknownRecord', () => {
    test('parses objects and rejects arrays', () => {
      const object = { id: 1 }

      expect(parseOrNull(unknownRecord, object)).toEqual(object)
      expect(parseOrNull(unknownRecord, ['entry'])).toBeNull()
    })

    test('returns null for null, undefined, and primitives', () => {
      expect(parseOrNull(unknownRecord, null)).toBeNull()
      expect(parseOrNull(unknownRecord, undefined)).toBeNull()
      expect(parseOrNull(unknownRecord, 'value')).toBeNull()
      expect(parseOrNull(unknownRecord, 12)).toBeNull()
      expect(parseOrNull(unknownRecord, false)).toBeNull()
    })
  })

  describe('primitive schemas', () => {
    test('parses strings including empty strings', () => {
      expect(parseOrNull(v.string(), 'Summoner')).toBe('Summoner')
      expect(parseOrNull(v.string(), '')).toBe('')
    })

    test('parses only finite numbers', () => {
      expect(parseOrNull(finiteNumber, 0)).toBe(0)
      expect(parseOrNull(finiteNumber, 42.5)).toBe(42.5)
      expect(parseOrNull(finiteNumber, -7)).toBe(-7)
      expect(parseOrNull(finiteNumber, '12')).toBeNull()
      expect(parseOrNull(finiteNumber, Number.NaN)).toBeNull()
      expect(parseOrNull(finiteNumber, Number.POSITIVE_INFINITY)).toBeNull()
    })

    test('parses booleans without coercion', () => {
      expect(parseOrNull(v.boolean(), true)).toBe(true)
      expect(parseOrNull(v.boolean(), false)).toBe(false)
      expect(parseOrNull(v.boolean(), 'true')).toBeNull()
      expect(parseOrNull(v.boolean(), 1)).toBeNull()
    })
  })

  describe('unknownArray', () => {
    test('parses arrays including empty arrays', () => {
      const values = [1, 'two']
      const empty: unknown[] = []

      expect(parseOrNull(unknownArray, values)).toEqual(values)
      expect(parseOrNull(unknownArray, empty)).toEqual(empty)
    })

    test('returns null for non-arrays', () => {
      expect(parseOrNull(unknownArray, null)).toBeNull()
      expect(parseOrNull(unknownArray, undefined)).toBeNull()
      expect(parseOrNull(unknownArray, { length: 0 })).toBeNull()
      expect(parseOrNull(unknownArray, '[]')).toBeNull()
    })
  })
})
