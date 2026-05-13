import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

type NodeLike = {
  props: Record<string, unknown>
  type: string | symbol | ((props: Record<string, unknown>) => NodeLike | NodeLike[] | null)
}

type LobbyState = {
  actionError: string | null
  actions: {
    changeRole: () => void
    invitePlayer: () => void
    joinQueue: () => void
    kickPlayer: () => void
    leaveQueue: () => void
    promotePlayer: () => void
  }
  canInvite: boolean
  dodgePenalty: number
  invites: unknown[]
  isActionPending: boolean
  isConnected: boolean
  isLoading: boolean
  isLobbyFetching: boolean
  isLobbyLoading: boolean
  isOwner: boolean
  members: Array<{ name: string }>
  mode: string
  queueStatus: {
    isSearching: boolean
  }
  rolePreferences: {
    first: string
    second: string
  }
  sentInvites: unknown[]
}

type StateSlot = {
  kind: 'state'
  value: unknown
}

type RefSlot = {
  kind: 'ref'
  value: { current: unknown }
}

type EffectSlot = {
  cleanup?: () => void
  deps: readonly unknown[] | null
  kind: 'effect'
}

type HookSlot = StateSlot | RefSlot | EffectSlot

type TimerTask = {
  callback: () => void
  runAt: number
}

const originalSetTimeout = globalThis.setTimeout
const originalClearTimeout = globalThis.clearTimeout

let currentLobbyState: LobbyState
let currentGameflowPhase: string | null
let currentTree: NodeLike | NodeLike[] | null = null
let nextTimerId = 1
let currentTime = 0
let timerTasks = new Map<number, TimerTask>()
let hookSlots: HookSlot[] = []
let hookIndex = 0
let renderDirty = false
let queuedEffects: Array<() => void> = []

function createNode(type: NodeLike['type'], props: Record<string, unknown> = {}) {
  return {
    props,
    type,
  }
}

function createNoopLobbyState(overrides: Partial<LobbyState> = {}): LobbyState {
  const baseActions = {
    changeRole: () => undefined,
    invitePlayer: () => undefined,
    joinQueue: () => undefined,
    kickPlayer: () => undefined,
    leaveQueue: () => undefined,
    promotePlayer: () => undefined,
  }

  return {
    actionError: null,
    actions: {
      ...baseActions,
      ...overrides.actions,
    },
    canInvite: true,
    dodgePenalty: 0,
    invites: [],
    isActionPending: false,
    isConnected: true,
    isLoading: false,
    isLobbyFetching: false,
    isLobbyLoading: false,
    isOwner: true,
    members: [],
    mode: 'draft',
    queueStatus: {
      isSearching: false,
      ...overrides.queueStatus,
    },
    rolePreferences: {
      first: 'TOP',
      second: 'JUNGLE',
      ...overrides.rolePreferences,
    },
    sentInvites: [],
    ...overrides,
  }
}

function createMockBlock(testId: string) {
  return () => createNode('div', { 'data-testid': testId })
}

function areDepsEqual(previous: readonly unknown[] | null, next: readonly unknown[] | undefined) {
  if (previous === null || next === undefined) {
    return false
  }

  if (previous.length !== next.length) {
    return false
  }

  for (let index = 0; index < previous.length; index += 1) {
    if (!Object.is(previous[index], next[index])) {
      return false
    }
  }

  return true
}

function useState<T>(initialValue: T | (() => T)): readonly [T, (next: T | ((previous: T) => T)) => void] {
  const slotIndex = hookIndex
  const slot = hookSlots[slotIndex] as StateSlot | undefined

  if (!slot) {
    const value = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue
    hookSlots[slotIndex] = { kind: 'state', value }
  }

  const current = hookSlots[slotIndex] as StateSlot
  hookIndex += 1

  const setState = (next: T | ((previous: T) => T)) => {
    const previous = current.value as T
    const value = typeof next === 'function' ? (next as (previous: T) => T)(previous) : next

    if (!Object.is(previous, value)) {
      current.value = value
      renderDirty = true
    }
  }

  return [current.value as T, setState]
}

function useRef<T>(initialValue: T): { current: T } {
  const slotIndex = hookIndex
  const slot = hookSlots[slotIndex] as RefSlot | undefined

  if (!slot) {
    hookSlots[slotIndex] = { kind: 'ref', value: { current: initialValue } }
  }

  hookIndex += 1
  return (hookSlots[slotIndex] as RefSlot).value as { current: T }
}

