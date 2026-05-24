import type { LobbyMember as LobbyMemberType } from '../lobby-store'

export type LobbyMemberProps = {
  member: LobbyMemberType
  onKick: (member: LobbyMemberType) => Promise<void>
  onPromote: (member: LobbyMemberType) => Promise<void>
} & ({ variant: 'readonly'; showRoles: boolean } | { variant: 'manageable'; showRoles: boolean })
