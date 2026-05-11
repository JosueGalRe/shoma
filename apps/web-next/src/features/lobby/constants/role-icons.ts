import type { LobbyRole } from '@/features/lobby/lobby-store'

const BASE_URL =
  'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/'

export const ROLE_ICONS: Record<LobbyRole, string> = {
  UNSELECTED: `${BASE_URL}icon-position-unselected.png`,
  TOP: `${BASE_URL}icon-position-top.png`,
  JUNGLE: `${BASE_URL}icon-position-jungle.png`,
  MIDDLE: `${BASE_URL}icon-position-middle.png`,
  BOTTOM: `${BASE_URL}icon-position-bottom.png`,
  UTILITY: `${BASE_URL}icon-position-utility.png`,
  FILL: `${BASE_URL}icon-position-fill.png`,
}

export const ROLE_ICONS_SELECTED: Record<LobbyRole, string> = {
  UNSELECTED: `${BASE_URL}icon-position-unselected-blue.png`,
  TOP: `${BASE_URL}icon-position-top-blue.png`,
  JUNGLE: `${BASE_URL}icon-position-jungle-blue.png`,
  MIDDLE: `${BASE_URL}icon-position-middle-blue.png`,
  BOTTOM: `${BASE_URL}icon-position-bottom-blue.png`,
  UTILITY: `${BASE_URL}icon-position-utility-blue.png`,
  FILL: `${BASE_URL}icon-position-fill-blue.png`,
}
