import { describe, expect, test } from 'vitest'

import { mapModeToIcon } from './in-game-screen-utils'

describe('in-game-screen-utils', () => {
  test('maps queue modes to the expected icons', () => {
    expect(mapModeToIcon('aram')).toContain('/aram/img/game-select-icon-default.png')
    expect(mapModeToIcon('ranked-solo-duo')).toContain('/classic_sru/img/game-select-icon-default.png')
  })
})
