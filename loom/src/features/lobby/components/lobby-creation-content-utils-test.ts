import { describe, expect, test } from 'vitest'

import { groupQueuesByMode, parseQueueIds, readModeCardId } from './lobby-creation-content-utils'

import type { GameQueue } from '@/core/lcu/parsers/game-queues'

function createQueue(
  overrides: Partial<GameQueue> &
    Pick<GameQueue, 'category' | 'description' | 'gameMode' | 'id' | 'mapId' | 'queueAvailability'>,
): GameQueue {
  return { isEnabled: true, ...overrides }
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

  test('maps lobby modes to their selector card', () => {
    expect(readModeCardId('normal-draft')).toBe('sr')

    expect(readModeCardId('ranked-solo-duo')).toBe('sr')

    expect(readModeCardId('ranked-flex')).toBe('sr')

    expect(readModeCardId('swiftplay')).toBe('sr')

    expect(readModeCardId('aram')).toBe('aram')

    expect(readModeCardId('arena')).toBe('arena')

    expect(readModeCardId('clash')).toBe('clash')

    expect(readModeCardId('coop-vs-ai')).toBe('coop')

    expect(readModeCardId('custom')).toBeNull()

    expect(readModeCardId(undefined)).toBeNull()
  })

  test('groups queues by mode and sorts by default queue order', () => {
    expect(groupQueuesByMode(queues, [2, 1], false)).toEqual([
      expect.objectContaining({ id: 'sr', queues: [queues[1], queues[0]] }),
      expect.objectContaining({ id: 'aram', queues: [queues[2]] }),
      expect.objectContaining({ id: 'arena', queues: [queues[4]] }),
      expect.objectContaining({ id: 'tft', queues: [queues[3]] }),
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
      expect.objectContaining({ id: 'arena', queues: [queues[4]] }),
      expect.objectContaining({ id: 'tft', queues: [queues[3]] }),
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
      expect.objectContaining({ id: 'arena', queues: [queues[4]] }),
      expect.objectContaining({ id: 'tft', queues: [queues[3]] }),
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
      expect.objectContaining({ id: 'arena', queues: [queues[4]] }),
      expect.objectContaining({ id: 'tft', queues: [queues[3]] }),
      expect.objectContaining({ id: 'clash', queues: [clashQueues[0]] }),
    ])
  })

  test('groups jade queues into the classic mode card', () => {
    const jadeQueues = [
      createQueue({
        category: 'PvP',
        description: 'Classic 5v5',
        gameMode: 'JADE',
        id: 4310,
        mapId: 453,
        queueAvailability: 'Available',
        type: 'JADE_RANKED_SOLO_5x5',
      }),
    ]

    expect(groupQueuesByMode(jadeQueues, [], false)).toEqual([expect.objectContaining({ id: 'classic', queues: jadeQueues })])
  })

  test('groups the jade bot queue into the coop card', () => {
    const jadeBotQueue = createQueue({
      category: 'PvP',
      description: 'Cooperativo vs. IA Classic',
      gameMode: 'JADE',
      id: 4320,
      mapId: 453,
      queueAvailability: 'Available',
      type: 'JADE_BOT',
    })

    expect(groupQueuesByMode([jadeBotQueue], [], false)).toEqual([
      expect.objectContaining({ id: 'coop', queues: [jadeBotQueue] }),
    ])
  })

  test('hides rotating clash tournament queues from the rotating mode card', () => {
    const tournamentQueues = [
      createQueue({
        category: 'PvP',
        description: 'Clash de Fuego Ultrarr\u00e1pido Aleatorio',
        gameMode: 'URF',
        id: 740,
        mapId: 11,
        queueAvailability: 'Available',
        type: 'URF_CLASH',
      }),
    ]

    expect(groupQueuesByMode(tournamentQueues, [], false)).toEqual([])
  })

  test('excludes disabled queues even when availability looks fine', () => {
    const disabledQueues = [
      createQueue({
        category: 'PvP',
        description: 'URF',
        gameMode: 'URF',
        id: 900,
        isEnabled: false,
        mapId: 11,
        queueAvailability: 'Available',
      }),
    ]

    expect(groupQueuesByMode(disabledQueues, [], false)).toEqual([])
  })

  test('dedupes queues that resolve to the same visible name', () => {
    const duplicatedQueues = [
      createQueue({
        category: 'PvP',
        description: 'Same name',
        gameMode: 'URF',
        id: 900,
        mapId: 11,
        queueAvailability: 'Available',
      }),
      createQueue({
        category: 'PvP',
        description: 'Same name',
        gameMode: 'URF',
        id: 1900,
        mapId: 11,
        queueAvailability: 'Available',
      }),
    ]

    expect(groupQueuesByMode(duplicatedQueues, [], false)).toEqual([
      expect.objectContaining({ id: 'arena', queues: [duplicatedQueues[0]] }),
    ])
  })

  test('merges active rotating queues into the arena card', () => {
    const arenaQueue = createQueue({
      category: 'PvP',
      description: 'Arena 3x6',
      gameMode: 'CHERRY',
      id: 1700,
      mapId: 30,
      queueAvailability: 'Available',
    })
    const urfQueue = createQueue({
      category: 'PvP',
      description: 'Fuego Ultrarr\u00e1pido',
      gameMode: 'URF',
      id: 1900,
      mapId: 11,
      queueAvailability: 'Available',
    })

    expect(groupQueuesByMode([arenaQueue, urfQueue], [1700], false)).toEqual([
      expect.objectContaining({
        descriptionKey: 'createLobby.modeDescriptions.arenaRgm',
        id: 'arena',
        nameKey: 'createLobby.modes.arenaRgm',
        queues: [arenaQueue, urfQueue],
      }),
    ])
  })

  test('groups kiwi-jade queues into the aram card', () => {
    const clasicardoQueue = createQueue({
      category: 'PvP',
      description: 'ARAM Caos: Clasicardo',
      gameMode: 'KIWI_JADE',
      id: 2450,
      mapId: 12,
      queueAvailability: 'Available',
      type: 'KIWI',
    })

    expect(groupQueuesByMode([clasicardoQueue], [], false)).toEqual([
      expect.objectContaining({ id: 'aram', queues: [clasicardoQueue] }),
    ])
  })
})
