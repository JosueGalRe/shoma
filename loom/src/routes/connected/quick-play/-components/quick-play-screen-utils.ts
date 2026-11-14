import type { ChampionSort } from './quick-play-screen-types'
import type { RoleSlot } from '@/features/lobby/utils/compute-role-preferences'

// The client's rune descriptions are HTML: line breaks become new lines and every other tag goes
export function toPlainText(html: string): string {
  return new DOMParser().parseFromString(html.replaceAll(/<br\s*\/?>/gi, '\n'), 'text/html').body.textContent ?? ''
}

// The client's champion orders: by name, then most mastery points or favorites first, each by name within
export function sortChampions<Champion extends { id: number; name: string }>(
  champions: readonly Champion[],
  sort: ChampionSort,
  { favorites, mastery }: { favorites: ReadonlySet<number>; mastery: ReadonlyMap<number, number> },
): Champion[] {
  const byName = champions.toSorted((a, b) => {
    return a.name.localeCompare(b.name)
  })

  if (sort === 'mastery') {
    return byName.toSorted((a, b) => {
      return (mastery.get(b.id) ?? 0) - (mastery.get(a.id) ?? 0)
    })
  }

  if (sort === 'favorite') {
    return byName.toSorted((a, b) => {
      return Number(favorites.has(b.id)) - Number(favorites.has(a.id))
    })
  }

  return byName
}

// The Figma numbers the two options I and II
export function toOptionNumeral(option: number): string {
  return option === 0 ? 'I' : 'II'
}

// A spell picked for one key, as Select Position fills a slot: the other key's spell swaps keys with it, and one already on
// This key stays
export function assignSpell(pair: readonly [number, number], slot: RoleSlot, spellId: number): [number, number] {
  const [first, second] = pair

  if (slot === 'first') {
    return spellId === second ? [second, first] : [spellId, second]
  }

  return spellId === first ? [second, first] : [first, spellId]
}
