import { create, type StateCreator } from 'zustand'
import {
  createJSONStorage,
  persist,
  type PersistOptions,
  type PersistStorage,
} from 'zustand/middleware'

type PersistedStoreStorage = 'localStorage' | 'sessionStorage'

type PersistedState<T> = Partial<T>
type PersistedMigration<T> = NonNullable<PersistOptions<T, PersistedState<T>>['migrate']>

export function hasLocalStorage(): boolean {
  try {
    return (
      typeof globalThis.localStorage !== 'undefined' &&
      typeof globalThis.localStorage.getItem === 'function' &&
      typeof globalThis.localStorage.setItem === 'function' &&
      typeof globalThis.localStorage.removeItem === 'function'
    )
  } catch {
    return false
  }
}

export function hasSessionStorage(): boolean {
  try {
    return (
      typeof globalThis.sessionStorage !== 'undefined' &&
      typeof globalThis.sessionStorage.getItem === 'function' &&
      typeof globalThis.sessionStorage.setItem === 'function' &&
      typeof globalThis.sessionStorage.removeItem === 'function'
    )
  } catch {
    return false
  }
}

export function readLegacyLocalStorageValue(key: string): string | null {
  try {
    return hasLocalStorage() ? globalThis.localStorage.getItem(key) : null
  } catch {
    return null
  }
}

export function readLegacySessionStorageValue(key: string): string | null {
  try {
    return hasSessionStorage() ? globalThis.sessionStorage.getItem(key) : null
  } catch {
    return null
  }
}

export type PersistedStoreOptions<T> = Omit<
  PersistOptions<T, PersistedState<T>>,
  'name' | 'partialize' | 'storage' | 'version' | 'migrate'
> & {
  name: `mimic:${string}`
  version: number
  partialize: (state: T) => PersistedState<T>
  storage?: PersistedStoreStorage
  migrate: PersistedMigration<T>
}

function getPersistedStorage<T>(storage: PersistedStoreStorage): PersistStorage<T> | undefined {
  try {
    if (typeof window === 'undefined') {
      return undefined
    }

    const storageInstance = storage === 'sessionStorage' ? window.sessionStorage : window.localStorage

    return createJSONStorage<T>(() => storageInstance)
  } catch {
    return undefined
  }
}

function withInitialMigration<T>(
  storage: PersistStorage<PersistedState<T>> | undefined,
  options: PersistedStoreOptions<T>,
): PersistStorage<PersistedState<T>> | undefined {
  if (!storage) {
    return storage
  }

  return {
    ...storage,
    getItem(name) {
      const storedValue = storage.getItem(name)

      if (storedValue instanceof Promise) {
        return storedValue.then((value) => value ?? migrateInitialState(options))
      }

      return storedValue ?? migrateInitialState(options)
    },
  }
}

function migrateInitialState<T>(
  options: PersistedStoreOptions<T>,
):
  | { state: PersistedState<T>; version: number }
  | Promise<{ state: PersistedState<T>; version: number }> {
  const migratedState = options.migrate(undefined, 0)

  if (migratedState instanceof Promise) {
    return migratedState.then((state) => ({ state, version: options.version }))
  }

  return { state: migratedState, version: options.version }
}

export function createPersistedStore<T>(creator: StateCreator<T>, options: PersistedStoreOptions<T>) {
  const storage = withInitialMigration(
    getPersistedStorage<PersistedState<T>>(options.storage ?? 'localStorage'),
    options,
  )

  return create<T>()(
    persist(creator, {
      ...options,
      storage,
    }),
  )
}
