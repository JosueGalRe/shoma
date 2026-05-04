import { create } from 'zustand'

export type AramStoreState = {
  bench: number[]
  canReroll: boolean
  error: string | null
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

function normalizeError(error: unknown): string {
  return typeof error === 'string' ? error : 'errors.generic'
}

export const useAramStore = create<AramStore>()((set, get) => ({
  ...initialAramStoreState,
  reroll() {
    if (!get().canReroll || get().rerollCount <= 0) {
      set({ error: 'champSelect.errors.noRerollsAvailable' })
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
      set({ error: 'champSelect.errors.championNotOnBench' })
      return false
    }

    set({ error: null })
    return true
  },
}))
