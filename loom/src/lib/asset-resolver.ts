import { communityDragonGameDataUrl } from '@/core/http/ddragon'

import {
  championIndex,
  ddragonImageUrl,
  ddragonUrl,
  DEFAULT_DDRAGON_VERSION,
  perkIndex,
  spellIndex,
  summonerSpellImageNames,
} from './asset-resolver-utils'

import type { SummonerSpellData } from './asset-resolver-types'
import type { ChampionSummary, RuneTree } from '@/core/http/ddragon'

export function resolveChampionIcon(
  championId: number,
  champions: ChampionSummary[],
  version = DEFAULT_DDRAGON_VERSION,
): string {
  const champion = championIndex(champions).get(championId)

  if (!champion) {
    return `/lol-game-data/assets/v1/champion-icons/${championId}.png`
  }

  return ddragonUrl(version, `img/champion/${champion.key}.png`)
}

export function resolveChampionSplash(championId: number, champions: ChampionSummary[]): string | undefined {
  const champion = championIndex(champions).get(championId)

  if (!champion) {
    return undefined
  }

  return ddragonImageUrl(`champion/splash/${champion.key}_0.jpg`)
}

// The client's loading screen portrait (308x560), the art of ARAM's cards
export function resolveChampionLoading(championId: number, champions: ChampionSummary[]): string | undefined {
  const champion = championIndex(champions).get(championId)

  return champion ? ddragonImageUrl(`champion/loading/${champion.key}_0.jpg`) : undefined
}

export function resolveSpellIcon(spellId: number, spells: SummonerSpellData[], version = DEFAULT_DDRAGON_VERSION): string {
  const spell = spellIndex(spells).get(spellId)

  if (!spell) {
    return `/lol-game-data/assets/v1/summoner-spells/${spellId}.png`
  }

  // The LCU's icon file names (Summoner_flash.png) aren't Data Dragon's, so its path goes to CommunityDragon
  if (spell.iconPath) {
    return communityDragonGameDataUrl(spell.iconPath)
  }

  const imageName = summonerSpellImageNames[spell.name]

  if (!imageName) {
    return `/lol-game-data/assets/v1/summoner-spells/${spellId}.png`
  }

  return ddragonUrl(version, `img/spell/${imageName}`)
}

export function resolvePerkIcon(perkId: number, runes: RuneTree[]): string {
  const perk = perkIndex(runes).get(perkId)

  if (!perk) {
    return ddragonImageUrl(`perk/${perkId}.png`)
  }

  return ddragonImageUrl(perk.icon)
}

export function getChampionName(championId: number, champions: ChampionSummary[]): string | undefined {
  return championIndex(champions).get(championId)?.name
}

export function getChampionTitle(championId: number, champions: ChampionSummary[]): string | undefined {
  return championIndex(champions).get(championId)?.title
}

export function getSpellName(spellId: number, spells: SummonerSpellData[]): string | undefined {
  return spellIndex(spells).get(spellId)?.name
}

export function getPerkName(perkId: number, runes: RuneTree[]): string | undefined {
  return perkIndex(runes).get(perkId)?.name
}
