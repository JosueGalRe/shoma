import { describe, expect, it } from 'vitest'

import { parseGameflowQueue } from '@/core/lcu/parsers/gameflow'

describe('parseGameflowQueue', () => {
  it('reads the game queue from the gameflow session', () => {
    expect(
      parseGameflowQueue({
        gameData: { gameId: 1, queue: { gameMode: 'SWIFTPLAY', id: 480, mapId: 11, type: 'SWIFTPLAY' } },
        phase: 'InProgress',
      }),
    ).toEqual({ gameMode: 'SWIFTPLAY', id: 480, mapId: 11 })
  })

  it('returns null without a queue', () => {
    expect(parseGameflowQueue({ phase: 'None' })).toBeNull()
  })
})
