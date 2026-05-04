import { create } from 'zustand'

export type ChampionCard = {
  championId: number
  isBlessed: boolean
}

export type AramStoreState = {
  bench: number[]
  canReroll: boolean
  cards: ChampionCard[]
  error: string | null
  hasBlessedCard: boolean
  isLoading: boolean
  rerollCount: number
  selectedCardIndex: number | null
}

export type AramStoreActions = {
  drawCards: (championIds: number[], hasBlessed: boolean) => void
  reroll: () => boolean
  reset: () => void
  selectCard: (index: number) => ChampionCard | null
  setAramState: (state: Pick<AramStoreState, 'bench' | 'canReroll' | 'rerollCount'>) => void
  setError: (error: unknown) => void
  setLoading: (isLoading: boolean) => void
  swapBench: (championId: number) => boolean
}

export type AramStore = AramStoreState & AramStoreActions

export const initialAramStoreState: AramStoreState = {
  bench: [],
  canReroll: false,
  cards: [],
  error: null,
  hasBlessedCard: false,
  isLoading: false,
  rerollCount: 0,
  selectedCardIndex: null,
}

function normalizeError(error: unknown): string {
  return typeof error === 'string' ? error : 'errors.generic'
}

function shuffleChampionIds(championIds: number[]): number[] {
  const uniqueChampionIds = [...new Set(championIds.filter((championId) => championId > 0))]

  for (let index = uniqueChampionIds.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const currentChampionId = uniqueChampionIds[index]
    uniqueChampionIds[index] = uniqueChampionIds[swapIndex]
    uniqueChampionIds[swapIndex] = currentChampionId
  }

  return uniqueChampionIds
}

export const useAramStore = create<AramStore>()((set, get) => ({
  ...initialAramStoreState,
  drawCards(championIds, hasBlessed) {
    const cardCount = hasBlessed ? 3 : 2
    const cards = shuffleChampionIds(championIds).slice(0, cardCount).map((championId, index) => ({
      championId,
      isBlessed: hasBlessed && index === 2,
    }))

    set({ cards, error: null, hasBlessedCard: cards.some((card) => card.isBlessed), selectedCardIndex: null })
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
    const bench = [...new Set([...state.bench, ...unchosenChampionIds])]

    set({ bench, error: null, selectedCardIndex: index })
    return selectedCard
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