function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]) {
  const slotIndex = hookIndex
  const slot = hookSlots[slotIndex] as EffectSlot | undefined
  const nextDeps = deps ?? null
  const shouldRun = !slot || !areDepsEqual(slot.deps, deps)

  if (!slot) {
    hookSlots[slotIndex] = { cleanup: undefined, deps: nextDeps, kind: 'effect' }
  }

  if (shouldRun && slot?.cleanup) {
    slot.cleanup()
    slot.cleanup = undefined
  }

  if (shouldRun) {
    queuedEffects.push(() => {
      const cleanup = effect()
      const currentSlot = hookSlots[slotIndex] as EffectSlot
      currentSlot.deps = nextDeps
      currentSlot.cleanup = typeof cleanup === 'function' ? cleanup : undefined
    })
  }

  hookIndex += 1
}

function runEffects() {
  const effects = queuedEffects
  queuedEffects = []

  for (const effect of effects) {
    effect()
  }
}

function resolveNode(node: NodeLike | NodeLike[] | string | number | null | undefined | boolean): NodeLike | NodeLike[] | string | number | null {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return null
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return node
  }

  if (Array.isArray(node)) {
    return node.map(child => resolveNode(child)) as NodeLike[]
  }

  if (typeof node.type === 'function') {
    return resolveNode(node.type(node.props))
  }

  if (node.type === Fragment) {
    return resolveNode(node.props.children as NodeLike | NodeLike[] | string | number | null | undefined | boolean)
  }

  const children = node.props.children as NodeLike | NodeLike[] | string | number | null | undefined | boolean

  return {
    props: {
      ...node.props,
      children: resolveNode(children),
    },
    type: node.type,
  }
}

function advanceTimersByTime(ms: number) {
  const targetTime = currentTime + ms

  while (true) {
    let nextTimerEntry: [number, TimerTask] | null = null

    for (const entry of timerTasks.entries()) {
      if (entry[1].runAt > targetTime) {
        continue
      }

      if (!nextTimerEntry || entry[1].runAt < nextTimerEntry[1].runAt) {
        nextTimerEntry = entry
      }
    }

    if (!nextTimerEntry) {
      break
    }

    timerTasks.delete(nextTimerEntry[0])
    currentTime = nextTimerEntry[1].runAt
    nextTimerEntry[1].callback()
  }

  currentTime = targetTime
}

function installFakeTimers() {
  nextTimerId = 1
  currentTime = 0
  timerTasks = new Map()

  Object.defineProperty(globalThis, 'setTimeout', {
    configurable: true,
    value: ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      if (typeof handler !== 'function') {
        throw new Error('string timer handlers are not supported in tests')
      }

      const id = nextTimerId++
      const runAt = currentTime + (timeout ?? 0)

      timerTasks.set(id, {
        callback: () => {
          handler(...args)
        },
        runAt,
      })

      return id as unknown as ReturnType<typeof setTimeout>
    }) as unknown as typeof setTimeout,
    writable: true,
  })

  Object.defineProperty(globalThis, 'clearTimeout', {
    configurable: true,
    value: ((timeoutId: ReturnType<typeof setTimeout>) => {
      timerTasks.delete(Number(timeoutId as unknown as number))
    }) as unknown as typeof clearTimeout,
    writable: true,
  })
}

function restoreTimers() {
  Object.defineProperty(globalThis, 'setTimeout', {
    configurable: true,
    value: originalSetTimeout,
    writable: true,
  })

  Object.defineProperty(globalThis, 'clearTimeout', {
    configurable: true,
    value: originalClearTimeout,
    writable: true,
  })
}

function cleanupRenderedRoute() {
  for (const slot of hookSlots) {
    if (slot.kind === 'effect' && slot.cleanup) {
      slot.cleanup()
    }
  }

  hookSlots = []
  hookIndex = 0
  queuedEffects = []
  currentTree = null
}

function findByTestId(node: NodeLike | NodeLike[] | string | number | null, testId: string): NodeLike | null {
  if (node === null || typeof node === 'string' || typeof node === 'number') {
    return null
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findByTestId(child, testId)
      if (match) {
        return match
      }
    }

    return null
  }

  if (node.props['data-testid'] === testId) {
    return node
  }

  return findByTestId(node.props.children as NodeLike | NodeLike[] | string | number | null, testId)
}

function expectVisible(testId: string) {
  expect(findByTestId(currentTree, testId)).not.toBeNull()
}

