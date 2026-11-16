import { describe, expect, test } from 'vitest'

import { lobbySessionDescriptor, summonerSpellsDescriptor } from '../../src/core/lcu/queries'

describe('lcu query parsers', () => {
  test('uses an empty lobby fallback for missing lobby sessions', () => {
    expect(lobbySessionDescriptor.notFoundValue).toMatchObject({
      localSummonerId: null,
      members: [],
      queueId: null,
    })
  })

  test('filters invalid summoner spells and empty game modes', () => {
    const result = summonerSpellsDescriptor.parse([
      {
        description: 'Valid spell.',
        gameModes: ['CLASSIC', '', 123, 'ARAM'],
        iconPath: '/spell.png',
        id: 4,
        name: 'Flash',
      },
      {
        id: 14,
        name: '',
      },
    ])

    expect(result).toHaveLength(1)

    expect(result?.[0]).toMatchObject({
      description: 'Valid spell.',
      gameModes: ['CLASSIC', 'ARAM'],
      iconPath: '/spell.png',
      id: 4,
      name: 'Flash',
    })
  })
})
