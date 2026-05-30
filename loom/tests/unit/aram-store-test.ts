import { beforeEach, describe, expect, test } from 'vitest'

import { ChampionId } from '../../src/core/types/branded'
import { useAramStore } from '../../src/features/champ-select/aram-store'

beforeEach(() => {
  useAramStore.getState().reset()
})

describe('aram store', () => {
  test('drawCards creates two cards without a blessed option', () => {
    useAramStore.getState().drawCards([ChampionId(1), ChampionId(2), ChampionId(3), ChampionId(4)], false)

    const state = useAramStore.getState()

    expect(state.cards).toHaveLength(2)
    expect(state.cards.every((card) => {return !card.isBlessed})).toBe(true)
    expect(state.cards.some((card) => {return card.isBlessed})).toBe(false)
  })

  test('drawCards marks the third card as blessed when available', () => {
    useAramStore.getState().drawCards([ChampionId(1), ChampionId(2), ChampionId(3), ChampionId(4)], true)

    const state = useAramStore.getState()

    expect(state.cards).toHaveLength(3)
    expect(state.cards[0].isBlessed).toBe(false)
    expect(state.cards[1].isBlessed).toBe(false)
    expect(state.cards[2].isBlessed).toBe(true)
    expect(state.cards.some((card) => {return card.isBlessed})).toBe(true)
  })

  test('selectCard moves unchosen cards to the bench', () => {
    useAramStore.setState({
      cards: [
        { championId: ChampionId(11), isBlessed: false },
        { championId: ChampionId(22), isBlessed: false },
        { championId: ChampionId(33), isBlessed: true },
      ],
    })

    const selectedCard = useAramStore.getState().selectCard(1)

    expect(selectedCard).toEqual({ championId: 22, isBlessed: false })

    expect(useAramStore.getState()).toMatchObject({
      bench: [11, 33],
      selectedCardIndex: 1,
    })
  })
})
