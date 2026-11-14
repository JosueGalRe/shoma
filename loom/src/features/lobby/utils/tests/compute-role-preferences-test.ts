import { describe, expect, it } from 'vitest'

import { isRolePairComplete, toggleRolePreference } from '../compute-role-preferences'

describe('toggleRolePreference', () => {
  it('picks the primary position, then the secondary, then replaces the secondary', () => {
    const primary = toggleRolePreference({ first: 'UNSELECTED', second: 'UNSELECTED' }, 'TOP')
    const both = toggleRolePreference(primary, 'JUNGLE')

    expect(primary).toEqual({ first: 'TOP', second: 'UNSELECTED' })
    expect(both).toEqual({ first: 'TOP', second: 'JUNGLE' })
    expect(toggleRolePreference(both, 'MIDDLE')).toEqual({ first: 'TOP', second: 'MIDDLE' })
  })

  it('drops a picked position and moves the secondary up', () => {
    expect(toggleRolePreference({ first: 'TOP', second: 'JUNGLE' }, 'TOP')).toEqual({ first: 'JUNGLE', second: 'UNSELECTED' })
    expect(toggleRolePreference({ first: 'TOP', second: 'JUNGLE' }, 'JUNGLE')).toEqual({ first: 'TOP', second: 'UNSELECTED' })
  })

  it('keeps FILL alone', () => {
    expect(toggleRolePreference({ first: 'TOP', second: 'JUNGLE' }, 'FILL')).toEqual({ first: 'FILL', second: 'UNSELECTED' })

    expect(toggleRolePreference({ first: 'FILL', second: 'UNSELECTED' }, 'BOTTOM')).toEqual({
      first: 'BOTTOM',
      second: 'UNSELECTED',
    })

    expect(toggleRolePreference({ first: 'FILL', second: 'UNSELECTED' }, 'FILL')).toEqual({
      first: 'UNSELECTED',
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
