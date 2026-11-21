import { describe, expect, test } from 'vitest'

import { getModeRules } from '../../src/features/modes/mode-engine'

describe('arena mode', () => {
  test('uses simultaneous bans without standard runes or summoner spells', () => {
    expect(getModeRules('arena')).toMatchObject({
      hasBans: true,
      hasSimultaneousBans: true,
      maxPartySize: 2,
      usesRunes: false,
      usesSummonerSpells: false,
    })
  })
})
