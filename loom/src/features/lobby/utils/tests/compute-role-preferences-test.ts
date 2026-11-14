import { describe, expect, it } from 'vitest'

import { assignRolePreference, isRolePairComplete } from '../compute-role-preferences'

describe('assignRolePreference', () => {
  it('puts the role in the slot being edited', () => {
    expect(assignRolePreference({ first: 'MIDDLE', second: 'UTILITY' }, 'first', 'TOP')).toEqual({
      first: 'TOP',
      second: 'UTILITY',
    })

    expect(assignRolePreference({ first: 'MIDDLE', second: 'UTILITY' }, 'second', 'TOP')).toEqual({
      first: 'MIDDLE',
      second: 'TOP',
    })
  })

  it('swaps with the other slot when the role is already there, as the client does', () => {
    expect(assignRolePreference({ first: 'MIDDLE', second: 'UTILITY' }, 'first', 'UTILITY')).toEqual({
      first: 'UTILITY',
      second: 'MIDDLE',
    })

    expect(assignRolePreference({ first: 'MIDDLE', second: 'UTILITY' }, 'second', 'MIDDLE')).toEqual({
      first: 'UTILITY',
      second: 'MIDDLE',
    })
  })

  it('keeps the pair when the slot already holds the role', () => {
    const pair = { first: 'MIDDLE', second: 'UTILITY' } as const

    expect(assignRolePreference(pair, 'first', 'MIDDLE')).toBe(pair)
  })

  it('drops the secondary under a primary FILL', () => {
    expect(assignRolePreference({ first: 'TOP', second: 'JUNGLE' }, 'first', 'FILL')).toEqual({
      first: 'FILL',
      second: 'UNSELECTED',
    })
  })
})

describe('isRolePairComplete', () => {
  it('needs two positions or FILL', () => {
    expect(isRolePairComplete({ first: 'TOP', second: 'UNSELECTED' })).toBe(false)
    expect(isRolePairComplete({ first: 'TOP', second: 'UTILITY' })).toBe(true)
    expect(isRolePairComplete({ first: 'FILL', second: 'UNSELECTED' })).toBe(true)
    expect(isRolePairComplete({ first: 'UNSELECTED', second: 'UNSELECTED' })).toBe(false)
  })
})
