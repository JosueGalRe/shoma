import type { ChampionSummary } from '@/core/http/ddragon-client';
import type { RuneTree } from '@/core/http/ddragon-client';

import type { SummonerSpellData } from './asset-resolver-types'

export const DDRAGON_BASE_URL = 'https://ddragon.leagueoflegends.com/cdn'
export const DEFAULT_DDRAGON_VERSION = '15.24.1'

const championIndexes = new WeakMap<readonly ChampionSummary[], Map<number, ChampionSummary>>()
const spellIndexes = new WeakMap<readonly SummonerSpellData[], Map<number, SummonerSpellData>>()
const perkIndexes = new WeakMap<readonly RuneTree[], Map<number, { icon: string; name: string }>>()

export const summonerSpellImageNames: Record<string, string> = {
  Barrier: 'SummonerBarrier.png',
  Cleanse: 'SummonerBoost.png',
  Exhaust: 'SummonerExhaust.png',
  Flash: 'SummonerFlash.png',
  Flee: 'SummonerCherryHold.png',
  Ghost: 'SummonerHaste.png',
  Heal: 'SummonerHeal.png',
  Ignite: 'SummonerDot.png',
  Mark: 'SummonerSnowball.png',
  'Placeholder and Attack-Smite': 'Summoner_UltBookSmitePlaceholder.png',
  Placeholder: 'Summoner_UltBookPlaceholder.png',
  'Poro Toss': 'SummonerPoroThrow.png',
  'To the King!': 'SummonerPoroRecall.png',
  Smite: 'SummonerSmite.png',
  Teleport: 'SummonerTeleport.png',
  Clarity: 'SummonerMana.png',
}

export function championIndex(champions: readonly ChampionSummary[]): Map<number, ChampionSummary> {
  const cached = championIndexes.get(champions)
  if (cached) {
    return cached
  }

  const index = new Map(champions.map((champion) => {return [Number(champion.id), champion]}))
  championIndexes.set(champions, index)
  return index
}

export function spellIndex(spells: readonly SummonerSpellData[]): Map<number, SummonerSpellData> {
  const cached = spellIndexes.get(spells)
  if (cached) {
    return cached
  }

  const index = new Map(spells.map((spell) => {return [Number(spell.id), spell]}))
  spellIndexes.set(spells, index)
  return index
}

export function perkIndex(runes: readonly RuneTree[]): Map<number, { icon: string; name: string }> {
  const cached = perkIndexes.get(runes)
  if (cached) {
    return cached
  }

  const index = new Map<number, { icon: string; name: string }>()
  for (const tree of runes) {
    index.set(Number(tree.id), { icon: tree.icon, name: tree.name })
    for (const slot of tree.slots) {
      for (const rune of slot.runes) {
        index.set(Number(rune.id), { icon: rune.icon, name: rune.name })
      }
    }
  }

  perkIndexes.set(runes, index)
  return index
}

export function ddragonUrl(version: string, path: string): string {
  return `${DDRAGON_BASE_URL}/${version}/${path}`
}

export function ddragonImageUrl(path: string): string {
  return `${DDRAGON_BASE_URL}/img/${path}`
}

export function imageFileName(iconPath: string | undefined): string | undefined {
  return iconPath?.split('/').pop()
}
