import type { SummonerSpell } from '@/core/lcu/queries/summoner'

export function championSplashUrl(championKey: string): string | null {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championKey}_0.jpg`
}

// LCU asset paths ("/lol-game-data/assets/ASSETS/...") mirror onto CommunityDragon's CDN.
export function lcuAssetUrl(lcuAssetPath: string | null | undefined): string | null {
  if (!lcuAssetPath) {
    return null
  }

  const assetsIndex = lcuAssetPath.toUpperCase().indexOf('/ASSETS/')

  if (assetsIndex === -1) {
    return null
  }

  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/${lcuAssetPath.slice(assetsIndex + '/ASSETS/'.length).toLowerCase()}`
}

const summonerSpellImageNames: Record<string, string> = {
  Barrier: 'SummonerBarrier.png',
  Clarity: 'SummonerMana.png',
  Cleanse: 'SummonerBoost.png',
  Exhaust: 'SummonerExhaust.png',
  Flash: 'SummonerFlash.png',
  Flee: 'SummonerCherryHold.png',
  Ghost: 'SummonerHaste.png',
  Heal: 'SummonerHeal.png',
  Ignite: 'SummonerDot.png',
  Mark: 'SummonerSnowball.png',
  Placeholder: 'Summoner_UltBookPlaceholder.png',
  'Placeholder and Attack-Smite': 'Summoner_UltBookSmitePlaceholder.png',
  'Poro Toss': 'SummonerPoroThrow.png',
  Smite: 'SummonerSmite.png',
  Teleport: 'SummonerTeleport.png',
  'To the King!': 'SummonerPoroRecall.png',
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
