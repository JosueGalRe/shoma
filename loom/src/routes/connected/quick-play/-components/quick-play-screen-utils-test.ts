import { describe, expect, test } from 'vitest'

import { sortChampions } from './quick-play-screen-utils'

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
