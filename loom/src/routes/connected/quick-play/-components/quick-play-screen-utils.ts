import type { ChampionSort } from './quick-play-screen-types'

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