function expectHidden(testId: string) {
  expect(findByTestId(currentTree, testId)).toBeNull()
}

const Fragment = Symbol.for('fragment')

mock.module('react', () => ({
  __esModule: true,
  createContext: () => ({
    Consumer: ({ children }: { children?: (value: Record<string, unknown>) => NodeLike | null }) => (children ? children({}) : null),
    Provider: ({ children }: { children?: NodeLike | NodeLike[] | null }) => children ?? null,
  }),
  createElement: createNode,
  Fragment,
  default: {
    createContext: () => ({
      Consumer: ({ children }: { children?: (value: Record<string, unknown>) => NodeLike | null }) => (children ? children({}) : null),
      Provider: ({ children }: { children?: NodeLike | NodeLike[] | null }) => children ?? null,
    }),
    createElement: createNode,
    Fragment,
  },
  useEffect,
  useRef,
  useState,
}))

mock.module('react/jsx-runtime', () => ({
  Fragment,
  jsx: (type: NodeLike['type'], props?: Record<string, unknown>) => createNode(type, props ?? {}),
  jsxs: (type: NodeLike['type'], props?: Record<string, unknown>) => createNode(type, props ?? {}),
}))

mock.module('react/jsx-dev-runtime', () => ({
  Fragment,
  jsxDEV: (type: NodeLike['type'], props?: Record<string, unknown>) => createNode(type, props ?? {}),
}))

mock.module('lucide-react', () => ({
  Award: () => createNode('svg', { 'data-testid': 'icon-award' }),
  Mail: () => createNode('svg', { 'data-testid': 'icon-mail' }),
}))

mock.module('@tanstack/react-router', () => ({
  createFileRoute: () => (config: Record<string, unknown>) => ({
    options: config,
  }),
}))

mock.module('/home/josuegalre/projects/mimic/node_modules/.bun/@tanstack+react-query@5.100.8+3f10a4be4e334a9b/node_modules/@tanstack/react-query/build/modern/index.js', () => ({
  __esModule: true,
  default: {},
  useQuery: () => ({
    data: currentGameflowPhase,
    error: null,
    isLoading: false,
  }),
}))

mock.module('@/components/ui', () => ({
  BottomNav: createMockBlock('bottom-nav'),
  Button: createMockBlock('button'),
  Card: createMockBlock('card'),
  CardContent: createMockBlock('card-content'),
  CardHeader: createMockBlock('card-header'),
  CardTitle: createMockBlock('card-title'),
}))

mock.module('@/core/lcu/lcu-queries', () => ({
  createLcuQueryOptions: () => ({}),
  currentSummonerDescriptor: {},
  gameQueuesDescriptor: {},
  gameflowPhaseDescriptor: {},
  invitesDescriptor: {},
  lobbySessionDescriptor: {},
  platformConfigDescriptor: () => ({}),
  queueDescriptor: {},
  queueSearchDescriptor: {},
  sentInvitesDescriptor: {},
}))

mock.module('@/core/relay/relay-client-provider', () => ({
  useSharedLCUTransport: () => ({}),
}))

mock.module('@/core/relay/route-loader', () => ({
  ensureLcuRouteData: async () => undefined,
}))

mock.module('@/core/state/ui-store', () => {
  const state = {
    isLobbyInviteOverlayOpen: false,
    isLobbyInviteSheetOpen: false,
    isLobbyRoleSheetOpen: false,
    setLobbyInviteOverlayOpen: () => undefined,
    setLobbyInviteSheetOpen: () => undefined,
    setLobbyRoleSheetOpen: () => undefined,
  }

  return {
    uiStoreSelectors: {
      isLobbyInviteOverlayOpen: (store: typeof state) => store.isLobbyInviteOverlayOpen,
      isLobbyInviteSheetOpen: (store: typeof state) => store.isLobbyInviteSheetOpen,
      isLobbyRoleSheetOpen: (store: typeof state) => store.isLobbyRoleSheetOpen,
      setLobbyInviteOverlayOpen: (store: typeof state) => store.setLobbyInviteOverlayOpen,
      setLobbyInviteSheetOpen: (store: typeof state) => store.setLobbyInviteSheetOpen,
      setLobbyRoleSheetOpen: (store: typeof state) => store.setLobbyRoleSheetOpen,
    },
    useUiStore: <T,>(selector: (store: typeof state) => T) => selector(state),
  }
})

