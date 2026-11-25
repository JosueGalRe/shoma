import { COMMUNITY_DRAGON_BASE_URL, communityDragonGameDataUrl } from '@/core/http/ddragon'

const PLUGIN_IMAGES = `${COMMUNITY_DRAGON_BASE_URL}/latest/plugins/rcp-fe-lol-champ-select/global/default/images`

// The client's BRAVERY_CHAMP (rcp-fe-lol-champ-select): Arena's random champion, a tile before the pickable ones
export const BRAVERY_CHAMPION_ID = -3
export const BRAVERY_TILE_URL = `${PLUGIN_IMAGES}/champion-grid/bravery-champion.png`
export const BRAVERY_CIRCLE_URL = `${PLUGIN_IMAGES}/champion-grid/bravery-champion-circle.png`
export const BRAVERY_SPLASH_URL = `${PLUGIN_IMAGES}/background/bravery-splash-background.png`

// A champion's round icon, Valentía's included
export function championCircleUrl(championId: number): string {
  return championId === BRAVERY_CHAMPION_ID
    ? BRAVERY_CIRCLE_URL
    : communityDragonGameDataUrl(`/lol-game-data/assets/v1/champion-icons/${championId}.png`)
}

// The client's Arena teams in cell order (GAME_MODES_WITH_SUBTEAMS), each with its name and icon
export const ARENA_SUBTEAMS = ['poro', 'minion', 'scuttle', 'krug', 'raptor', 'sentinel', 'wolf', 'gromp'] as const

export type ArenaSubteam = (typeof ARENA_SUBTEAMS)[number]

export function arenaSubteamIconUrl(subteam: ArenaSubteam): string {
  return `${PLUGIN_IMAGES}/subteams/${subteam}.png`
}
