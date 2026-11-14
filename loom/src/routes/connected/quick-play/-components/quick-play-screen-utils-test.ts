import { describe, expect, test } from 'vitest'

import { assignSpell, sortChampions } from './quick-play-screen-utils'

const CHAMPIONS = [
  { id: 222, name: 'Jinx' },
  { id: 1, name: 'Annie' },
  { id: 25, name: 'Morgana' },
  { id: 103, name: 'Ahri' },
]

function names(champions: readonly { name: string }[]) {
  return champions.map(({ name }) => {
    return name
  })
}

describe('sortChampions', () => {
  const owned = {
    favorites: new Set([222, 25]),
    mastery: new Map([
      [25, 300_000],
      [1, 5000],
    ]),
  }

  test('by name', () => {
    expect(names(sortChampions(CHAMPIONS, 'name', owned))).toEqual(['Ahri', 'Annie', 'Jinx', 'Morgana'])
  })

  test('by mastery, champions without any by name after them', () => {
    expect(names(sortChampions(CHAMPIONS, 'mastery', owned))).toEqual(['Morgana', 'Annie', 'Ahri', 'Jinx'])
  })

  test('favorites first, each group by name', () => {
    expect(names(sortChampions(CHAMPIONS, 'favorite', owned))).toEqual(['Jinx', 'Morgana', 'Ahri', 'Annie'])
  })
})

describe('assignSpell', () => {
  test('lands on the key being picked', () => {
    expect(assignSpell([0, 0], 'first', 4)).toEqual([4, 0])
    expect(assignSpell([4, 7], 'second', 14)).toEqual([4, 14])
  })

  test("the other key's spell swaps keys", () => {
    expect(assignSpell([4, 7], 'first', 7)).toEqual([7, 4])
    expect(assignSpell([4, 0], 'second', 4)).toEqual([0, 4])
  })

  test('the spell already on the key stays', () => {
    expect(assignSpell([4, 7], 'first', 4)).toEqual([4, 7])
  })
})
