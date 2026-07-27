import type { GameMode } from '@/core/lcu/parsers/lobby'

export const CD_CDN =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/content/src/leagueclient/gamemodeassets'

export const GAME_MODE_ICONS: Record<string, string> = {
  aram: `${CD_CDN}/aram/img/game-select-icon-default.png`,
  arena: `${CD_CDN}/cherry/img/game-select-icon-default.png`,
  rgm: `${CD_CDN}/shared/img/icon-rgm-empty.png`,
  sr: `${CD_CDN}/classic_sru/img/game-select-icon-default.png`,
  tft: `${CD_CDN}/tft/img/game-select-icon-default.png`,
}

export function mapModeToIcon(mode: GameMode): string {
  switch (mode) {
    case 'aram': {
      return GAME_MODE_ICONS.aram
    }
    case 'arena': {
      return GAME_MODE_ICONS.arena
    }

    case 'ranked-solo-duo':
    case 'ranked-flex':
    case 'normal-draft':
    case 'swiftplay':
    case 'clash':
    case 'custom':
    default: {
      return GAME_MODE_ICONS.sr
    }
  }
}

export interface GameTimeAnchor {
  gameTime: number
  localTime: number
}

export function readAnchoredGameTime(anchor: GameTimeAnchor | null, now: number): number {
  if (!anchor) {
    return 0
  }

  return Math.max(0, Math.floor(anchor.gameTime + (now - anchor.localTime) / 1000))
}
