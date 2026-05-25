import { lobbyStyles } from '../-styles'

export function MemberRuneIcon({ role }: { role: string }) {
  const roleMap: Record<string, string> = {
    BOTTOM:
      'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-bottom.png',
    FILL: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-fill.png',
    JUNGLE:
      'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-jungle.png',
    MIDDLE:
      'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-middle.png',
    TOP: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-top.png',
    UTILITY:
      'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-utility.png',
  }

  const url = roleMap[role]

  if (!url) {
    return null
  }

  return (
    <div className={lobbyStyles.memberRuneIcon}>
      <img alt={role} className='size-5 rounded-full' src={url} />
    </div>
  )
}
