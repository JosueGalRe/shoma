/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test'

import { parseChampSelectSession, parseRerollPoints } from '../../../src/core/lcu/parsers/champ-select'

describe('lcu champ-select parsers', () => {
  describe('parseChampSelectSession', () => {
    test('parses a valid session shape', () => {
      expect(
        parseChampSelectSession({
          actions: [
            [
              {
                actorCellId: 1,
                championId: 266,
                completed: false,
                id: 7,
                isAllyAction: true,
                type: 'pick',
              },
            ],
          ],
          benchChampionIds: [22, 103],
          benchEnabled: true,
          gameMode: 'ARAM',
          localPlayerCellId: 1,
          myTeam: [{ cellId: 1, championId: 266, displayName: 'Player One' }],
          theirTeam: [{ cellId: 6, championId: 103 }],
          timer: { adjustedTimeLeftInPhase: 30000, phase: 'PLANNING' },
        }),
      ).toEqual({
        actions: [
          [
            {
              actorCellId: 1,
              championId: 266,
              completed: false,
              id: 7,
              isAllyAction: true,
              isInProgress: undefined,
              type: 'pick',
            },
          ],
        ],
        benchChampionIds: [22, 103],
        benchEnabled: true,
        gameMode: 'ARAM',
        localPlayerCellId: 1,
        mapId: undefined,
        myTeam: [
          {
            assignedPosition: undefined,
            cellId: 1,
            championId: 266,
            championPickIntent: undefined,
            displayName: 'Player One',
            selectedSkinId: undefined,
            spell1Id: undefined,
            spell2Id: undefined,
            summonerId: undefined,
            team: undefined,
          },
        ],
        queueId: undefined,
        theirTeam: [
          {
            assignedPosition: undefined,
            cellId: 6,
            championId: 103,
            championPickIntent: undefined,
            displayName: undefined,
            selectedSkinId: undefined,
            spell1Id: undefined,
            spell2Id: undefined,
            summonerId: undefined,
            team: undefined,
          },
        ],
        timer: {
          adjustedTimeLeftInPhase: 30000,
          internalNowInEpochMs: undefined,
          isInfinite: undefined,
          phase: 'PLANNING',
          totalTimeInPhase: undefined,
        },
      })
    })

    test('returns null when required fields are missing or malformed', () => {
      expect(parseChampSelectSession({ actions: [], myTeam: [], theirTeam: [] })).toBeNull()
      expect(parseChampSelectSession({ actions: {}, myTeam: [], theirTeam: [], timer: {} })).toBeNull()
      expect(parseChampSelectSession({ actions: [], myTeam: {}, theirTeam: [], timer: {} })).toBeNull()
      expect(parseChampSelectSession({ actions: [], myTeam: [], theirTeam: {}, timer: {} })).toBeNull()
    })
  })

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
      expect(parseRerollPoints([])).toBeNull()
    })
  })
})
