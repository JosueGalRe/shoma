import { describe, expect, test } from 'vitest'

import { deriveReadyCheckStatus, formatMatchDetails, formatMatchup, normalizeTimer, readSecondsLeft } from './ready-check-utils'

describe('ready check utils', () => {
  test('normalizes timers by rounding up and clamping at zero', () => {
    expect(normalizeTimer(1.2)).toBe(2)
    expect(normalizeTimer(0)).toBe(0)
    expect(normalizeTimer(-3.4)).toBe(0)
  })

  test('counts down from the elapsed seconds the LCU sends', () => {
    expect(readSecondsLeft(0)).toBe(11)
    expect(readSecondsLeft(0.4)).toBe(11)
    expect(readSecondsLeft(9.9)).toBe(1)
    expect(readSecondsLeft(10.8)).toBe(0)
  })

  test('treats missing or expired snapshots as expired', () => {
    expect(deriveReadyCheckStatus(null, 10)).toBe('expired')
    expect(deriveReadyCheckStatus({ playerResponse: undefined, state: 'Expired', timer: 10 }, 10)).toBe('expired')
    expect(deriveReadyCheckStatus({ playerResponse: undefined, state: 'InProgress', timer: 11 }, 0)).toBe('expired')
  })

  test('keeps an answer once the countdown runs out', () => {
    expect(deriveReadyCheckStatus({ playerResponse: 'Accepted', state: 'InProgress', timer: 11 }, 0)).toBe('accepted')
  })

  test('derives status from the latest response while the timer is active', () => {
    expect(deriveReadyCheckStatus({ playerResponse: 'Accepted', state: 'InProgress', timer: 10 }, 10)).toBe('accepted')
    expect(deriveReadyCheckStatus({ playerResponse: 'Declined', state: 'InProgress', timer: 10 }, 10)).toBe('declined')
    expect(deriveReadyCheckStatus({ playerResponse: undefined, state: 'InProgress', timer: 10 }, 10)).toBe('pending')
  })

  test('shows a matchup only for queues of two teams', () => {
    expect(formatMatchup(5)).toBe('5vs5')
    expect(formatMatchup(8)).toBeUndefined()
    expect(formatMatchup(18)).toBeUndefined()
    expect(formatMatchup(undefined)).toBeUndefined()
  })

  test("writes Summoner's Rift as the Figma's S.R, without the matchup the map already implies", () => {
    expect(formatMatchDetails({ id: 11, name: 'Grieta del Invocador' }, 'Partida Casual', 5)).toEqual({
      details: ['S.R', 'Partida Casual'],
      matchup: undefined,
    })

    expect(formatMatchDetails({ id: 12, name: 'Howling Abyss' }, 'ARAM', 5)).toEqual({
      details: ['Howling Abyss', 'ARAM', '5vs5'],
      matchup: '5vs5',
    })

    expect(formatMatchDetails({ id: undefined, name: undefined }, '', undefined)).toEqual({ details: [], matchup: undefined })
  })
})
