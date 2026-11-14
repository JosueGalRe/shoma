import { describe, expect, test } from 'vitest'

import { getQueueRestrictionMessage } from './queue-restrictions'

const SCARCE = { code: 'QPPlayerScarcePositionCoverageRestriction', summonerIds: [1] }

describe('getQueueRestrictionMessage', () => {
  test('none without restrictions', () => {
    expect(getQueueRestrictionMessage([], 1)).toBeNull()
  })

  test("the priority position one names the local player when it's about them", () => {
    expect(getQueueRestrictionMessage([SCARCE], 1)).toBe('scarcePositionCoverageSelf')
    expect(getQueueRestrictionMessage([SCARCE], 2)).toBe('scarcePositionCoverage')
  })

  test("the client's order picks the one shown", () => {
    const unique = { code: 'QPNonUniquePrimarySlotRestriction', summonerIds: [2] }

    expect(getQueueRestrictionMessage([unique, SCARCE], 2)).toBe('scarcePositionCoverage')
  })

  test('other codes read as generic', () => {
    expect(getQueueRestrictionMessage([{ code: 'PlayerMinLevelRestriction', summonerIds: [1] }], 1)).toBe('generic')
  })
})
