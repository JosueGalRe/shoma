import { describe, expect, test } from 'vitest'

import { friendGroupsDescriptor, parseLcuFriend } from '../../../src/core/lcu/queries/social'

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

describe('friend groups', () => {
  test("drops the client's own OFFLINE meta group", () => {
    const groups = friendGroupsDescriptor.parse([
      { id: 0, isMetaGroup: false, name: '**Default' },
      { id: 10_000, isMetaGroup: true, name: 'OFFLINE' },
    ])

    expect(groups).toEqual({ 0: '**Default' })
  })
})
