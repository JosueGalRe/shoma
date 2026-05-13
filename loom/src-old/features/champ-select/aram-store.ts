import { LcuHttpMethod, LcuPaths } from '@mimic/protocol-contract'
import { create } from 'zustand'

import { createLCUClient } from '@core/rift/lcu-transport'

export type AramStoreState = {
  cards: number
  rerollsRemaining: number
  benchChampionIds: number[]
  selectedCard: number | null
  error: Error | null
  isLoading: boolean
}

export type RerollCardRequest = () => Promise<void>
export type BenchSwapRequest = (championId: number) => Promise<void>

export type AramStoreActions = {
  useRerollCard: (requestReroll?: RerollCardRequest) => Promise<boolean>
  selectFromBench: (championId: number, requestSwap?: BenchSwapRequest) => Promise<boolean>
  setCards: (cards: number) => void
  setBenchChampionIds: (benchChampionIds: number[]) => void
  setSelectedCard: (selectedCard: number | null) => void
  setError: (error: unknown) => void
}

export type AramStore = AramStoreState & AramStoreActions

const lcuClient = createLCUClient({ connectOnCreate: false })

export const initialAramState: AramStoreState = {
  cards: 0,
  rerollsRemaining: 0,
  benchChampionIds: [],
  selectedCard: null,
  error: null,
  isLoading: false,
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'string') {
    return new Error(error)
  }

  return new Error('ARAM operation failed.')
}

async function defaultRerollCardRequest(): Promise<void> {
  const result = await lcuClient.request(LcuPaths.champSelect.mySelectionReroll, LcuHttpMethod.POST)
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`LCU card draw failed (${result.status}).`)
  }
}

async function defaultBenchSwapRequest(championId: number): Promise<void> {
  const result = await lcuClient.request(LcuPaths.champSelect.benchSwap(championId), LcuHttpMethod.POST)
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`LCU bench swap failed (${result.status}).`)
  }
}

export function createAramStore() {
  return create<AramStore>()((set, get) => ({
    ...initialAramState,

    async useRerollCard(requestReroll = defaultRerollCardRequest) {
      const currentCards = get().cards
      if (currentCards <= 0) {
        set({ error: new Error('No champion cards remaining.') })
        return false
      }

      set({ isLoading: true, error: null })
      try {
        await requestReroll()
        set((state) => ({
          cards: Math.max(0, state.cards - 1),
          rerollsRemaining: Math.max(0, state.rerollsRemaining - 1),
          isLoading: false,
          error: null,
        }))
        return true
      } catch (error) {
        set({ error: normalizeError(error), isLoading: false })
        return false
      }
    },

    async selectFromBench(championId, requestSwap = defaultBenchSwapRequest) {
      set({ isLoading: true, error: null })
      try {
        await requestSwap(championId)
        set({ selectedCard: championId, isLoading: false, error: null })
        return true
      } catch (error) {
        set({ error: normalizeError(error), isLoading: false })
        return false
      }
    },

    setCards(cards) {
      set({ cards, rerollsRemaining: cards, error: null })
    },

    setBenchChampionIds(benchChampionIds) {
      set({ benchChampionIds })
    },

    setSelectedCard(selectedCard) {
      set({ selectedCard })
    },

    setError(error) {
      set({ error: normalizeError(error) })
    },
  }))
}

export const useAramStore = createAramStore()
