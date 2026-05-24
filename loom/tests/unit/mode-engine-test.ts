import { describe, expect, test } from 'vitest'

import {
  gameModes,
  getModeFromLcuGameMode,
  getModeFromQueueId,
  getModeNameKey,
  getModeRules,
  resolveGameMode,
  type GameMode,
  type ModeRules,
} from '../../src/features/modes/mode-engine'

const expectedRules: Record<GameMode, ModeRules> = {
  'ranked-solo-duo': {
    requiresRoleSelection: true,
    hasChampSelect: true,
    hasBans: true,
    hasSimultaneousBans: false,
    hasBench: false,
    usesRunes: true,
    usesSummonerSpells: true,
    allowsTrades: true,
    allowsSwaps: true,
    hasPreselect: false,
    maxPartySize: 2,
    minPartySize: 1,
    botSupport: false,
    spectatorSupport: false,
  },
  'ranked-flex': {
    requiresRoleSelection: true,
    hasChampSelect: true,
    hasBans: true,
    hasSimultaneousBans: false,
    hasBench: false,
    usesRunes: true,
    usesSummonerSpells: true,
    allowsTrades: true,
    allowsSwaps: true,
    hasPreselect: false,
    maxPartySize: 5,
    minPartySize: 1,
    botSupport: false,
    spectatorSupport: false,
  },
  'normal-draft': {
    requiresRoleSelection: true,
    hasChampSelect: true,
    hasBans: true,
    hasSimultaneousBans: false,
    hasBench: false,
    usesRunes: true,
    usesSummonerSpells: true,
    allowsTrades: true,
    allowsSwaps: true,
    hasPreselect: false,
    maxPartySize: 5,
    minPartySize: 1,
    botSupport: false,
    spectatorSupport: false,
  },
  swiftplay: {
    requiresRoleSelection: true,
    hasChampSelect: false,
    hasBans: false,
    hasSimultaneousBans: false,
    hasBench: false,
    usesRunes: true,
    usesSummonerSpells: true,
    allowsTrades: false,
    allowsSwaps: false,
    hasPreselect: true,
    maxPartySize: 5,
    minPartySize: 1,
    botSupport: false,
    spectatorSupport: false,
  },
  aram: {
    requiresRoleSelection: false,
    hasChampSelect: true,
    hasBans: false,
    hasSimultaneousBans: false,
    hasBench: true,
    usesRunes: true,
    usesSummonerSpells: true,
    allowsTrades: true,
    allowsSwaps: false,
    hasPreselect: false,
    maxPartySize: 5,
    minPartySize: 1,
    botSupport: false,
    spectatorSupport: false,
  },
  arena: {
    requiresRoleSelection: false,
    hasChampSelect: true,
    hasBans: true,
    hasSimultaneousBans: true,
    hasBench: false,
    usesRunes: false,
    usesSummonerSpells: false,
    allowsTrades: false,
    allowsSwaps: false,
    hasPreselect: false,
    maxPartySize: 2,
    minPartySize: 1,
    botSupport: false,
    spectatorSupport: false,
  },
  clash: {
    requiresRoleSelection: true,
    hasChampSelect: true,
    hasBans: true,
    hasSimultaneousBans: false,
    hasBench: false,
    usesRunes: true,
    usesSummonerSpells: true,
    allowsTrades: true,
    allowsSwaps: true,
    hasPreselect: false,
    maxPartySize: 5,
    minPartySize: 5,
    botSupport: false,
    spectatorSupport: false,
  },
  custom: {
    requiresRoleSelection: true,
    hasChampSelect: true,
    hasBans: true,
    hasSimultaneousBans: false,
    hasBench: false,
    usesRunes: true,
    usesSummonerSpells: true,
    allowsTrades: true,
    allowsSwaps: true,
    hasPreselect: false,
    maxPartySize: 10,
    minPartySize: 1,
    botSupport: true,
    spectatorSupport: true,
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
  'custom',
]

describe('mode engine', () => {
  test('returns the declared rules for every supported mode', () => {
    expect(gameModes).toEqual(expectedModes)

    for (const mode of gameModes) {
      expect(getModeRules(mode)).toEqual(expectedRules[mode])
    }
  })

  test('throws for invalid modes', () => {
    expect(() => getModeRules('nexus-blitz' as GameMode)).toThrow('Unsupported game mode')
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
