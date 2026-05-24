import { lobbyRoles } from '@/features/lobby/lobby-store';
import type { LobbyRole } from '@/features/lobby/lobby-store';
import type { ChampSelectMember } from '../champ-select-store'

export function memberLabel(member: ChampSelectMember): string {
  return member.displayName ?? `#${member.cellId}`
}

export function parseLobbyRole(value: string): LobbyRole | null {
  const role = value.toUpperCase()

  for (const candidate of lobbyRoles) {
    if (candidate === role) {
      return candidate
    }
  }

  return null
}
