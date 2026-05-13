import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

// Ensure window.sessionStorage exists before any Zustand persist imports
const storage = new Map<string, string>()
Object.defineProperty(globalThis, 'window', {
  value: {
    sessionStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
  },
  configurable: true,
  writable: true,
})

import type { LobbyMember } from '../../lobby-store'
import { SummonerId } from '../../../../core/types/branded'

const reactQueryModulePath = '/home/josuegalre/projects/mimic/node_modules/.bun/@tanstack+react-query@5.100.8+3f10a4be4e334a9b/node_modules/@tanstack/react-query/build/modern/index.js'

type HookHarness = {
  beginRender: () => void
  cleanupEffects: () => void
  runEffects: () => void
  useCallback: <T extends (...args: unknown[]) => unknown>(callback: T, deps?: readonly unknown[]) => T
  useEffect: (effect: () => void | (() => void), deps?: readonly unknown[]) => void
  useMemo: <T>(factory: () => T, deps?: readonly unknown[]) => T
  useRef: <T>(initialValue: T) => { current: T }
  useState: <T>(initialValue: T) => [T, (next: T | ((previous: T) => T)) => void]
}

type RenderState = {
  gameflowPhase: 'None' | 'ChampSelect' | 'Lobby' | null
  lobbyMembers: LobbyMember[] | null
  lobbyMode: string
  queueStatus: { isSearching: boolean; queueId: null; searchState: null }
}

type FakeTimers = {
  restore: () => void
  tick: (milliseconds: number) => void
}

type Descriptor = {
  queryKey: readonly unknown[]
}

type BunMockApi = {
  module: (specifier: string, factory: () => Record<string, unknown>) => void
  timers: {
    enable: () => void
    restore: () => void
    tick: (milliseconds: number) => void
  }
}

const baseMember = (displayName: string, summonerId: number): LobbyMember => ({
  allowedInviteOthers: false,
  displayName,
  firstPositionPreference: 'UNSELECTED',
  iconUrl: null,
  isLeader: false,
  isLocalMember: false,
  profileIconId: null,
  secondPositionPreference: 'UNSELECTED',
  summonerId: SummonerId(summonerId),
})

const memberA = baseMember('A', 101)
const memberB = baseMember('B', 102)
const memberC = baseMember('C', 103)

const { mock } = (await import('bun:test')) as unknown as { mock: BunMockApi }

// Provide a minimal sessionStorage mock for Zustand persist middleware
Object.defineProperty(globalThis, 'sessionStorage', {
  value: {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  },
  configurable: true,
  writable: true,
})

let currentHarness: HookHarness
let renderState: RenderState
let fakeTimers: FakeTimers | null = null

function setupSessionStorageMock() {
  const storage = new Map<string, string>()
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
    configurable: true,
    writable: true,
  })
}

function sameDeps(left: readonly unknown[] | undefined, right: readonly unknown[] | undefined) {
  if (left === right) {
    return true
  }

  if (!left || !right || left.length !== right.length) {
    return false
  }

  return left.every((value, index) => Object.is(value, right[index]))
}

