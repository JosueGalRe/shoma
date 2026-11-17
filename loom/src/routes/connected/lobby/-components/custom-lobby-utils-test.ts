import { describe, expect, test } from 'vitest'

import { getCustomGameTypeKey, pickCustomBot } from './custom-lobby-utils'

import type { CustomLobbySeat } from '@/core/lcu/parsers/custom-lobby'

const bot = (botChampionId: number, position: CustomLobbySeat['position']): CustomLobbySeat => {
  return { botChampionId, name: '', position, summonerId: null }
}

const bots = [
  { difficulties: ['RSBEGINNER', 'RSINTERMEDIATE'], id: 1 },
  { difficulties: ['RSBEGINNER'], id: 22 },
  { difficulties: [], id: 86 },
]
const positions = { 1: ['MIDDLE' as const], 22: ['BOTTOM' as const], 86: ['TOP' as const] }

describe('pickCustomBot', () => {
  test('takes a champion for a lane no bot of the team plays, at intermediate difficulty', () => {
    expect(
      pickCustomBot({ bots, positions, team: [bot(22, 'BOTTOM'), bot(86, 'TOP')] }, () => {
        return 0
      }),
    ).toEqual({
      championId: 1,
      difficulty: 'RSINTERMEDIATE',
      position: 'MIDDLE',
    })
  })

  test('falls back to the first difficulty, or NONE', () => {
    expect(
      pickCustomBot({ bots, positions, team: [bot(1, 'MIDDLE'), bot(86, 'TOP')] }, () => {
        return 0
      })?.difficulty,
    ).toBe('RSBEGINNER')

    expect(
      pickCustomBot({ bots, positions, team: [bot(1, 'MIDDLE'), bot(22, 'BOTTOM')] }, () => {
        return 0
      })?.difficulty,
    ).toBe('NONE')
  })

  test('keeps a champion off the team twice and gives up when none is left', () => {
    expect(pickCustomBot({ bots, positions, team: [bot(1, 'TOP'), bot(22, 'JUNGLE'), bot(86, 'MIDDLE')] })).toBeNull()
  })

  test('a champion without lanes plays TOP', () => {
    expect(pickCustomBot({ bots: [{ difficulties: [], id: 7 }], positions: {}, team: [] })?.position).toBe('TOP')
  })
})

describe('getCustomGameTypeKey', () => {
  test('names the client pick strategies, and nothing else', () => {
    expect(getCustomGameTypeKey('GAME_CFG_PICK_BLIND')).toBe('createLobby.gameTypes.blind')
    expect(getCustomGameTypeKey('GAME_CFG_SOMETHING')).toBeUndefined()
    expect(getCustomGameTypeKey(null)).toBeUndefined()
  })
})
