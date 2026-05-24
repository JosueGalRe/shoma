import { ROLE_ICONS, ROLE_ICONS_SELECTED } from '@/features/lobby/constants/role-icons'

import type { LobbyRole } from '../lobby-store'

export function getRoleIconUrl(role: LobbyRole, selected: boolean) {
  return selected ? ROLE_ICONS_SELECTED[role] : ROLE_ICONS[role]
}
