import { describe, expect, test } from 'vitest'

import {
  type GameMode,
  gameModes,
  getModeFromLcuGameMode,
  getModeFromQueueId,
  getModeNameKey,
  getModeRules,
  type ModeRules,
  resolveGameMode,
} from '../../src/features/modes/mode-engine'

const expectedRules: Record<GameMode, ModeRules> = {
  aram: {
    allowsSwaps: false,
    allowsTrades: true,
    botSupport: false,
    hasBans: false,
    hasBench: true,
    hasChampSelect: true,
    hasPreselect: false,
    hasSimultaneousBans: false,
    maxPartySize: 5,
    minPartySize: 1,
    requiresRoleSelection: false,
    spectatorSupport: false,
    usesRunes: true,
    usesSummonerSpells: true,
  },
  arena: {
    allowsSwaps: false,
    allowsTrades: false,
    botSupport: false,
    hasBans: true,
    hasBench: false,
    hasChampSelect: true,
    hasPreselect: false,
    hasSimultaneousBans: true,
    maxPartySize: 2,
    minPartySize: 1,
    requiresRoleSelection: false,
    spectatorSupport: false,
    usesRunes: false,
    usesSummonerSpells: false,
  },
  clash: {
    allowsSwaps: true,
    allowsTrades: true,
    botSupport: false,
    hasBans: true,
    hasBench: false,
    hasChampSelect: true,
    hasPreselect: false,
    hasSimultaneousBans: false,
    maxPartySize: 5,
    minPartySize: 5,
    requiresRoleSelection: true,
    spectatorSupport: false,
    usesRunes: true,
    usesSummonerSpells: true,
  },
  'coop-vs-ai': {
    allowsSwaps: true,
    allowsTrades: true,
    botSupport: true,
    hasBans: false,
    hasBench: false,
    hasChampSelect: true,
    hasPreselect: false,
    hasSimultaneousBans: false,
    maxPartySize: 5,
    minPartySize: 1,
    requiresRoleSelection: true,
    spectatorSupport: false,
    usesRunes: true,
    usesSummonerSpells: true,
  },
  custom: {
    allowsSwaps: true,
    allowsTrades: true,
    botSupport: true,
    hasBans: true,
    hasBench: false,
    hasChampSelect: true,
    hasPreselect: false,
    hasSimultaneousBans: false,
    maxPartySize: 10,
    minPartySize: 1,
    requiresRoleSelection: true,
    spectatorSupport: true,
    usesRunes: true,
    usesSummonerSpells: true,
  },
  'normal-draft': {
    allowsSwaps: true,
    allowsTrades: true,
    botSupport: false,
    hasBans: true,
    hasBench: false,
    hasChampSelect: true,
    hasPreselect: false,
    hasSimultaneousBans: false,
    maxPartySize: 5,
    minPartySize: 1,
    requiresRoleSelection: true,
    spectatorSupport: false,
    usesRunes: true,
    usesSummonerSpells: true,
  },
  'ranked-flex': {
    allowsSwaps: true,
    allowsTrades: true,
    botSupport: false,
    hasBans: true,
    hasBench: false,
    hasChampSelect: true,
    hasPreselect: false,
    hasSimultaneousBans: false,
    maxPartySize: 5,
    minPartySize: 1,
    requiresRoleSelection: true,
    spectatorSupport: false,
    usesRunes: true,
    usesSummonerSpells: true,
  },
  'ranked-solo-duo': {
    allowsSwaps: true,
    allowsTrades: true,
    botSupport: false,
    hasBans: true,
    hasBench: false,
    hasChampSelect: true,
    hasPreselect: false,
    hasSimultaneousBans: false,
    maxPartySize: 2,
    minPartySize: 1,
    requiresRoleSelection: true,
    spectatorSupport: false,
    usesRunes: true,
    usesSummonerSpells: true,
  },
  swiftplay: {
    allowsSwaps: false,
    allowsTrades: false,
    botSupport: false,
    hasBans: false,
    hasBench: false,
    hasChampSelect: false,
    hasPreselect: true,
    hasSimultaneousBans: false,
    maxPartySize: 5,
    minPartySize: 1,
    requiresRoleSelection: true,
    spectatorSupport: false,
    usesRunes: true,
    usesSummonerSpells: true,
  },
}

const expectedModes: GameMode[] = [
  'ranked-solo-duo',
  'ranked-flex',
  'normal-draft',
  'swiftplay',
  'aram',
  'arena',
  'clash',
  'coop-vs-ai',
  'custom',
]

describe('mode engine', () => {
  test('returns the declared rules for every supported mode', () => {
    expect(gameModes).toEqual(expectedModes)

    for (const mode of gameModes) {
      expect(getModeRules(mode)).toEqual(expectedRules[mode])
    }
  })

  test('returns undefined for invalid modes', () => {
    const invalidMode = 'nexus-blitz' satisfies string

    expect(Reflect.apply(getModeRules, undefined, [invalidMode])).toBeUndefined()
  })

  test('resolves known LCU queue identifiers', () => {
    expect(getModeFromQueueId(420)).toBe('ranked-solo-duo')
    expect(getModeFromQueueId(440)).toBe('ranked-flex')
    expect(getModeFromQueueId(400)).toBe('normal-draft')
    expect(getModeFromQueueId(480)).toBe('swiftplay')
    expect(getModeFromQueueId(450)).toBe('aram')
    expect(getModeFromQueueId(1700)).toBe('arena')
    expect(getModeFromQueueId(700)).toBe('clash')
    expect(getModeFromQueueId(9999)).toBeNull()
  })

  test('resolves LCU mode strings and ARAM hints', () => {
    expect(getModeFromLcuGameMode('CHERRY')).toBe('arena')
    expect(getModeFromLcuGameMode('ARAM')).toBe('aram')
    expect(resolveGameMode({ benchEnabled: true })).toBe('aram')
    expect(resolveGameMode({ mapId: 12 })).toBe('aram')
    expect(resolveGameMode({})).toBe('normal-draft')
  })

  test('returns translation keys for mode names', () => {
    expect(getModeNameKey('ranked-solo-duo')).toBe('modes.rankedSoloDuo')
    expect(getModeNameKey('custom')).toBe('modes.custom')
  })
})
