/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test'

import { parsePerkPage, parsePerkPages } from '../../../src/core/lcu/parsers/perks'

describe('lcu perks parsers', () => {
  describe('parsePerkPage', () => {
    test('parses a valid perk page payload', () => {
      expect(
        parsePerkPage({
          id: 1,
          isActive: true,
          isEditable: false,
          name: 'Precision page',
          order: 0,
          primaryStyleId: 8000,
          selectedPerkIds: [8005, 9111, 9104, 8014, 8304, 8347],
          subStyleId: 8300,
        }),
      ).toEqual({
        id: 1,
        isActive: true,
        isEditable: false,
        name: 'Precision page',
        order: 0,
        primaryStyleId: 8000,
        selectedPerkIds: [8005, 9111, 9104, 8014, 8304, 8347],
        subStyleId: 8300,
      })
    })

    test('returns null for invalid and malformed payloads', () => {
      expect(parsePerkPage(null)).toBeNull()
      expect(parsePerkPage('bad')).toBeNull()
      expect(parsePerkPage([])).toBeNull()
    })

    test('returns null when required fields are missing or malformed', () => {
      expect(
        parsePerkPage({
          id: 1,
          isActive: true,
          isEditable: false,
          name: 'Precision page',
          order: 0,
          primaryStyleId: 8000,
          subStyleId: 8300,
        }),
      ).toBeNull()
      expect(
        parsePerkPage({
          id: 1,
          isActive: true,
          isEditable: false,
          name: 'Precision page',
          order: 0,
          primaryStyleId: 8000,
          selectedPerkIds: [8005, 'bad'],
          subStyleId: 8300,
        }),
      ).toBeNull()
    })
  })

  describe('parsePerkPages', () => {
    test('returns empty array for non-array content', () => {
      expect(parsePerkPages(null)).toEqual([])
      expect(parsePerkPages({ id: 1 })).toEqual([])
    })

    test('parses arrays and filters invalid entries', () => {
      expect(
        parsePerkPages([
          {
            id: 1,
            isActive: true,
            isEditable: false,
            name: 'Precision page',
            order: 0,
            primaryStyleId: 8000,
            selectedPerkIds: [8005, 9111],
            subStyleId: 8300,
          },
          { id: 2, name: 'Missing fields' },
          null,
          {
            id: 3,
            isActive: false,
            isEditable: true,
            name: 'Sorcery page',
            order: 1,
            primaryStyleId: 8200,
            selectedPerkIds: [],
            subStyleId: 8400,
          },
        ]),
      ).toEqual([
        {
          id: 1,
          isActive: true,
          isEditable: false,
          name: 'Precision page',
          order: 0,
          primaryStyleId: 8000,
          selectedPerkIds: [8005, 9111],
          subStyleId: 8300,
        },
        {
          id: 3,
          isActive: false,
          isEditable: true,
          name: 'Sorcery page',
          order: 1,
          primaryStyleId: 8200,
          selectedPerkIds: [],
          subStyleId: 8400,
        },
      ])
    })
  })
})
