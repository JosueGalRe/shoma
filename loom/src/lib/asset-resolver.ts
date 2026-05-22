import type { ChampionSummary, RuneTree } from '@/core/http/ddragon-client'
import type { SummonerSpell as LcuSummonerSpell } from '@/core/lcu/lcu-queries'

export type SummonerSpellData = LcuSummonerSpell

const DDRAGON_BASE_URL = 'https://ddragon.leagueoflegends.com/cdn'
const DEFAULT_DDRAGON_VERSION = '15.24.1'

const championIndexes = new WeakMap<readonly ChampionSummary[], Map<number, ChampionSummary>>()
const spellIndexes = new WeakMap<readonly SummonerSpellData[], Map<number, SummonerSpellData>>()
const perkIndexes = new WeakMap<readonly RuneTree[], Map<number, { icon: string; name: string }>>()

const summonerSpellImageNames: Record<string, string> = {
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

function championIndex(champions: readonly ChampionSummary[]): Map<number, ChampionSummary> {
  const cached = championIndexes.get(champions)
  if (cached) {
    return cached
  }

  const index = new Map(champions.map((champion) => [Number(champion.id), champion]))
  championIndexes.set(champions, index)
  return index
}

function spellIndex(spells: readonly SummonerSpellData[]): Map<number, SummonerSpellData> {
  const cached = spellIndexes.get(spells)
  if (cached) {
    return cached
  }

  const index = new Map(spells.map((spell) => [Number(spell.id), spell]))
  spellIndexes.set(spells, index)
  return index
}

function perkIndex(runes: readonly RuneTree[]): Map<number, { icon: string; name: string }> {
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

function ddragonUrl(version: string, path: string): string {
  return `${DDRAGON_BASE_URL}/${version}/${path}`
}

function ddragonImageUrl(path: string): string {
  return `${DDRAGON_BASE_URL}/img/${path}`
}

function imageFileName(iconPath: string | undefined): string | undefined {
  return iconPath?.split('/').pop()
}

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
