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
      { id: 0, isMetaGroup: false, name: '**Default', priority: 5 },
      { id: 10_000, isMetaGroup: true, name: 'OFFLINE', priority: 1 },
    ])

    expect(groups).toEqual([{ id: 0, name: '**Default', priority: 5 }])
  })

  test('lists folders by priority, as the client does, so a new one comes first', () => {
    const groups = friendGroupsDescriptor.parse([
      { id: 0, name: '**Default', priority: 5 },
      { id: 2, name: 'cheny', priority: 4 },
      { id: 5, name: 'nueva', priority: 6 },
    ])

    expect(
      groups?.map(({ name }) => {
        return name
      }),
    ).toEqual(['nueva', '**Default', 'cheny'])
  })

  test('names a friend by their folder id', () => {
    const groups = friendGroupsDescriptor.parse([{ id: 2, name: 'cheny', priority: 4 }]) ?? []

    expect(parseLcuFriend({ gameName: 'a', groupId: 2, id: 'a@pvp', puuid: 'p', summonerId: 1 }, groups)?.group).toBe('cheny')
    expect(parseLcuFriend({ gameName: 'b', groupId: 9, id: 'b@pvp', puuid: 'q', summonerId: 2 }, groups)?.group).toBe('GENERAL')
  })
})
