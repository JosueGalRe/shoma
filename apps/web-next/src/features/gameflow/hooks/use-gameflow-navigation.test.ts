import { beforeEach, describe, expect, mock, test } from 'bun:test'

import { createMockLcuTransport } from '../../../testing/lcu-mock'

declare module 'bun:test' {
  export const mock: {
    module(path: string, factory: () => Record<string, unknown>): void
  }
}

type NavigateOptions = { replace: boolean; to: '/connected/champ-select' | '/connected/lobby' | '/connected/queue' }

const navigateCalls: NavigateOptions[] = []

let phase: string | null = null
let pathname = '/'
let transport = createMockLcuTransport()
let previousPhaseRef: { current: string | null } | null = null

mock.module('react', () => ({
  useEffect(callback: () => void | (() => void)) {
    callback()
  },
  useRef<T>(initialValue: T) {
    previousPhaseRef ??= { current: initialValue as string | null }
    return previousPhaseRef as { current: T }
  },
}))

mock.module('@tanstack/react-query', () => ({
  useQuery: () => ({ data: phase }),
}))

mock.module('@tanstack/react-router', () => ({
  useNavigate: () => (options: NavigateOptions) => {
    navigateCalls.push(options)
  },
  useRouterState: () => pathname,
}))

mock.module('@/core/lcu/lcu-queries', () => ({
  createLcuQueryOptions: () => ({}),
  gameflowPhaseDescriptor: {},
}))

mock.module('@/core/lcu/lcu-observer-sync', () => ({
  useLcuObserverSync: () => undefined,
}))

mock.module('@/core/rift/rift-client-provider', () => ({
  useSharedLCUTransport: () => transport,
}))

const { useGameflowNavigation } = await import('./use-gameflow-navigation')

function runHook(): void {
  useGameflowNavigation('/connected')
}

beforeEach(() => {
  phase = null
  pathname = '/'
  navigateCalls.length = 0
  transport = createMockLcuTransport()
  previousPhaseRef = null
})

describe('useGameflowNavigation', () => {
  test('does not navigate when Matchmaking transitions to ReadyCheck', async () => {
    phase = 'Matchmaking'
    pathname = '/connected/queue'

    runHook()

    expect(navigateCalls).toHaveLength(0)

    phase = 'ReadyCheck'
    runHook()

    expect(navigateCalls).toHaveLength(0)
  })

  test('navigates to champ select when ReadyCheck transitions to ChampSelect', async () => {
    phase = 'ReadyCheck'
    pathname = '/connected/lobby'

    runHook()

    expect(navigateCalls).toHaveLength(0)

    phase = 'ChampSelect'
    runHook()

    expect(navigateCalls).toEqual([{ replace: true, to: '/connected/champ-select' }])

    runHook()

    expect(navigateCalls).toHaveLength(1)
  })

  test('navigates to lobby when ChampSelect transitions to Lobby', async () => {
    phase = 'ChampSelect'
    pathname = '/connected/champ-select'

    runHook()

    expect(navigateCalls).toHaveLength(0)

    phase = 'Lobby'
    runHook()

    expect(navigateCalls).toEqual([{ replace: true, to: '/connected/lobby' }])
  })

  test('does not duplicate navigation when already on the target route', async () => {
    phase = 'Lobby'
    pathname = '/connected/lobby'

    runHook()

    expect(navigateCalls).toHaveLength(0)

    runHook()

    expect(navigateCalls).toHaveLength(0)
  })

  test('does not navigate from a non-connected route', async () => {
    phase = 'ChampSelect'
    pathname = '/'

    runHook()

    expect(navigateCalls).toHaveLength(0)
  })

  test('does not navigate for an invalid phase string', async () => {
    phase = 'PostGame'
    pathname = '/connected/lobby'

    runHook()

    expect(navigateCalls).toHaveLength(0)
  })
})
