import type { ChampionSummary } from '@/core/http/ddragon-client'

import type { SummonerSpellData } from './asset-resolver'

const DEFAULT_LIMIT = 8

type RankedResult<TItem> = {
  item: TItem
  rank: number
  index: number
}

function rankName(query: string, name: string): number | undefined {
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

function rankChampion(query: string, champion: ChampionSummary): number | undefined {
  const nameRank = rankName(query, champion.name)
  if (nameRank !== undefined) {
    return nameRank
  }

  if (champion.title.toLowerCase().includes(query) || champion.key.toLowerCase().includes(query)) {
    return 3
  }

  return undefined
}

function rankedSearch<TItem>(
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
      return rank === undefined ? [] : [{ item, rank, index }]
    })
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .slice(0, limit)
    .map((result) => result.item)
}

export function fuzzySearchChampions(query: string, champions: ChampionSummary[], limit = DEFAULT_LIMIT): ChampionSummary[] {
  return rankedSearch(query, champions, limit, rankChampion)
}

export function fuzzySearchSpells(query: string, spells: SummonerSpellData[], limit = DEFAULT_LIMIT): SummonerSpellData[] {
  return rankedSearch(query, spells, limit, (normalizedQuery, spell) => rankName(normalizedQuery, spell.name))
}
