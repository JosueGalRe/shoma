import { describe, expect, test } from 'vitest'

import { ChampionId, SpellId } from '@/core/types/branded'

import { fuzzySearchChampions, fuzzySearchSpells } from './fuzzy-search'

import type { SummonerSpellData } from './asset-resolver-types'
import type { ChampionSummary } from '@/core/http/ddragon-client'

const image = { full: 'Champion.png', group: 'champion', h: 48, sprite: 'champion0.png', w: 48, x: 0, y: 0 }

const champions: ChampionSummary[] = [
  {
    id: ChampionId(103),
    image,
    key: 'Ahri',
    name: 'Ahri',
    partype: 'Mana',
    stats: {},
    tags: ['Mage', 'Assassin'],
    title: 'the Nine-Tailed Fox',
  },
  {
    id: ChampionId(37),
    image,
    key: 'Sona',
    name: 'Sona',
    partype: 'Mana',
    stats: {},
    tags: ['Support', 'Mage'],
    title: 'Maven of the Strings',
  },
  {
    id: ChampionId(267),
    image,
    key: 'Nami',
    name: 'Nami',
    partype: 'Mana',
    stats: {},
    tags: ['Support', 'Mage'],
    title: 'the Tidecaller',
  },
  {
    id: ChampionId(432),
    image,
    key: 'Bard',
    name: 'Bard',
    partype: 'Mana',
    stats: {},
    tags: ['Support', 'Mage'],
    title: 'the Wandering Caretaker',
  },
]

const spells: SummonerSpellData[] = [
  {
    description: 'Teleports your champion a short distance.',
    gameModes: ['CLASSIC'],
    iconPath: '/lol-game-data/assets/DATA/Spells/Icons2D/SummonerFlash.png',
    id: SpellId(4),
    name: 'Flash',
  },
  {
    description: 'Ignites target enemy champion.',
    gameModes: ['CLASSIC'],
    iconPath: '/lol-game-data/assets/DATA/Spells/Icons2D/SummonerDot.png',
    id: SpellId(14),
    name: 'Ignite',
  },
  {
    description: 'Restores health.',
    gameModes: ['CLASSIC'],
    iconPath: '/lol-game-data/assets/DATA/Spells/Icons2D/SummonerHeal.png',
    id: SpellId(7),
    name: 'Heal',
  },
]

describe('fuzzy search', () => {
  describe('fuzzySearchChampions', () => {
    test('finds partial matches across champion name, title, and alias', () => {
      expect(
        fuzzySearchChampions('tail', champions).map((champion) => {
          return champion.name
        }),
      ).toEqual(['Ahri'])

      expect(
        fuzzySearchChampions('sona', champions).map((champion) => {
          return champion.name
        }),
      ).toEqual(['Sona'])

      expect(
        fuzzySearchChampions('tide', champions).map((champion) => {
          return champion.name
        }),
      ).toEqual(['Nami'])
    })

    test('ranks exact name matches before startsWith, includes, and title or alias matches', () => {
      const results = fuzzySearchChampions('sona', [
        { ...champions[1], name: 'Mesona' },
        { ...champions[2], name: 'Sona Tidecaller' },
        champions[1],
        { ...champions[0], key: 'SonaAlias' },
      ])

      expect(
        results.map((champion) => {
          return champion.name
        }),
      ).toEqual(['Sona', 'Sona Tidecaller', 'Mesona', 'Ahri'])
    })

    test('is case-insensitive and trims the query', () => {
      expect(
        fuzzySearchChampions('  NINE  ', champions).map((champion) => {
          return champion.name
        }),
      ).toEqual(['Ahri'])
    })

    test('returns an empty array for empty or unknown champion queries', () => {
      expect(fuzzySearchChampions('', champions)).toEqual([])
      expect(fuzzySearchChampions('   ', champions)).toEqual([])
      expect(fuzzySearchChampions('unknown', champions)).toEqual([])
    })

    test('limits champion results', () => {
      expect(
        fuzzySearchChampions('a', champions, 2).map((champion) => {
          return champion.name
        }),
      ).toEqual(['Ahri', 'Sona'])
    })
  })

  describe('fuzzySearchSpells', () => {
    test('finds partial spell name matches', () => {
      expect(
        fuzzySearchSpells('la', spells).map((spell) => {
          return spell.name
        }),
      ).toEqual(['Flash'])
    })

    test('ranks exact spell name matches before startsWith and includes matches', () => {
      const results = fuzzySearchSpells('flash', [
        { ...spells[1], name: 'Super Flash' },
        { ...spells[2], name: 'Flash Heal' },
        spells[0],
      ])

      expect(
        results.map((spell) => {
          return spell.name
        }),
      ).toEqual(['Flash', 'Flash Heal', 'Super Flash'])
    })

    test('is case-insensitive and returns empty arrays for empty or unknown spell queries', () => {
      expect(
        fuzzySearchSpells('IGN', spells).map((spell) => {
          return spell.name
        }),
      ).toEqual(['Ignite'])

      expect(fuzzySearchSpells('', spells)).toEqual([])
      expect(fuzzySearchSpells('barrier', spells)).toEqual([])
    })

    test('limits spell results', () => {
      expect(
        fuzzySearchSpells('e', spells, 2).map((spell) => {
          return spell.name
        }),
      ).toEqual(['Ignite', 'Heal'])
    })
  })
})
