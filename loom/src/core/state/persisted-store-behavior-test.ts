import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type MemoryStorage = Storage & {
  snapshot: () => Record<string, string>
}

interface CounterStore {
  count: number
  increment: () => void
  reset: () => void
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function serializePersistedState(state: unknown, version: number): string {
  return JSON.stringify({ state, version })
}

async function loadPersistedStoreModule(storage: MemoryStorage) {
  vi.resetModules()
  vi.stubGlobal('localStorage', storage)

  return import('@/core/state/create-persisted-store')
}

describe('createPersistedStore', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('persists, reloads, and hydrates from the same key', async () => {
    const storage = createMemoryStorage()
    const { createPersistedStore } = await loadPersistedStoreModule(storage)

    const createCounterStore = () => {
      return createPersistedStore<CounterStore>(
        (set, get) => {
          return {
            count: 1,
            increment() {
              set({ count: get().count + 1 })
            },
            reset() {
              set({ count: 1 })
            },
          }
        },
        {
          migrate(persistedState) {
            const state = isRecord(persistedState) ? persistedState : undefined

            return {
              count: typeof state?.count === 'number' ? state.count : 1,
            }
          },
          name: 'shoma:counter',
          partialize: (state) => {
            return {
              count: state.count,
            }
          },
          version: 1,
        },
      )
    }

    const firstStore = createCounterStore()

    firstStore.getState().increment()

    expect(storage.getItem('shoma:counter')).not.toBeNull()

    expect(JSON.parse(storage.getItem('shoma:counter')!)).toMatchObject({
      state: { count: 2 },
      version: 1,
    })

    const secondStore = createCounterStore()

    expect(secondStore.getState().count).toBe(2)
  })

  it('migrates version mismatches before hydration', async () => {
    const storage = createMemoryStorage({
      'shoma:counter': serializePersistedState({ count: 7 }, 0),
    })
    const { createPersistedStore } = await loadPersistedStoreModule(storage)
    const migrate = vi.fn((persistedState: unknown, version: number) => {
      expect(version).toBe(0)

      const state = isRecord(persistedState) ? persistedState : undefined

      return {
        count: typeof state?.count === 'number' ? state.count + 1 : 1,
      }
    })

    const store = createPersistedStore<CounterStore>(
      (set) => {
        return {
          count: 1,
          increment() {
            set((state) => {
              return { count: state.count + 1 }
            })
          },
          reset() {
            set({ count: 1 })
          },
        }
      },
      {
        migrate,
        name: 'shoma:counter',
        partialize: (state) => {
          return {
            count: state.count,
          }
        },
        version: 1,
      },
    )

    expect(migrate).toHaveBeenCalledOnce()
    expect(store.getState().count).toBe(8)
  })

  it('resets back to defaults and writes them back', async () => {
    const storage = createMemoryStorage()
    const { createPersistedStore } = await loadPersistedStoreModule(storage)

    const store = createPersistedStore<CounterStore>(
      (set, get) => {
        return {
          count: 1,
          increment() {
            set({ count: get().count + 1 })
          },
          reset() {
            set({ count: 1 })
          },
        }
      },
      {
        migrate(persistedState) {
          const state = isRecord(persistedState) ? persistedState : undefined

          return {
            count: typeof state?.count === 'number' ? state.count : 1,
          }
        },
        name: 'shoma:counter',
        partialize: (state) => {
          return {
            count: state.count,
          }
        },
        version: 1,
      },
    )

    store.getState().increment()
    store.getState().reset()

    expect(store.getState().count).toBe(1)

    expect(JSON.parse(storage.getItem('shoma:counter')!)).toMatchObject({
      state: { count: 1 },
      version: 1,
    })
  })
})
