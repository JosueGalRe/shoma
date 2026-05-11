import { describe, expect, test } from 'bun:test'

import { resolveGameflowNavigation } from '../lib/resolve-gameflow-navigation'

describe('resolveGameflowNavigation', () => {
  test('does not navigate when Matchmaking transitions to ReadyCheck', () => {
    expect(
      resolveGameflowNavigation({
        nextPhase: 'ReadyCheck',
        pathname: '/connected/lobby',
        previousPhase: 'Matchmaking',
      }),
    ).toEqual({ shouldNavigate: false, targetRoute: null })
  })

  test('navigates to lobby when ChampSelect transitions to Lobby', () => {
    expect(
      resolveGameflowNavigation({
        nextPhase: 'Lobby',
        pathname: '/connected/champ-select',
        previousPhase: 'ChampSelect',
      }),
    ).toEqual({ shouldNavigate: true, targetRoute: '/connected/lobby' })
  })

  test('does not navigate when already on the target route', () => {
    expect(
      resolveGameflowNavigation({
        nextPhase: 'Lobby',
        pathname: '/connected/lobby',
        previousPhase: 'ChampSelect',
      }),
    ).toEqual({ shouldNavigate: false, targetRoute: null })
  })

  test('does not navigate from a non-gameflow connected route', () => {
    expect(
      resolveGameflowNavigation({
        nextPhase: 'ChampSelect',
        pathname: '/connected/settings',
        previousPhase: 'ReadyCheck',
      }),
    ).toEqual({ shouldNavigate: false, targetRoute: null })
  })

  test('does not navigate for an invalid phase string', () => {
    expect(
      resolveGameflowNavigation({
        nextPhase: 'PostGame',
        pathname: '/connected/lobby',
        previousPhase: 'Lobby',
      }),
    ).toEqual({ shouldNavigate: false, targetRoute: null })
  })

  test('does not navigate when Lobby transitions to Matchmaking', () => {
    expect(
      resolveGameflowNavigation({
        nextPhase: 'Matchmaking',
        pathname: '/connected/lobby',
        previousPhase: 'Lobby',
      }),
    ).toEqual({ shouldNavigate: false, targetRoute: null })
  })
})