function createHarness(): HookHarness {
  const states: unknown[] = []
  const refs: Array<{ current: unknown }> = []
  const memos: Array<{ deps?: readonly unknown[]; value: unknown }> = []
  const effects: Array<{ cleanup?: () => void; deps?: readonly unknown[]; effect: () => void | (() => void); lastDeps?: readonly unknown[] }> = []

  let stateIndex = 0
  let refIndex = 0
  let memoIndex = 0
  let effectIndex = 0

  return {
    beginRender() {
      stateIndex = 0
      refIndex = 0
      memoIndex = 0
      effectIndex = 0
    },
    cleanupEffects() {
      for (const effect of effects) {
        effect.cleanup?.()
      }
    },
    runEffects() {
      for (const effect of effects) {
        if (sameDeps(effect.lastDeps, effect.deps)) {
          continue
        }

        effect.cleanup?.()
        const cleanup = effect.effect()
        effect.lastDeps = effect.deps
        effect.cleanup = typeof cleanup === 'function' ? cleanup : undefined
      }
    },
    useCallback(callback, deps) {
      return this.useMemo(() => callback, deps)
    },
    useEffect(effect, deps) {
      const index = effectIndex
      effectIndex += 1
      effects[index] = {
        cleanup: effects[index]?.cleanup,
        deps,
        effect,
        lastDeps: effects[index]?.lastDeps,
      }
    },
    useMemo(factory, deps) {
      const index = memoIndex
      memoIndex += 1
      const cached = memos[index]
      if (cached && sameDeps(cached.deps, deps)) {
        return cached.value as ReturnType<typeof factory>
      }

      const value = factory()
      memos[index] = { deps, value }
      return value
    },
    useRef(initialValue) {
      const index = refIndex
      refIndex += 1
      if (!refs[index]) {
        refs[index] = { current: initialValue }
      }

      return refs[index] as { current: typeof initialValue }
    },
    useState(initialValue) {
      const index = stateIndex
      stateIndex += 1
      if (!(index in states)) {
        states[index] = initialValue
      }

      const setState = (next: typeof initialValue | ((previous: typeof initialValue) => typeof initialValue)) => {
        states[index] = typeof next === 'function' ? (next as (previous: typeof initialValue) => typeof initialValue)(states[index] as typeof initialValue) : next
      }

      return [states[index] as typeof initialValue, setState]
    },
  }
}

function createDescriptor(queryKey: readonly unknown[]): Descriptor {
  return { queryKey }
}

function createLobbyQueryResult() {
  return renderState.lobbyMembers === null
    ? { data: null, isFetching: false, isLoading: false }
    : {
        data: {
          members: renderState.lobbyMembers,
          mode: renderState.lobbyMode,
        },
        isFetching: false,
        isLoading: false,
      }
}

function installFakeTimers(): FakeTimers {
  const originalSetTimeout = globalThis.setTimeout
  const originalClearTimeout = globalThis.clearTimeout
  const scheduledTimers = new Map<number, { callback: TimerHandler; runAt: number }>()

  let nextTimerId = 1
  let now = 0

  globalThis.setTimeout = ((callback: TimerHandler, delay?: number) => {
    const timerId = nextTimerId
    nextTimerId += 1

    scheduledTimers.set(timerId, {
      callback,
      runAt: now + (delay ?? 0),
    })

    return timerId as unknown as ReturnType<typeof globalThis.setTimeout>
  }) as unknown as typeof globalThis.setTimeout

  globalThis.clearTimeout = ((timeoutId: ReturnType<typeof globalThis.setTimeout>) => {
    if (typeof timeoutId === 'number') {
      scheduledTimers.delete(timeoutId)
    }
  }) as unknown as typeof globalThis.clearTimeout

  return {
    restore() {
      globalThis.setTimeout = originalSetTimeout
      globalThis.clearTimeout = originalClearTimeout
    },
    tick(milliseconds: number) {
      now += milliseconds

      while (true) {
        const dueTimers = Array.from(scheduledTimers.entries())
          .filter(([, timer]) => timer.runAt <= now)
          .sort((left, right) => left[1].runAt - right[1].runAt)

        if (dueTimers.length === 0) {
          return
        }

        for (const [timerId, timer] of dueTimers) {
          scheduledTimers.delete(timerId)

          if (typeof timer.callback === 'function') {
            timer.callback()
          }
        }
      }
    },
  }
}

function renderUseLobby() {
  currentHarness.beginRender()
  const result = useLobby()
  currentHarness.runEffects()
  return result
}

