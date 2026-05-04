/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test'

import { parseRerollPoints } from '../../../src/core/lcu/parsers/champ-select'

describe('lcu champ-select parsers', () => {
  describe('parseRerollPoints', () => {
    test('parses finite reroll point fields', () => {
      expect(
        parseRerollPoints({
          currentPoints: 125,
          maxRolls: 2,
          numberOfRolls: 1,
          pointsCostToRoll: 250,
          pointsToReroll: 125,
        }),
      ).toEqual({
        currentPoints: 125,
        maxRolls: 2,
        numberOfRolls: 1,
        pointsCostToRoll: 250,
        pointsToReroll: 125,
      })
    })

    test('sets wrong or missing fields to undefined', () => {
      expect(
        parseRerollPoints({
          currentPoints: '125',
          maxRolls: Number.NaN,
          numberOfRolls: null,
          pointsCostToRoll: Number.POSITIVE_INFINITY,
        }),
      ).toEqual({
        currentPoints: undefined,
        maxRolls: undefined,
        numberOfRolls: undefined,
        pointsCostToRoll: undefined,
        pointsToReroll: undefined,
      })
    })

    test('returns null for non-object content', () => {
      expect(parseRerollPoints(null)).toBeNull()
      expect(parseRerollPoints(undefined)).toBeNull()
      expect(parseRerollPoints('bad')).toBeNull()
    })
  })
})
