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

function readStoredRecentCodes(storage: Storage): unknown {
  const storedValue = storage.getItem('shoma:recent-sessions')

  if (!storedValue) {
    return null
  }

  const parsedValue: unknown = JSON.parse(storedValue)

  if (typeof parsedValue !== 'object' || parsedValue === null || !('state' in parsedValue)) {
    return null
  }

  const { state } = parsedValue

  if (typeof state !== 'object' || state === null || !('recentCodes' in state)) {
    return null
  }

  return state.recentCodes
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

  it('stores recent codes with most-recent-first LRU deduplication', async () => {
    const storage = createMemoryStorage()
    const { addRecentSession, getRecentSessions } = await loadRecentSessionsStore(storage)

    addRecentSession('111111')
    addRecentSession('222222')
    addRecentSession('333333')
    addRecentSession('222222')

    expect(getRecentSessions()).toEqual(['222222', '333333', '111111'])
    expect(readStoredRecentCodes(storage)).toEqual(['222222', '333333', '111111'])
  })

  it('keeps at most five recent codes', async () => {
    const storage = createMemoryStorage()
    const { addRecentSession, getRecentSessions } = await loadRecentSessionsStore(storage)

    addRecentSession('111111')
    addRecentSession('222222')
    addRecentSession('333333')
    addRecentSession('444444')
    addRecentSession('555555')
    addRecentSession('666666')

    expect(getRecentSessions()).toEqual(['666666', '555555', '444444', '333333', '222222'])
  })

  it('removes recent codes without touching the rest of the list', async () => {
    const storage = createMemoryStorage()
    const { addRecentSession, getRecentSessions, removeRecentSession } = await loadRecentSessionsStore(storage)

    addRecentSession('111111')
    addRecentSession('222222')
    addRecentSession('333333')
    removeRecentSession('222222')

    expect(getRecentSessions()).toEqual(['333333', '111111'])
  })

  it('ignores invalid codes', async () => {
    const storage = createMemoryStorage()
    const { addRecentSession, getRecentSessions } = await loadRecentSessionsStore(storage)

    addRecentSession('12345')
    addRecentSession('')
    addRecentSession('123456')

    expect(getRecentSessions()).toEqual(['123456'])
  })
})
