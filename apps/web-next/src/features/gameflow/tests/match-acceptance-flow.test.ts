import { afterAll, expect, test } from 'bun:test'

import { createMockLcuTransport, type MockLcuTransport } from '../../../testing/lcu-mock'

type BunModuleMock = {
  module: (specifier: string, factory: () => Record<string, unknown>) => void
  restore: () => void
}

type NavigateCall = {
  replace?: boolean
  to: string
}

type Effect = () => void | (() => void)

const { mock } = (await import('bun:test')) as unknown as { mock: BunModuleMock }

let currentPathname = '/connected/lobby'
let currentPhase: string | null = null
let currentTransport: MockLcuTransport | null = null
const navigateCalls: NavigateCall[] = []
const previousPhaseRef: { current: string | null } = { current: null }

mock.module('react', () => ({
  useEffect(effect: Effect) {
    effect()
  },
  useRef() {
    return previousPhaseRef
  },
}))

mock.module('@tanstack/react-query', () => ({
  queryOptions(options: unknown) {
    return options
  },
  useQuery() {
    return { data: currentPhase }
  },
}))

mock.module('@tanstack/react-router', () => ({
  useNavigate() {
    return (options: NavigateCall) => {
      navigateCalls.push(options)
      currentPathname = options.to
      return Promise.resolve()
    }
  },
  useRouterState({ select }: { select: (state: { location: { pathname: string } }) => string }) {
    return select({ location: { pathname: currentPathname } })
  },
}))

mock.module('@/core/rift/rift-client-provider', () => ({
  useSharedLCUTransport() {
    return currentTransport
  },
}))

mock.module('@/core/lcu/lcu-observer-sync', () => ({
  useLcuObserverSync() {},
}))

const { useGameflowNavigation } = await import('../hooks/use-gameflow-navigation')

afterAll(() => {
  mock.restore()
})

function resetNavigationHarness(): MockLcuTransport {
  currentPathname = '/connected/lobby'
  currentPhase = null
  currentTransport = createMockLcuTransport()
  navigateCalls.length = 0
  previousPhaseRef.current = null

  return currentTransport
}

function simulateGameflowPhase(transport: MockLcuTransport, phase: string): string | null {
  transport.mockGameflowPhase(phase)
  currentPhase = phase

  return useGameflowNavigation('/connected')
}

test('useGameflowNavigation follows the full match acceptance route flow', () => {
  const transport = resetNavigationHarness()

  expect(simulateGameflowPhase(transport, 'Lobby')).toBe('Lobby')
  expect(currentPathname).toBe('/connected/lobby')
  expect(navigateCalls).toEqual([])

  expect(simulateGameflowPhase(transport, 'Matchmaking')).toBe('Matchmaking')
  expect(navigateCalls.at(-1)).toEqual({ replace: true, to: '/connected/queue' })
  expect(currentPathname).toBe('/connected/queue')

  expect(simulateGameflowPhase(transport, 'ReadyCheck')).toBe('ReadyCheck')
  expect(navigateCalls).toHaveLength(1)
  expect(currentPathname).toBe('/connected/queue')

  expect(simulateGameflowPhase(transport, 'ChampSelect')).toBe('ChampSelect')
  expect(navigateCalls.at(-1)).toEqual({ replace: true, to: '/connected/champ-select' })
  expect(currentPathname).toBe('/connected/champ-select')

  expect(simulateGameflowPhase(transport, 'Lobby')).toBe('Lobby')
  expect(navigateCalls.at(-1)).toEqual({ replace: true, to: '/connected/lobby' })
  expect(currentPathname).toBe('/connected/lobby')

  expect(navigateCalls).toEqual([
    { replace: true, to: '/connected/queue' },
    { replace: true, to: '/connected/champ-select' },
    { replace: true, to: '/connected/lobby' },
  ])
})
