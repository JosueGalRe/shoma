import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type MemoryStorage = Storage & {
  snapshot: () => Record<string, string>
}

function createMemoryStorage(initialEntries: Record<string, string> = {}): MemoryStorage {
  const entries = new Map<string, string>(Object.entries(initialEntries))

  return {
    clear() {
      entries.clear()
    },
    getItem(key) {
      return entries.get(key) ?? null
    },
    key(index) {
      return [...entries.keys()][index] ?? null
    },
    get length() {
      return entries.size
    },
    removeItem(key) {
      entries.delete(key)
    },
    setItem(key, value) {
      entries.set(key, value)
    },
    snapshot() {
      return Object.fromEntries(entries)
    },
  }
}

function readStoredRecentSessions(storage: Storage): unknown {
  const storedValue = storage.getItem('shoma:recent-sessions')

  if (!storedValue) {
    return null
  }

  const parsedValue: unknown = JSON.parse(storedValue)

  if (typeof parsedValue !== 'object' || parsedValue === null || !('state' in parsedValue)) {
    return null
  }

  const { state } = parsedValue

  if (typeof state !== 'object' || state === null || !('recentSessions' in state)) {
    return null
  }

  return state.recentSessions
}

async function loadRecentSessionsStore(storage: Storage) {
  vi.resetModules()
  vi.stubGlobal('localStorage', storage)

  return import('./recent-sessions-store')
}

describe('recent sessions store', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('stores recent sessions with most-recent-first LRU deduplication', async () => {
    const storage = createMemoryStorage()
    const { addRecentSession, getRecentSessions } = await loadRecentSessionsStore(storage)

    addRecentSession('111111')
    addRecentSession('222222')
    addRecentSession('333333')
    addRecentSession('222222')

    const expected = [
      { code: '222222', deviceName: null },
      { code: '333333', deviceName: null },
      { code: '111111', deviceName: null },
    ]

    expect(getRecentSessions()).toEqual(expected)
    expect(readStoredRecentSessions(storage)).toEqual(expected)
  })

  it('keeps at most five recent sessions', async () => {
    const storage = createMemoryStorage()
    const { addRecentSession, getRecentSessions } = await loadRecentSessionsStore(storage)

    addRecentSession('111111')
    addRecentSession('222222')
    addRecentSession('333333')
    addRecentSession('444444')
    addRecentSession('555555')
    addRecentSession('666666')

    expect(getRecentSessions()).toEqual([
      { code: '666666', deviceName: null },
      { code: '555555', deviceName: null },
      { code: '444444', deviceName: null },
      { code: '333333', deviceName: null },
      { code: '222222', deviceName: null },
    ])
  })

  it('removes recent sessions without touching the rest of the list', async () => {
    const storage = createMemoryStorage()
    const { addRecentSession, getRecentSessions, removeRecentSession } = await loadRecentSessionsStore(storage)

    addRecentSession('111111')
    addRecentSession('222222')
    addRecentSession('333333')
    removeRecentSession('222222')

    expect(getRecentSessions()).toEqual([
      { code: '333333', deviceName: null },
      { code: '111111', deviceName: null },
    ])
  })

  it('ignores invalid codes', async () => {
    const storage = createMemoryStorage()
    const { addRecentSession, getRecentSessions } = await loadRecentSessionsStore(storage)

    addRecentSession('12345')
    addRecentSession('')
    addRecentSession('123456')

    expect(getRecentSessions()).toEqual([{ code: '123456', deviceName: null }])
  })

  it('sets the device name for an existing session', async () => {
    const storage = createMemoryStorage()
    const { addRecentSession, getRecentSessions, setRecentSessionDeviceName } = await loadRecentSessionsStore(storage)

    addRecentSession('111111')
    setRecentSessionDeviceName('111111', '  GAMING-PC  ')
    setRecentSessionDeviceName('999999', 'UNKNOWN-PC')
    setRecentSessionDeviceName('111111', '   ')

    expect(getRecentSessions()).toEqual([{ code: '111111', deviceName: 'GAMING-PC' }])
  })

  it('keeps the known device name when a session is re-added', async () => {
    const storage = createMemoryStorage()
    const { addRecentSession, getRecentSessions, setRecentSessionDeviceName } = await loadRecentSessionsStore(storage)

    addRecentSession('111111')
    setRecentSessionDeviceName('111111', 'GAMING-PC')
    addRecentSession('222222')
    addRecentSession('111111')

    expect(getRecentSessions()).toEqual([
      { code: '111111', deviceName: 'GAMING-PC' },
      { code: '222222', deviceName: null },
    ])
  })

  it('migrates the v1 plain-code list into sessions without device names', async () => {
    const storage = createMemoryStorage({
      'shoma:recent-sessions': JSON.stringify({ state: { recentCodes: ['111111', 'bad'] }, version: 1 }),
    })
    const { getRecentSessions } = await loadRecentSessionsStore(storage)

    expect(getRecentSessions()).toEqual([{ code: '111111', deviceName: null }])
  })
})
