import { describe, expect, it } from 'vitest'

import { parseGameStats } from './game-stats'

describe('parseGameStats', () => {
  it('parses a valid response with gameTime', () => {
    expect(parseGameStats({ gameTime: 120 })).toEqual({ gameTime: 120 })
  })

  it('returns null when gameTime is missing', () => {
    expect(parseGameStats({})).toBeNull()
  })

  it('returns null for a malformed response', () => {
    expect(parseGameStats('not an object')).toBeNull()
  })
})
