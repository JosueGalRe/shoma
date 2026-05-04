import { create } from 'zustand'

export type AramStoreState = {
  bench: number[]
  canReroll: boolean
  error: Error | null
  isLoading: boolean
  rerollCount: number
}

export type AramStoreActions = {
  reroll: () => boolean
  reset: () => void
  setAramState: (state: Pick<AramStoreState, 'bench' | 'canReroll' | 'rerollCount'>) => void
  setError: (error: unknown) => void
  setLoading: (isLoading: boolean) => void
  swapBench: (championId: number) => boolean
}

export type AramStore = AramStoreState & AramStoreActions

export const initialAramStoreState: AramStoreState = {
  bench: [],
  canReroll: false,
  error: null,
  isLoading: false,
  rerollCount: 0,
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  return new Error(typeof error === 'string' ? error : 'ARAM operation failed.')
}

export const useAramStore = create<AramStore>()((set, get) => ({
  ...initialAramStoreState,
  reroll() {
    if (!get().canReroll || get().rerollCount <= 0) {
      set({ error: new Error('No rerolls available.') })
      return false
    }

    set((state) => ({ canReroll: state.rerollCount - 1 > 0, error: null, rerollCount: Math.max(0, state.rerollCount - 1) }))
    return true
  },
  reset() {
    set({ ...initialAramStoreState })
  },
  setAramState(state) {
    set({ ...state, error: null })
  },
  setError(error) {
    set({ error: normalizeError(error), isLoading: false })
  },
  setLoading(isLoading) {
    set({ isLoading })
  },
  swapBench(championId) {
    if (!get().bench.includes(championId)) {
      set({ error: new Error('Champion is not available on the ARAM bench.') })
      return false
    }

    set({ error: null })
    return true
  },
}))
