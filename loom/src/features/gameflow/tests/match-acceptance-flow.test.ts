import { expect, test } from 'bun:test'

import { resolveGameflowNavigation } from '../lib/resolve-gameflow-navigation'

test('resolveGameflowNavigation follows the full match acceptance route flow', () => {
  let pathname = '/connected/lobby'
  let previousPhase: string | null = null
  const navigations: string[] = []

  for (const nextPhase of ['Lobby', 'Matchmaking', 'ReadyCheck', 'ChampSelect', 'Lobby']) {
    const navigation = resolveGameflowNavigation({ nextPhase, pathname, previousPhase })

    if (navigation.shouldNavigate && navigation.targetRoute) {
      navigations.push(navigation.targetRoute)
      pathname = navigation.targetRoute
    }

    previousPhase = nextPhase
  }

  expect(pathname).toBe('/connected/lobby')
  expect(navigations).toEqual(['/connected/champ-select', '/connected/lobby'])
})
