import { describe, expect, it } from 'vitest'

import { getRiotId } from './riot-id'

describe('getRiotId', () => {
  it('joins the game name and the tag line', () => {
    expect(getRiotId(' Dylan Siliezar ', ' LAN ')).toBe('Dylan Siliezar#LAN')
    expect(getRiotId('Dylan', '#LAN')).toBe('Dylan#LAN')
  })

  it('takes a whole Riot ID typed in the game name', () => {
    expect(getRiotId('Dylan#LAN', '')).toBe('Dylan#LAN')
  })

  it('waits for both parts', () => {
    expect(getRiotId('Dylan', '')).toBeNull()
    expect(getRiotId('', 'LAN')).toBeNull()
    expect(getRiotId('Dylan#', '#')).toBeNull()
  })
})
