import { describe, expect, test } from 'vitest'

import { parseBannerSkins, parsePlayerRegalia } from '../../../src/core/lcu/parsers/regalia'

const tokenPath = (id: number, level: string) => {
  return `/lol-game-data/assets/ASSETS/Challenges/Config/${id}/Tokens/${level}.png`
}

describe('regalia parsers', () => {
  test('reads the banner, border level and the icon of each shown token at its current level', () => {
    expect(
      parsePlayerRegalia({
        bannerId: '10',
        crestId: '1',
        prestigeCrestBorderLevel: 475,
        topChallenges: [
          { currentLevel: 'GRANDMASTER', id: 204102, levelToIconPath: { GRANDMASTER: tokenPath(204102, 'GRANDMASTER') } },
          { currentLevel: 'NONE', id: 1, levelToIconPath: { GOLD: tokenPath(1, 'GOLD') } },
          { id: 2 },
        ],
      }),
    ).toEqual({ bannerId: '10', borderLevel: 475, tokenIconPaths: [tokenPath(204102, 'GRANDMASTER')] })
  })

  test('treats the empty strings and zeros of a player who never set them as unset', () => {
    expect(parsePlayerRegalia({ bannerId: '', crestId: '', prestigeCrestBorderLevel: 0, topChallenges: [] })).toEqual({
      bannerId: null,
      borderLevel: 0,
      tokenIconPaths: [],
    })
    expect(parsePlayerRegalia(null)).toBeNull()
  })

  test('maps only the banners of the game data catalog by id', () => {
    expect(
      parseBannerSkins([
        { assetPath: '/lol-game-data/assets/ASSETS/Regalia/BannerSkins/default.png', id: '1', regaliaType: 'kBanner' },
        { assetPath: '/lol-game-data/assets/', id: '', regaliaType: 'kNone' },
        { id: '3' },
      ]),
    ).toEqual({ '1': '/lol-game-data/assets/ASSETS/Regalia/BannerSkins/default.png' })
    expect(parseBannerSkins('bad')).toEqual({})
  })
})
