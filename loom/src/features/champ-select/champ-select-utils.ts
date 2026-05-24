import type { RuneId } from '@/core/types/branded'

import type { SummonerSpell } from './hooks/use-champ-select'

export function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function championSplashUrl(championKey: string): string | null {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championKey}_0.jpg`
}

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

export function summonerSpellUrl(version: string | undefined, spell: SummonerSpell | null | undefined): string | null {
  if (!spell) {
    return null
  }

  if (!version) {
    return null
  }

  const imageName = summonerSpellImageNames[spell.name]
  if (!imageName) {
    return null
  }

  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${imageName}`
}

export function runeUrl(version: string | undefined, runeId: RuneId | null): string | null {
  if (!version || runeId === null) {
    return null
  }

  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/perk/${runeId}.png`
}

export function runeIconUrl(icon: string | null | undefined): string | null {
  if (!icon) {
    return null
  }

  return `https://ddragon.leagueoflegends.com/cdn/img/${icon}`
}

export function championSkinUrl(championKey: string | null, skinNum: number | null): string | null {
  if (!championKey || skinNum === null) {
    return null
  }

  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championKey}_${skinNum}.jpg`
}
