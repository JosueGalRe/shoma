import { describe, expect, test } from 'bun:test'
import { computeRolePreferences } from '../compute-role-preferences'

describe('computeRolePreferences', () => {
  test('normal selection: sets first role', () => {
    const result = computeRolePreferences(
      { first: 'UNSELECTED', second: 'UNSELECTED' },
      'first',
      'TOP',
    )
    expect(result).toEqual({ first: 'TOP', second: 'UNSELECTED' })
  })

  test('swap: selecting secondary role in primary slot swaps them', () => {
    const result = computeRolePreferences(
      { first: 'TOP', second: 'JUNGLE' },
      'first',
      'JUNGLE',
    )
    expect(result).toEqual({ first: 'JUNGLE', second: 'TOP' })
  })

  test('clear: selecting same role in same slot clears it', () => {
    const result = computeRolePreferences(
      { first: 'TOP', second: 'JUNGLE' },
      'first',
      'TOP',
    )
    expect(result).toEqual({ first: 'UNSELECTED', second: 'JUNGLE' })
  })

  test('FILL primary: sets secondary to UNSELECTED', () => {
    const result = computeRolePreferences(
      { first: 'TOP', second: 'JUNGLE' },
      'first',
      'FILL',
    )
    expect(result).toEqual({ first: 'FILL', second: 'UNSELECTED' })
  })

  test('FILL secondary: allowed when primary is not FILL', () => {
    const result = computeRolePreferences(
      { first: 'TOP', second: 'UNSELECTED' },
      'second',
      'FILL',
    )
    expect(result).toEqual({ first: 'TOP', second: 'FILL' })
  })

  test('swap via secondary: selecting primary role in secondary slot swaps them', () => {
    const result = computeRolePreferences(
      { first: 'TOP', second: 'JUNGLE' },
      'second',
      'TOP',
    )
    expect(result).toEqual({ first: 'JUNGLE', second: 'TOP' })
  })

  test('clear secondary: selecting same role in secondary slot clears it', () => {
    const result = computeRolePreferences(
      { first: 'TOP', second: 'JUNGLE' },
      'second',
      'JUNGLE',
    )
    expect(result).toEqual({ first: 'TOP', second: 'UNSELECTED' })
  })
})
