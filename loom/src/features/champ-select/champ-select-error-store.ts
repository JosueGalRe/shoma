import { create } from 'zustand'

import { normalizeError } from '@/features/champ-select/champ-select-actions'

export type ChampSelectErrorStoreState = {
  aramError: string | null
  error: string | null
}

export type ChampSelectErrorStoreActions = {
  reset: () => void
  setAramError: (error: unknown) => void
  setError: (error: unknown) => void
}

export type ChampSelectErrorStore = ChampSelectErrorStoreState & ChampSelectErrorStoreActions

export const initialChampSelectErrorStoreState: ChampSelectErrorStoreState = {
  aramError: null,
  error: null,
}

export const useChampSelectErrorStore = create<ChampSelectErrorStore>()((set) => {
  return {
    ...initialChampSelectErrorStoreState,
    reset() {
      set({ ...initialChampSelectErrorStoreState })
    },
    setAramError(error) {
      set({ aramError: error === null ? null : normalizeError(error) })
    },
    setError(error) {
      set({ error: error === null ? null : normalizeError(error) })
    },
  }
})
