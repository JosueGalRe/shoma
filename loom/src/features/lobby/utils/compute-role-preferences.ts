import type { LobbyRole } from '../lobby-store';
import type { LobbyRolePreferences } from '../lobby-store';

export function computeRolePreferences(
  current: LobbyRolePreferences,
  slot: 'first' | 'second',
  newRole: LobbyRole,
): LobbyRolePreferences {
  const { first, second } = current

  if (slot === 'first') {
    if (newRole === second) {
      return { first: newRole, second: first }
    }
    if (newRole === first) {
      return { first: 'UNSELECTED', second }
    }
    if (newRole === 'FILL') {
      return { first: 'FILL', second: 'UNSELECTED' }
    }
    return { first: newRole, second }
  }

  if (newRole === first) {
    return { first: second, second: newRole }
  }
  if (newRole === second) {
    return { first, second: 'UNSELECTED' }
  }
  return { first, second: newRole }
}
