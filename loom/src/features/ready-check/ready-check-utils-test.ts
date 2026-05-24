import { describe, expect, test } from 'vitest'

import { deriveReadyCheckStatus, normalizeTimer } from './ready-check-utils'

describe('ready check utils', () => {
  test('normalizes timers by rounding up and clamping at zero', () => {
    expect(normalizeTimer(1.2)).toBe(2)
    expect(normalizeTimer(0)).toBe(0)
    expect(normalizeTimer(-3.4)).toBe(0)
  })

  test('treats missing or expired snapshots as expired', () => {
    expect(deriveReadyCheckStatus(null, 10)).toBe('expired')
    expect(deriveReadyCheckStatus({ playerResponse: undefined, state: 'Expired', timer: 10 }, 10)).toBe('expired')
    expect(deriveReadyCheckStatus({ playerResponse: 'Accepted', state: 'InProgress', timer: 10 }, 0)).toBe('expired')
  })

  test('derives status from the latest response while the timer is active', () => {
    expect(deriveReadyCheckStatus({ playerResponse: 'Accepted', state: 'InProgress', timer: 10 }, 10)).toBe('accepted')
    expect(deriveReadyCheckStatus({ playerResponse: 'Declined', state: 'InProgress', timer: 10 }, 10)).toBe('declined')
    expect(deriveReadyCheckStatus({ playerResponse: undefined, state: 'InProgress', timer: 10 }, 10)).toBe('pending')
  })
})
