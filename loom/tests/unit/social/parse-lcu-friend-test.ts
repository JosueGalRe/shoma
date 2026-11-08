import { describe, expect, test } from 'vitest'

import { parseLcuFriend } from '../../../src/core/lcu/queries/social'

describe('parseLcuFriend presence', () => {
  test('reads queue and map ids from the string-valued chat presence map', () => {
    const friend = parseLcuFriend({
      availability: 'dnd',
      gameName: 'Jade',
      gameTag: 'LAN',
      id: 'jade@pvp.net',
      lol: { gameMode: 'CLASSIC', gameStatus: 'inGame', mapId: '11', queueId: '420' },
      summonerId: 7,
    })

    expect(friend).toEqual(
      expect.objectContaining({ activity: 'in-game', gameMode: 'CLASSIC', mapId: 11, queueId: 420 }),
    )
  })

  test('ignores empty or non-numeric presence ids', () => {
    const friend = parseLcuFriend({
      id: 'jade@pvp.net',
      lol: { gameStatus: 'outOfGame', mapId: '', queueId: 'abc' },
      summonerId: 7,
    })

    expect(friend).toEqual(expect.objectContaining({ mapId: undefined, queueId: undefined }))
  })
})