mock.module('@/features/diagnostics/eligibility-errors', () => ({
  translateLcuError: () => null,
}))

mock.module('@/features/lobby', () => ({
  useLobby: () => currentLobbyState,
}))

mock.module('@/features/lobby/components/lobby-creation-content', () => ({
  LobbyCreationContent: () => createNode('div', { 'data-testid': 'lobby-creation-content' }),
}))

mock.module('@/features/modes/mode-engine', () => ({
  getModeNameKey: () => 'mode.name',
  getModeRules: () => ({ requiresRoleSelection: false }),
}))

mock.module('@/features/swiftplay/swiftplay-store', () => ({
  selectSwiftplayIsValid: () => true,
  useSwiftplayStore: (selector: (state: { isValid: boolean }) => boolean) => selector({ isValid: true }),
}))

mock.module('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

mock.module('../-components/lobby-header', () => ({
  LobbyHeader: () => createNode('div', { 'data-testid': 'lobby-header' }),
}))

mock.module('../-components/lobby-queue-card', () => ({
  LobbyQueueCard: () => createNode('div', { 'data-testid': 'lobby-queue-card' }),
}))

mock.module('../-components/lobby-members-strip', () => ({
  LobbyMembersStrip: () => createNode('div', { 'data-testid': 'lobby-members-strip' }),
}))

mock.module('../-components/lobby-bottom-sheets', () => ({
  LobbyBottomSheets: () => createNode('div', { 'data-testid': 'lobby-bottom-sheets' }),
}))

mock.module('../-components/lobby-invite-overlay', () => ({
  LobbyInviteOverlay: () => createNode('div', { 'data-testid': 'lobby-invite-overlay' }),
}))

const { Route } = await import('../route')
const LobbyRouteComponent = Route.options.component ?? (() => null)

describe('lobby route grace period', () => {
  beforeEach(() => {
    currentGameflowPhase = 'Lobby'
    currentLobbyState = createNoopLobbyState()
    installFakeTimers()
    cleanupRenderedRoute()
  })

  afterEach(() => {
    cleanupRenderedRoute()
    restoreTimers()
    timerTasks.clear()
  })

  test('keeps lobby visible during the grace period after cancel', () => {
    currentLobbyState = createNoopLobbyState({
      queueStatus: { isSearching: true },
    })

    renderRoute()

    expectVisible('lobby-header')
    expectHidden('lobby-creation-content')

    currentLobbyState = createNoopLobbyState({
      queueStatus: { isSearching: false },
    })

    renderRoute()

    expectVisible('lobby-header')
    expectHidden('lobby-creation-content')

    advanceTimersByTime(2_999)
    renderRoute()

    expectVisible('lobby-header')
    expectHidden('lobby-creation-content')
  })

  test('shows LobbyCreationContent after the 3000ms grace period expires', () => {
    currentLobbyState = createNoopLobbyState({
      queueStatus: { isSearching: true },
    })

    renderRoute()

    currentLobbyState = createNoopLobbyState({
      queueStatus: { isSearching: false },
    })

    renderRoute()

    advanceTimersByTime(3_000)
    renderRoute()

    expectHidden('lobby-header')
    expectVisible('lobby-creation-content')
  })

  test('shows LobbyCreationContent immediately when no prior lobby existed', () => {
    currentLobbyState = createNoopLobbyState({
      queueStatus: { isSearching: false },
    })

    renderRoute()

    expectHidden('lobby-header')
    expectVisible('lobby-creation-content')
  })

  test("clears the grace period immediately when gameflow phase changes to 'None'", () => {
    currentLobbyState = createNoopLobbyState({
      queueStatus: { isSearching: true },
    })

    renderRoute()

    currentLobbyState = createNoopLobbyState({
      queueStatus: { isSearching: false },
    })

    renderRoute()

    expectVisible('lobby-header')
    expectHidden('lobby-creation-content')

    currentGameflowPhase = 'None'
    renderRoute()

    expectHidden('lobby-header')
    expectVisible('lobby-creation-content')

    advanceTimersByTime(3_000)
    renderRoute()

    expectHidden('lobby-header')
    expectVisible('lobby-creation-content')
  })
})

function renderRoute() {
  let iterations = 0

  do {
    renderDirty = false
    hookIndex = 0
    queuedEffects = []
    currentTree = resolveNode(LobbyRouteComponent({})) as NodeLike | NodeLike[] | null
    runEffects()
    iterations += 1
  } while (renderDirty && iterations < 20)
}
