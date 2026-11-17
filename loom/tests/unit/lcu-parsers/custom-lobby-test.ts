import { describe, expect, test } from 'vitest'

import { parseAvailableBots, parseCustomLobby, parseRecommendedPositions } from '../../../src/core/lcu/parsers/custom-lobby'

describe('custom lobby parser', () => {
  test('reads a custom game: its name, pick, size and both teams with players and bots', () => {
    expect(
      parseCustomLobby({
        gameConfig: {
          customLobbyName: "Bryan's Game",
          customMutatorName: 'GAME_CFG_PICK_BLIND',
          customTeam100: [
            { firstPositionPreference: 'MIDDLE', isBot: false, summonerId: 7, summonerName: 'Bryan' },
            { botChampionId: 16, botPosition: 'UTILITY', isBot: true },
            { isBot: false },
          ],
          customTeam200: [{ botChampionId: 1, isBot: true }],
          gameMode: 'CLASSIC',
          isCustom: true,
          mapId: 11,
          maxTeamSize: 3,
        },
      }),
    ).toEqual({
      gameMode: 'CLASSIC',
      mapId: 11,
      mutatorName: 'GAME_CFG_PICK_BLIND',
      name: "Bryan's Game",
      teamSize: 3,
      teams: [
        [
          { botChampionId: null, name: 'Bryan', position: 'MIDDLE', summonerId: 7 },
          { botChampionId: 16, name: 'Unknown summoner', position: 'UTILITY', summonerId: null },
        ],
        [{ botChampionId: 1, name: 'Unknown summoner', position: 'UNSELECTED', summonerId: null }],
      ],
    })
  })

  test('is null for a lobby that is not a custom game, or no lobby', () => {
    expect(parseCustomLobby({ gameConfig: { gameMode: 'CLASSIC', isCustom: false } })).toBeNull()
    expect(parseCustomLobby(null)).toBeNull()
  })

  test('defaults a sparse custom game to 5v5 with empty teams', () => {
    expect(parseCustomLobby({ gameConfig: { customMutatorName: '', isCustom: true } })).toEqual({
      gameMode: '',
      mapId: null,
      mutatorName: null,
      name: '',
      teamSize: 5,
      teams: [[], []],
    })
  })

  test('reads the available bots and their lanes', () => {
    expect(parseAvailableBots([{ botDifficulties: ['RSINTERMEDIATE'], id: 1 }, { id: 22 }, { name: 'no id' }, 3])).toEqual([
      { difficulties: ['RSINTERMEDIATE'], id: 1 },
      { difficulties: [], id: 22 },
    ])
    expect(parseAvailableBots(null)).toEqual([])
    expect(parseRecommendedPositions({ 1: { recommendedPositions: ['MIDDLE', 'NOPE'] }, 22: {} })).toEqual({
      1: ['MIDDLE', 'UNSELECTED'],
      22: [],
    })
  })
})
