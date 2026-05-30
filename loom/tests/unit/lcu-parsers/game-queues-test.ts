import { describe, expect, test } from 'vitest'

import { parseGameQueue, parseGameQueues } from '../../../src/core/lcu/parsers/game-queues'

describe('lcu game queue parsers', () => {
  describe('parseGameQueue', () => {
    test('parses a valid queue payload', () => {
      expect(
        parseGameQueue({
          category: 'PvP',
          description: 'Ranked Solo/Duo',
          gameMode: 'CLASSIC',
          id: 420,
          mapId: 11,
          queueAvailability: 'Available',
        }),
      ).toEqual({
        category: 'PvP',
        description: 'Ranked Solo/Duo',
        gameMode: 'CLASSIC',
        id: 420,
        mapId: 11,
        queueAvailability: 'Available',
      })
    })

    test('returns null for invalid and malformed payloads', () => {
      expect(parseGameQueue(null)).toBeNull()
      expect(parseGameQueue('bad')).toBeNull()
      expect(parseGameQueue([])).toBeNull()
    })

    test('returns null when required fields are missing or malformed', () => {
      expect(
        parseGameQueue({
          category: 'PvP',
          description: 'Ranked Solo/Duo',
          gameMode: 'CLASSIC',
          id: 420,
          mapId: 11,
        }),
      ).toBeNull()

      expect(
        parseGameQueue({
          category: 'PvP',
          description: 'Ranked Solo/Duo',
          gameMode: 'CLASSIC',
          id: '420',
          mapId: 11,
          queueAvailability: 'Available',
        }),
      ).toBeNull()
    })
  })

  describe('parseGameQueues', () => {
    test('returns empty array for non-array content', () => {
      expect(parseGameQueues(null)).toEqual([])
      expect(parseGameQueues({ id: 420 })).toEqual([])
    })

    test('parses arrays and filters invalid entries', () => {
      expect(
        parseGameQueues([
          {
            category: 'PvP',
            description: 'Ranked Solo/Duo',
            gameMode: 'CLASSIC',
            id: 420,
            mapId: 11,
            queueAvailability: 'Available',
          },
          { category: 'PvP', id: 400 },
          null,
          {
            category: 'PvP',
            description: 'ARAM',
            gameMode: 'ARAM',
            id: 450,
            mapId: 12,
            queueAvailability: 'Available',
          },
        ]),
      ).toEqual([
        {
          category: 'PvP',
          description: 'Ranked Solo/Duo',
          gameMode: 'CLASSIC',
          id: 420,
          mapId: 11,
          queueAvailability: 'Available',
        },
        {
          category: 'PvP',
          description: 'ARAM',
          gameMode: 'ARAM',
          id: 450,
          mapId: 12,
          queueAvailability: 'Available',
        },
      ])
    })
  })
})
