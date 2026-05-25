import {
  championIndex,
  ddragonImageUrl,
  ddragonUrl,
  DEFAULT_DDRAGON_VERSION,
  imageFileName,
  perkIndex,
  spellIndex,
  summonerSpellImageNames,
} from './asset-resolver-utils'

import type { SummonerSpellData } from './asset-resolver-types'
import type { ChampionSummary, RuneTree } from '@/core/http/ddragon-client';

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

export function resolveSpellIcon(spellId: number, spells: SummonerSpellData[], version = DEFAULT_DDRAGON_VERSION): string {
  const spell = spellIndex(spells).get(spellId)

  if (!spell) {
    return `/lol-game-data/assets/v1/summoner-spells/${spellId}.png`
  }

  const imageName = imageFileName(spell.iconPath) ?? summonerSpellImageNames[spell.name]

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