mock.module('react', () => ({
  __esModule: true,
  default: {},
  useCallback: (...args: Parameters<HookHarness['useCallback']>) => currentHarness.useCallback(...args),
  useEffect: (...args: Parameters<HookHarness['useEffect']>) => currentHarness.useEffect(...args),
  useMemo: (...args: Parameters<HookHarness['useMemo']>) => currentHarness.useMemo(...args),
  useRef: (...args: Parameters<HookHarness['useRef']>) => currentHarness.useRef(...args),
  useState: (...args: Parameters<HookHarness['useState']>) => currentHarness.useState(...args),
  useSyncExternalStore: (subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => unknown) => {
    const [, setState] = currentHarness.useState(getSnapshot())
    currentHarness.useEffect(() => {
      const unsubscribe = subscribe(() => setState(getSnapshot()))
      return unsubscribe
    }, [])
    return getSnapshot()
  },
}))

mock.module(reactQueryModulePath, () => ({
  __esModule: true,
  default: {},
  useQueries: ({ queries }: { queries: Array<unknown> }) => queries.map(() => ({ data: null, isFetching: false, isLoading: false })),
  useMutation: ({ mutationFn }: { mutationFn: (variables: unknown) => Promise<unknown> }) => ({
    mutateAsync: mutationFn,
  }),
  useQuery: (options: { queryKey: readonly unknown[] }) => {
    const queryKey = options.queryKey

    if (queryKey[0] === 'lcu' && queryKey[1] === 'lobby' && queryKey[2] === 'summoners') {
      return { data: {}, isFetching: false, isLoading: false }
    }

    switch (queryKey[0]) {
      case 'current-summoner':
        return { data: null, isFetching: false, isLoading: false }
      case 'gameflow-phase':
        return { data: renderState.gameflowPhase, isFetching: false, isLoading: false }
      case 'invites':
        return { data: null, isFetching: false, isLoading: false }
      case 'lobby-session':
        return createLobbyQueryResult()
      case 'queue':
        return { data: renderState.queueStatus, isFetching: false, isLoading: false }
      case 'queue-search':
        return { data: null, isFetching: false, isLoading: false }
      case 'sent-invites':
        return { data: null, isFetching: false, isLoading: false }
      default:
        return { data: null, isFetching: false, isLoading: false }
    }
  },
  useQueryClient: () => ({ invalidateQueries: async () => undefined }),
}))

mock.module('@/core/http/ddragon-client', () => ({
  profileIconQueryOptions: (version: string, iconId: number) => ({ queryKey: ['profile-icon', version, iconId] }),
  useLatestDdragonVersion: () => ({ data: '', isSuccess: false }),
}))

mock.module('@/core/lcu/parsers/base', () => ({
  finiteNumber: (value: number) => value,
  parseObjectOrNull: () => null,
}))

mock.module('@/core/lcu/lcu-mutations', () => ({
  useCancelQueue: () => ({ mutateAsync: async () => undefined }),
  useChangeRole: () => ({ mutateAsync: async () => undefined }),
  useInvitePlayer: () => ({ mutateAsync: async () => undefined }),
  useJoinQueue: () => ({ mutateAsync: async () => undefined }),
  useKickPlayer: () => ({ mutateAsync: async () => undefined }),
  usePromotePlayer: () => ({ mutateAsync: async () => undefined }),
}))

mock.module('@/core/lcu/lcu-observer-sync', () => ({
  useLcuObserverSync: () => undefined,
}))

mock.module('zustand/middleware', () => ({
  createJSONStorage: () => undefined,
  persist: (creator: unknown) => creator,
}))

mock.module('@/core/lcu/lcu-queries', () => ({
  createLcuQueryOptions: (descriptor: Descriptor) => descriptor,
  currentSummonerDescriptor: createDescriptor(['current-summoner']),
  gameflowPhaseDescriptor: createDescriptor(['gameflow-phase']),
  invitesDescriptor: createDescriptor(['invites']),
  lobbySessionDescriptor: createDescriptor(['lobby-session']),
  queueDescriptor: createDescriptor(['queue']),
  queueSearchDescriptor: createDescriptor(['queue-search']),
  sentInvitesDescriptor: createDescriptor(['sent-invites']),
}))

