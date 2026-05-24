import { describe, expect, test } from 'vitest'

import type { ChampionSummary, RuneTree } from '@/core/http/ddragon-client'
import { ChampionId, RuneId, SpellId } from '@/core/types/branded'

import {
  getChampionName,
  getChampionTitle,
  getPerkName,
  getSpellName,
  resolveChampionIcon,
  resolveChampionSplash,
  resolvePerkIcon,
  resolveSpellIcon,
  type SummonerSpellData,
} from './asset-resolver'

const champions: ChampionSummary[] = [
  {
    id: ChampionId(103),
    key: 'Ahri',
    name: 'Ahri',
    title: 'the Nine-Tailed Fox',
    tags: ['Mage', 'Assassin'],
    partype: 'Mana',
    image: { full: 'Ahri.png', sprite: 'champion0.png', group: 'champion', x: 0, y: 0, w: 48, h: 48 },
    stats: {},
  },
]

const spells: SummonerSpellData[] = [
  {
    id: SpellId(4),
    name: 'Flash',
    description: 'Teleports your champion a short distance.',
    gameModes: ['CLASSIC'],
    iconPath: '/lol-game-data/assets/DATA/Spells/Icons2D/SummonerFlash.png',
  },
]

const runes: RuneTree[] = [
  {
    id: RuneId(8000),
    key: 'Precision',
    icon: 'perk-images/Styles/7201_Precision.png',
    name: 'Precision',
    slots: [
      {
        runes: [
          {
            id: RuneId(8005),
            key: 'PressTheAttack',
            icon: 'perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png',
            name: 'Press the Attack',
            shortDesc: 'Hit an enemy champion 3 consecutive times.',
            longDesc: 'Hit an enemy champion 3 consecutive times to expose them.',
          },
        ],
      },
    ],
  },
]

describe('asset resolver', () => {
  test('resolves known champion assets and names', () => {
    expect(resolveChampionIcon(103, champions, '15.24.1')).toBe(
      'https://ddragon.leagueoflegends.com/cdn/15.24.1/img/champion/Ahri.png',
    )
    expect(resolveChampionSplash(103, champions)).toBe('https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg')
    expect(getChampionName(103, champions)).toBe('Ahri')
    expect(getChampionTitle(103, champions)).toBe('the Nine-Tailed Fox')
  })

  test('falls back for unknown champion assets and metadata', () => {
    expect(resolveChampionIcon(999, champions, '15.24.1')).toBe('/lol-game-data/assets/v1/champion-icons/999.png')
    expect(resolveChampionSplash(999, champions)).toBeUndefined()
    expect(getChampionName(999, champions)).toBeUndefined()
    expect(getChampionTitle(999, champions)).toBeUndefined()
  })

  test('resolves summoner spell icon and name', () => {
    expect(resolveSpellIcon(4, spells, '15.24.1')).toBe(
      'https://ddragon.leagueoflegends.com/cdn/15.24.1/img/spell/SummonerFlash.png',
    )
    expect(getSpellName(4, spells)).toBe('Flash')
  })

  test('resolves perk icon and name', () => {
    expect(resolvePerkIcon(8005, runes)).toBe(
      'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png',
    )
    expect(getPerkName(8005, runes)).toBe('Press the Attack')
  })
})
