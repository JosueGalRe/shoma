import { describe, expect, test } from 'vitest'

import { mapModeToIcon, readAnchoredGameTime } from './in-game-screen-utils'

describe('in-game-screen-utils', () => {
  test('maps queue modes to the expected icons', () => {
    expect(mapModeToIcon('aram')).toContain('/aram/img/game-select-icon-default.png')
    expect(mapModeToIcon('ranked-solo-duo')).toContain('/classic_sru/img/game-select-icon-default.png')
  })

  test('returns zero without an anchor', () => {
    expect(readAnchoredGameTime(null, 1_000_000)).toBe(0)
  })

  test('derives elapsed game time from the anchor', () => {
    const anchor = { gameTime: 600.4, localTime: 1_000_000 }

    expect(readAnchoredGameTime(anchor, 1_000_000)).toBe(600)

    expect(readAnchoredGameTime(anchor, 1_061_000)).toBe(661)
  })

  test('clamps negative drift to zero', () => {
    const anchor = { gameTime: 5, localTime: 1_000_000 }

    expect(readAnchoredGameTime(anchor, 990_000)).toBe(0)
  })
})