mock.module('@/core/lcu/parsers/lobby', () => ({
  parseLobbyInvites: () => [],
  parseLobbySentInvites: () => [],
  readDisplayName: (summoner: { displayName?: string; gameName?: string; name?: string; tagLine?: string }) =>
    summoner.displayName ?? summoner.gameName ?? summoner.name ?? 'Unknown summoner',
}))

mock.module('@/core/lcu/parsers/queue', () => ({
  readDodgePenalty: () => 0,
}))

mock.module('@/core/relay/relay-client-provider', () => ({
  useSharedLCUTransport: () => ({}),
  useSharedRelayClient: () => ({ state: 'CONNECTED' }),
}))

mock.module('@/core/relay/relay-client', () => ({
  RelayClientState: { CONNECTED: 'CONNECTED' },
}))

mock.module('@/core/types/branded', () => ({
  SummonerId: (value: number) => value,
}))

const { useLobby } = await import('../use-lobby')

beforeEach(() => {
  setupSessionStorageMock()
  currentHarness = createHarness()
  renderState = {
    gameflowPhase: 'Lobby',
    lobbyMembers: [memberA, memberB],
    lobbyMode: 'ranked-solo-duo',
    queueStatus: { isSearching: false, queueId: null, searchState: null },
  }
  fakeTimers = installFakeTimers()
})

afterEach(() => {
  currentHarness.cleanupEffects()

  if (fakeTimers) {
    fakeTimers.restore()
    fakeTimers = null
  }
})

describe('useLobby sticky members', () => {
  test('members stays sticky when observer sends empty payload', () => {
    const initial = renderUseLobby()
    expect(initial.members).toEqual([memberA, memberB])

    renderState = { ...renderState, lobbyMembers: [] }

    const afterEmptyPayload = renderUseLobby()
    expect(afterEmptyPayload.members).toEqual([memberA, memberB])
  })

  test("members clears when gameflow phase changes to 'None'", () => {
    renderUseLobby()

    renderState = {
      ...renderState,
      gameflowPhase: 'None',
      lobbyMembers: [],
    }

    const result = renderUseLobby()
    expect(result.members).toEqual([])
  })

  test("members clears when gameflow phase changes to 'ChampSelect'", () => {
    renderUseLobby()

    renderState = {
      ...renderState,
      gameflowPhase: 'ChampSelect',
      lobbyMembers: [],
    }

    const result = renderUseLobby()
    expect(result.members).toEqual([])
  })

  test('members stays sticky indefinitely when lobby data is transiently empty', () => {
    renderUseLobby()

    renderState = { ...renderState, lobbyMembers: [] }

    const stickyResult = renderUseLobby()
    expect(stickyResult.members).toEqual([memberA, memberB])

    const stillSticky = renderUseLobby()
    expect(stillSticky.members).toEqual([memberA, memberB])
  })

  test('members updates normally when non-empty payload arrives after being empty', () => {
    renderUseLobby()

    renderState = { ...renderState, lobbyMembers: [] }

    const stickyWhileEmpty = renderUseLobby()
    expect(stickyWhileEmpty.members).toEqual([memberA, memberB])

    renderState = { ...renderState, lobbyMembers: [memberC] }

    const updated = renderUseLobby()
    expect(updated.members).toEqual([memberC])
  })

  test('mode stays sticky when lobby data is transiently missing during search', () => {
    const initial = renderUseLobby()
    expect(initial.mode).toEqual('ranked-solo-duo')

    renderState = {
      ...renderState,
      lobbyMembers: null,
      lobbyMode: '',
      queueStatus: { isSearching: true, queueId: null, searchState: null },
    }

    const duringSearch = renderUseLobby()
    expect(duringSearch.mode).toEqual('ranked-solo-duo')
  })
})
