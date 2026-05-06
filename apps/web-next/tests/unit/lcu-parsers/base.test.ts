/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test'

import { readArray, readBoolean, readNumber, readObject, readString } from '../../../src/core/lcu/parsers/base'

describe('lcu base parsers', () => {
  describe('readObject', () => {
    test('returns objects and rejects arrays', () => {
      const object = { id: 1 }
      const array = ['entry']

      expect(readObject(object)).toBe(object)
      expect(readObject(array)).toBeNull()
    })

    test('returns null for null, undefined, and primitives', () => {
      expect(readObject(null)).toBeNull()
      expect(readObject(undefined)).toBeNull()
      expect(readObject('value')).toBeNull()
      expect(readObject(12)).toBeNull()
      expect(readObject(false)).toBeNull()
    })
  })

  describe('readString', () => {
    test('returns strings including empty strings', () => {
      expect(readString('Summoner')).toBe('Summoner')
      expect(readString('')).toBe('')
    })

    test('returns null for non-strings', () => {
      expect(readString(null)).toBeNull()
      expect(readString(undefined)).toBeNull()
      expect(readString(123)).toBeNull()
      expect(readString(true)).toBeNull()
    })
  })

  describe('readNumber', () => {
    test('returns finite numbers', () => {
      expect(readNumber(0)).toBe(0)
      expect(readNumber(42.5)).toBe(42.5)
      expect(readNumber(-7)).toBe(-7)
    })

    test('returns null for non-numbers and non-finite numbers', () => {
      expect(readNumber(null)).toBeNull()
      expect(readNumber(undefined)).toBeNull()
      expect(readNumber('12')).toBeNull()
      expect(readNumber(Number.NaN)).toBeNull()
      expect(readNumber(Number.POSITIVE_INFINITY)).toBeNull()
      expect(readNumber(Number.NEGATIVE_INFINITY)).toBeNull()
    })
  })

  describe('readBoolean', () => {
    test('returns booleans without coercion', () => {
      expect(readBoolean(true)).toBe(true)
      expect(readBoolean(false)).toBe(false)
      expect(readBoolean('true')).toBeNull()
      expect(readBoolean(1)).toBeNull()
      expect(readBoolean(null)).toBeNull()
      expect(readBoolean(undefined)).toBeNull()
    })
  })

  describe('readArray', () => {
    test('returns arrays including empty arrays', () => {
      const values = [1, 'two']
      const empty: unknown[] = []

      expect(readArray(values)).toBe(values)
      expect(readArray(empty)).toBe(empty)
    })

    test('returns null for non-arrays', () => {
      expect(readArray(null)).toBeNull()
      expect(readArray(undefined)).toBeNull()
      expect(readArray({ length: 0 })).toBeNull()
      expect(readArray('[]')).toBeNull()
    })
  })
})
