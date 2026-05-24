import { describe, expect, test } from 'vitest'

import type { GameQueue } from '@/core/lcu/parsers/game-queues'

import { groupQueuesByMode, parseQueueIds } from './lobby-creation-content-utils'

function createQueue(
  overrides: Partial<GameQueue> &
    Pick<GameQueue, 'category' | 'description' | 'gameMode' | 'id' | 'mapId' | 'queueAvailability'>,
): GameQueue {
  return overrides
}

const queues = [
  createQueue({
    category: 'PvP',
    description: 'Classic one',
    gameMode: 'CLASSIC',
    id: 1,
    mapId: 11,
    queueAvailability: 'Available',
  }),
  createQueue({
    category: 'PvP',
    description: 'Classic two',
    gameMode: 'CLASSIC',
    id: 2,
    mapId: 11,
    queueAvailability: 'Available',
  }),
  createQueue({
    category: 'PvP',
    description: 'ARAM',
    gameMode: 'ARAM',
    id: 3,
    mapId: 12,
    queueAvailability: 'Available',
  }),
  createQueue({
    category: 'PvP',
    description: 'TFT',
    gameMode: 'TFT',
    id: 4,
    mapId: 22,
    queueAvailability: 'Available',
  }),
  createQueue({
    category: 'PvP',
    description: 'RGM',
    gameMode: 'URF',
    id: 5,
    mapId: 12_345,
    queueAvailability: 'Available',
  }),
] satisfies GameQueue[]

describe('lobby-creation-content-utils', () => {
  test('parses queue ids from a comma-separated string', () => {
    expect(parseQueueIds('420, 430,440')).toEqual([420, 430, 440])
    expect(parseQueueIds(null)).toEqual([])
  })

  test('groups queues by mode and sorts by default queue order', () => {
    expect(groupQueuesByMode(queues, [2, 1])).toEqual([
      expect.objectContaining({ id: 'sr', queues: [queues[1], queues[0]] }),
      expect.objectContaining({ id: 'aram', queues: [queues[2]] }),
      expect.objectContaining({ id: 'tft', queues: [queues[3]] }),
      expect.objectContaining({ id: 'rgm', queues: [queues[4]] }),
    ])
  })
})
