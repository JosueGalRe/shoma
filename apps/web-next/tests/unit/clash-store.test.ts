import { beforeEach, describe, expect, test } from 'bun:test'

import {
  selectClashCheckInTimeRemaining,
  selectClashHasOpponent,
  selectClashMembers,
  selectClashPhase,
  selectIsClashBracket,
  selectIsClashPhase,
  useClashStore,
  type ClashTeamMember,
} from '../../src/features/clash/clash-store'

const members: ClashTeamMember[] = [
  { isCaptain: true, name: 'Top Player', role: 'TOP', summonerId: '1' },
  { isCaptain: false, name: 'Jungle Player', role: 'JUNGLE', summonerId: '2' },
  { isCaptain: false, name: 'Mid Player', role: 'MIDDLE', summonerId: '3' },
  { isCaptain: false, name: 'Bottom Player', role: 'BOTTOM', summonerId: '4' },
  { isCaptain: false, name: 'Support Player', role: 'UTILITY', summonerId: '5' },
]

beforeEach(() => {
  useClashStore.getState().reset()
})

describe('clash store', () => {
  test('does not use persist middleware', () => {
    expect((useClashStore as typeof useClashStore & { persist?: unknown }).persist).toBeUndefined()
  })

  test('setTeam updates members and eligibility', () => {
    useClashStore.getState().setTeam('Test Team', members)

    const state = useClashStore.getState()
    expect(state.members).toEqual(members)
    expect(state.teamName).toBe('Test Team')
    expect(state.members.length === 5).toBe(true)
    expect(selectClashMembers(state)).toEqual(members)
    expect(selectClashPhase(state)).toBe('registration')
    expect(selectIsClashBracket).toBe(selectIsClashPhase('bracket'))
  })

  test('setPhase transitions between clash phases', () => {
    useClashStore.getState().setPhase('check-in')
    expect(useClashStore.getState().phase).toBe('check-in')

    useClashStore.getState().setPhase('scouting')
    expect(useClashStore.getState().phase).toBe('scouting')
  })

  test('setTimers updates check-in and lock-in timers', () => {
    useClashStore.getState().setTimers(90, 45)

    expect(useClashStore.getState()).toMatchObject({
      checkInTimeRemaining: 90,
      lockInTimeRemaining: 45,
    })
    expect(selectClashCheckInTimeRemaining(useClashStore.getState())).toBe(90)
  })

  test('tracks opponent presence', () => {
    expect(selectClashHasOpponent(useClashStore.getState())).toBe(false)

    useClashStore.getState().setOpponent({
      name: 'Rivals',
      members,
    })

    expect(selectClashHasOpponent(useClashStore.getState())).toBe(true)
  })
})
