import type { SummonerSpellData } from './asset-resolver-types'
import type { RankedResult } from './fuzzy-search-types'
import type { ChampionSummary } from '@/core/http/ddragon-client'

export function rankName(query: string, name: string): number | undefined {
  const normalizedName = name.toLowerCase()

  if (normalizedName === query) {
    return 0
  }

  if (normalizedName.startsWith(query)) {
    return 1
  }

  if (normalizedName.includes(query)) {
    return 2
  }

  return undefined
}

export function rankChampion(query: string, champion: ChampionSummary): number | undefined {
  const nameRank = rankName(query, champion.name)

  if (nameRank !== undefined) {
    return nameRank
  }

  if (champion.title.toLowerCase().includes(query) || champion.key.toLowerCase().includes(query)) {
    return 3
  }

  return undefined
}

export function rankedSearch<TItem>(
  query: string,
  items: readonly TItem[],
  limit: number,
  rankItem: (query: string, item: TItem) => number | undefined,
): TItem[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return []
  }

  return items
    .flatMap((item, index): RankedResult<TItem>[] => {
      const rank = rankItem(normalizedQuery, item)

      return rank === undefined ? [] : [{ index, item, rank }]
    })
    .toSorted((a, b) => {
      return a.rank - b.rank || a.index - b.index
    })
    .slice(0, limit)
    .map((result) => {
      return result.item
    })
}

export function rankSpell(query: string, spell: SummonerSpellData): number | undefined {
  return rankName(query, spell.name)
}
