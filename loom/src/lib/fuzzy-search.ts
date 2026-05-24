import type { ChampionSummary } from '@/core/http/ddragon-client'

import type { SummonerSpellData } from './asset-resolver-types'
import { rankChampion, rankSpell, rankedSearch } from './fuzzy-search-utils'

const DEFAULT_LIMIT = 8

export function fuzzySearchChampions(query: string, champions: ChampionSummary[], limit = DEFAULT_LIMIT): ChampionSummary[] {
  return rankedSearch(query, champions, limit, rankChampion)
}

export function fuzzySearchSpells(query: string, spells: SummonerSpellData[], limit = DEFAULT_LIMIT): SummonerSpellData[] {
  return rankedSearch(query, spells, limit, rankSpell)
}
