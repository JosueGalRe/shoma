import { create, type StateCreator } from 'zustand'
import { createJSONStorage, persist, type PersistOptions } from 'zustand/middleware'

type PersistedStoreStorage = 'localStorage' | 'sessionStorage'

type PersistedState<T> = Partial<T>

export type PersistedStoreOptions<T> = Omit<
  PersistOptions<T, PersistedState<T>>,
  'name' | 'partialize' | 'storage' | 'version' | 'migrate'
> & {
  name: `mimic:${string}`
  version: number
  partialize: (state: T) => PersistedState<T>
  storage?: PersistedStoreStorage
  migrate?: PersistOptions<T, PersistedState<T>>['migrate']
}

function getPersistedStorage<T>(storage: PersistedStoreStorage) {
  return createJSONStorage<T>(() => {
    return storage === 'sessionStorage' ? window.sessionStorage : window.localStorage
  })
}

export function createPersistedStore<T>(creator: StateCreator<T>, options: PersistedStoreOptions<T>) {
  const storage = getPersistedStorage<PersistedState<T>>(options.storage ?? 'localStorage')

  return create<T>()(
    persist(creator, {
      ...options,
      storage,
    }),
  )
}
