import { create } from 'zustand'

import type { ChampionId } from '@/core/types/branded'

export type ChampionCard = {
  championId: ChampionId
  isBlessed: boolean
  type?: 'crowd-favorite' | 'bravery' | 'normal'
}

// @knip
export type AramStoreState = {
  bench: ChampionId[]
  canReroll: boolean
  cardBench: ChampionId[]
  cards: ChampionCard[]
  error: string | null
  hasLoadedRerolls: boolean
  isLoading: boolean
  rerollCount: number
  selectedCardIndex: number | null
}

// @knip
export type AramStoreActions = {
  completeBenchSwap: (championId: ChampionId) => void
  drawCards: (championIds: ChampionId[], hasBlessed: boolean) => void
  reroll: () => boolean
  reset: () => void
  selectCard: (index: number) => ChampionCard | null
  setAramState: (state: Pick<AramStoreState, 'bench' | 'canReroll' | 'rerollCount'> & { hasLoadedRerolls?: boolean }) => void
  setError: (error: unknown) => void
  setLoading: (isLoading: boolean) => void
  swapBench: (championId: ChampionId) => boolean
}

export type AramStore = AramStoreState & AramStoreActions

// @knip
export const initialAramStoreState: AramStoreState = {
  bench: [],
  canReroll: false,
  cardBench: [],
  cards: [],
  error: null,
  hasLoadedRerolls: false,
  isLoading: false,
  rerollCount: 0,
  selectedCardIndex: null,
}

function normalizeError(error: unknown): string {
  return typeof error === 'string' ? error : 'errors.generic'
}

function shuffleChampionIds(championIds: ChampionId[]): ChampionId[] {
  const uniqueChampionIds = [...new Set(championIds.filter((championId) => championId > 0))]

  for (let index = uniqueChampionIds.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const currentChampionId = uniqueChampionIds[index]
    uniqueChampionIds[index] = uniqueChampionIds[swapIndex]
    uniqueChampionIds[swapIndex] = currentChampionId
  }

  return uniqueChampionIds
}

// Architecture decision: ARAM stays as a compact volatile store; no slices or persistence.
export const useAramStore = create<AramStore>()((set, get) => ({
  ...initialAramStoreState,
  completeBenchSwap(championId) {
    set((state) => ({
      bench: state.bench.filter((benchChampionId) => benchChampionId !== championId),
      cardBench: state.cardBench.filter((benchChampionId) => benchChampionId !== championId),
      error: null,
    }))
  },
  drawCards(championIds, hasBlessed) {
    const cardCount = hasBlessed ? 3 : 2
    const cards = shuffleChampionIds(championIds).slice(0, cardCount).map((championId, index) => ({
      championId,
      isBlessed: hasBlessed && index === 2,
    }))

    set({ cards, error: null, selectedCardIndex: null })
  },
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
  selectCard(index) {
    const state = get()
    const selectedCard = state.cards[index]

    if (!selectedCard) {
      set({ error: 'champSelect.errors.cardNotAvailable' })
      return null
    }

    const unchosenChampionIds = state.cards.filter((_, cardIndex) => cardIndex !== index).map((card) => card.championId)
    const cardBench = [...new Set([...state.cardBench, ...unchosenChampionIds])]
    const bench = [...new Set([...state.bench, ...cardBench])]

    set({ bench, cardBench, error: null, selectedCardIndex: index })
    return selectedCard
  },
  setAramState(state) {
    set((currentState) => ({
      ...state,
      bench: [...new Set([...state.bench, ...currentState.cardBench])],
      error: null,
      hasLoadedRerolls: state.hasLoadedRerolls ?? currentState.hasLoadedRerolls,
    }))
  },
  setError(error) {
    if (error === null) {
      set({ error: null, isLoading: false })
      return
    }

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
