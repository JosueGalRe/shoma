import { COMMUNITY_DRAGON_BASE_URL } from '@/core/http/ddragon'

import { lobbyStyles } from '../-styles'

const ROLE_ICONS: Record<string, string> = {
  BOTTOM: `${COMMUNITY_DRAGON_BASE_URL}/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-bottom.png`,
  FILL: `${COMMUNITY_DRAGON_BASE_URL}/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-fill.png`,
  JUNGLE: `${COMMUNITY_DRAGON_BASE_URL}/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-jungle.png`,
  MIDDLE: `${COMMUNITY_DRAGON_BASE_URL}/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-middle.png`,
  TOP: `${COMMUNITY_DRAGON_BASE_URL}/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-top.png`,
  UTILITY: `${COMMUNITY_DRAGON_BASE_URL}/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-utility.png`,
}

export function MemberRuneIcon({ role }: { role: string }) {
  const url = ROLE_ICONS[role]

  if (!url) {
    return null
  }

  return (
    <div className={lobbyStyles.memberRuneIcon}>
      <img alt={role} className="size-5 rounded-full" src={url} />
    </div>
  )
}
