import { create } from 'zustand'

import { useChampSelectErrorStore } from '@/features/champ-select/champ-select-error-store'

import type { ChampionId } from '@/core/types/branded'

export interface ChampionCard {
  championId: ChampionId
  isBlessed: boolean
  type?: 'crowd-favorite' | 'bravery' | 'normal'
}

export interface AramStoreState {
  bench: ChampionId[]
  canReroll: boolean
  cardBench: ChampionId[]
  cards: ChampionCard[]
  hasLoadedRerolls: boolean
  isLoading: boolean
  rerollCount: number
  selectedCardIndex: number | null
}

export interface AramStoreActions {
  completeBenchSwap: (championId: ChampionId) => void
  drawCards: (championIds: ChampionId[], hasBlessed: boolean) => void
  reroll: () => boolean
  reset: () => void
  selectCard: (index: number) => ChampionCard | null
  setAramState: (state: Pick<AramStoreState, 'bench' | 'canReroll' | 'rerollCount'> & { hasLoadedRerolls?: boolean }) => void
  setLoading: (isLoading: boolean) => void
  swapBench: (championId: ChampionId) => boolean
}

export type AramStore = AramStoreState & AramStoreActions

export const initialAramStoreState: AramStoreState = {
  bench: [],
  canReroll: false,
  cardBench: [],
  cards: [],
  hasLoadedRerolls: false,
  isLoading: false,
  rerollCount: 0,
  selectedCardIndex: null,
}

function shuffleChampionIds(championIds: ChampionId[]): ChampionId[] {
  const uniqueChampionIds = [
    ...new Set(
      championIds.filter((championId) => {
        return championId > 0
      }),
    ),
  ]

  for (let index = uniqueChampionIds.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const currentChampionId = uniqueChampionIds[index]

    uniqueChampionIds[index] = uniqueChampionIds[swapIndex]
    uniqueChampionIds[swapIndex] = currentChampionId
  }

  return uniqueChampionIds
}

export const useAramStore = create<AramStore>()((set, get) => {
  return {
    ...initialAramStoreState,
    completeBenchSwap(championId) {
      set((state) => {
        return {
          bench: state.bench.filter((benchChampionId) => {
            return benchChampionId !== championId
          }),
          cardBench: state.cardBench.filter((benchChampionId) => {
            return benchChampionId !== championId
          }),
        }
      })

      useChampSelectErrorStore.getState().setAramError(null)
    },
    drawCards(championIds, hasBlessed) {
      const cardCount = hasBlessed ? 3 : 2
      const cards = shuffleChampionIds(championIds)
        .slice(0, cardCount)
        .map((championId, index) => {
          return {
            championId,
            isBlessed: hasBlessed && index === 2,
          }
        })

      set({ cards, selectedCardIndex: null })
      useChampSelectErrorStore.getState().setAramError(null)
    },
    reroll() {
      if (!get().canReroll || get().rerollCount <= 0) {
        useChampSelectErrorStore.getState().setAramError('champSelect.errors.noRerollsAvailable')

        return false
      }

      set((state) => {
        return { canReroll: state.rerollCount - 1 > 0, rerollCount: Math.max(0, state.rerollCount - 1) }
      })

      useChampSelectErrorStore.getState().setAramError(null)

      return true
    },
    reset() {
      set({ ...initialAramStoreState })
      useChampSelectErrorStore.getState().setAramError(null)
    },
    selectCard(index) {
      const state = get()
      const selectedCard = state.cards[index]

      if (!selectedCard) {
        useChampSelectErrorStore.getState().setAramError('champSelect.errors.cardNotAvailable')

        return null
      }

      const unchosenChampionIds = state.cards.reduce<ChampionId[]>((acc, card, cardIndex) => {
        if (cardIndex !== index) {
          acc.push(card.championId)
        }

        return acc
      }, [])
      const cardBench = [...new Set([...state.cardBench, ...unchosenChampionIds])]
      const bench = [...new Set([...state.bench, ...cardBench])]

      set({ bench, cardBench, selectedCardIndex: index })
      useChampSelectErrorStore.getState().setAramError(null)

      return selectedCard
    },
    setAramState(state) {
      set((currentState) => {
        return {
          ...state,
          bench: [...new Set([...state.bench, ...currentState.cardBench])],
          hasLoadedRerolls: state.hasLoadedRerolls ?? currentState.hasLoadedRerolls,
        }
      })

      useChampSelectErrorStore.getState().setAramError(null)
    },
    setLoading(isLoading) {
      set({ isLoading })
    },
    swapBench(championId) {
      if (!get().bench.includes(championId)) {
        useChampSelectErrorStore.getState().setAramError('champSelect.errors.championNotOnBench')

        return false
      }

      useChampSelectErrorStore.getState().setAramError(null)

      return true
    },
  }
})
