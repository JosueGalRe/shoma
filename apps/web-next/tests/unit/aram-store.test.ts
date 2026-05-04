import { beforeEach, describe, expect, test } from 'bun:test'

import { useAramStore } from '../../src/features/champ-select/aram-store'

beforeEach(() => {
  useAramStore.getState().reset()
})

describe('aram store', () => {
  test('drawCards creates two cards without a blessed option', () => {
    useAramStore.getState().drawCards([1, 2, 3, 4], false)

    const state = useAramStore.getState()
    expect(state.cards).toHaveLength(2)
    expect(state.cards.every((card) => !card.isBlessed)).toBe(true)
    expect(state.hasBlessedCard).toBe(false)
  })

  test('drawCards marks the third card as blessed when available', () => {
    useAramStore.getState().drawCards([1, 2, 3, 4], true)

    const state = useAramStore.getState()
    expect(state.cards).toHaveLength(3)
    expect(state.cards[0].isBlessed).toBe(false)
    expect(state.cards[1].isBlessed).toBe(false)
    expect(state.cards[2].isBlessed).toBe(true)
    expect(state.hasBlessedCard).toBe(true)
  })

  test('selectCard moves unchosen cards to the bench', () => {
    useAramStore.setState({
      cards: [
        { championId: 11, isBlessed: false },
        { championId: 22, isBlessed: false },
        { championId: 33, isBlessed: true },
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
