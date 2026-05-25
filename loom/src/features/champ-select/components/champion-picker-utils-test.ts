import { describe, expect, test } from 'vitest'

import { ChampionId } from '@/core/types/branded'

import { filterAramCards, filterChampions, getAvailableAramChampionIds } from './champion-picker-utils'

import type { ChampionSummary } from '@/core/http/ddragon-client'

const champions = [
  {
    id: ChampionId(1),
    name: 'Ahri',
    tags: ['Mage', 'Assassin'],
  },
  {
    id: ChampionId(2),
    name: 'Annie',
    tags: ['Mage'],
  },
  {
    id: ChampionId(3),
    name: 'Ashe',
    tags: ['Marksman'],
  },
  {
    id: ChampionId(4),
    name: 'Garen',
    tags: ['Fighter', 'Tank'],
  },
] satisfies Pick<ChampionSummary, 'id' | 'name' | 'tags'>[]

describe('champion-picker-utils', () => {
  test('filters champions by name and role before sorting', () => {
    expect(
      filterChampions(champions, 'a', 'Mage', 'name-asc').map((champion) => {
        return champion.name
      }),
    ).toEqual(['Ahri', 'Annie'])
  })

  test('sorts champions by name in descending order', () => {
    expect(
      filterChampions(champions, '', null, 'name-desc').map((champion) => {
        return champion.name
      }),
    ).toEqual(['Garen', 'Ashe', 'Annie', 'Ahri'])
  })

  test('filters and sorts ARAM cards using the matching champion names', () => {
    const cards = [
      { championId: ChampionId(4), isBlessed: false, type: 'normal' as const },
      { championId: ChampionId(2), isBlessed: true, type: 'crowd-favorite' as const },
      { championId: ChampionId(1), isBlessed: false, type: 'bravery' as const },
    ]

    expect(
      filterAramCards(cards, champions, 'a', 'Mage', 'name-asc').map((card) => {
        return card.championId
      }),
    ).toEqual([ChampionId(1), ChampionId(2)])
  })

  test('keeps ARAM availability aligned with bans and picked champions', () => {
    expect(
      getAvailableAramChampionIds(
        champions,
        [ChampionId(2)],
        [{ championId: ChampionId(3), championPickIntent: ChampionId(1) }],
        [{ championId: ChampionId(4) }],
      ),
    ).toEqual([ChampionId(1)])
  })
})
