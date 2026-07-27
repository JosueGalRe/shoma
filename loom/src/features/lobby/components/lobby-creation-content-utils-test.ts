import { describe, expect, test } from 'vitest'

import { groupQueuesByMode, parseQueueIds } from './lobby-creation-content-utils'

import type { GameQueue } from '@/core/lcu/parsers/game-queues'

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
    expect(groupQueuesByMode(queues, [2, 1], false)).toEqual([
      expect.objectContaining({ id: 'sr', queues: [queues[1], queues[0]] }),
      expect.objectContaining({ id: 'aram', queues: [queues[2]] }),
      expect.objectContaining({ id: 'tft', queues: [queues[3]] }),
      expect.objectContaining({ id: 'rgm', queues: [queues[4]] }),
    ])
  })

  test('groups rotating and training queues into their own modes', () => {
    const trainingQueues = [
      createQueue({
        category: 'PvP',
        description: 'Tutorial',
        gameMode: 'TUTORIAL_MODULE_1',
        id: 10,
        mapId: 11,
        queueAvailability: 'Available',
      }),
      createQueue({
        category: 'PvP',
        description: 'Practice Tool',
        gameMode: 'PRACTICETOOL',
        id: 11,
        mapId: 11,
        queueAvailability: 'Available',
      }),
    ]

    expect(groupQueuesByMode([...queues, ...trainingQueues], [2, 1], false)).toEqual([
      expect.objectContaining({ id: 'sr', queues: [queues[1], queues[0]] }),
      expect.objectContaining({ id: 'aram', queues: [queues[2]] }),
      expect.objectContaining({ id: 'tft', queues: [queues[3]] }),
      expect.objectContaining({ id: 'rgm', queues: [queues[4]] }),
      expect.objectContaining({ id: 'training', queues: trainingQueues }),
    ])
  })

  test('excludes clash queues when clash is not visible', () => {
    const clashQueues = [
      createQueue({
        category: 'PvP',
        description: 'Torneos',
        gameMode: 'CLASSIC',
        id: 700,
        mapId: 11,
        queueAvailability: 'Available',
      }),
      ...queues,
    ]

    expect(groupQueuesByMode(clashQueues, [2, 1], false)).toEqual([
      expect.objectContaining({ id: 'sr', queues: [queues[1], queues[0]] }),
      expect.objectContaining({ id: 'aram', queues: [queues[2]] }),
      expect.objectContaining({ id: 'tft', queues: [queues[3]] }),
      expect.objectContaining({ id: 'rgm', queues: [queues[4]] }),
    ])
  })

  test('includes clash queues when clash is visible', () => {
    const clashQueues = [
      createQueue({
        category: 'PvP',
        description: 'Torneos',
        gameMode: 'CLASSIC',
        id: 700,
        mapId: 11,
        queueAvailability: 'Available',
      }),
      ...queues,
    ]

    expect(groupQueuesByMode(clashQueues, [2, 1], true)).toEqual([
      expect.objectContaining({ id: 'sr', queues: [queues[1], queues[0]] }),
      expect.objectContaining({ id: 'aram', queues: [queues[2]] }),
      expect.objectContaining({ id: 'tft', queues: [queues[3]] }),
      expect.objectContaining({ id: 'clash', queues: [clashQueues[0]] }),
      expect.objectContaining({ id: 'rgm', queues: [queues[4]] }),
    ])
  })
})
