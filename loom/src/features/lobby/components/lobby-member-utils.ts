import type { LobbyMember } from '../lobby-store'
import type { LobbyMemberProps } from './lobby-member-types'
import type { TFunction } from 'i18next'

export function canManageLobbyMember(variant: LobbyMemberProps['variant'], member: LobbyMember) {
  return variant === 'manageable' && !member.isLocalMember
}

export function getLobbyMemberRoleLabel(t: TFunction, position: LobbyMember['firstPositionPreference']) {
  return t(`lobby.roles.${position.toLowerCase()}`)
}
