import type { LobbyRole, LobbyRolePreferences } from '../lobby-store'

type RolePair = Pick<LobbyRolePreferences, 'first' | 'second'>

// Figma "Select Position": the first tap picks the primary position, the next the secondary, a third replaces the
// Secondary. Tapping a picked one drops it, and FILL stands alone
export function toggleRolePreference({ first, second }: RolePair, role: LobbyRole): RolePair {
  if (role === first) {
    return { first: second, second: 'UNSELECTED' }
  }

  if (role === second) {
    return { first, second: 'UNSELECTED' }
  }

  if (role === 'FILL' || first === 'FILL' || first === 'UNSELECTED') {
    return { first: role, second: 'UNSELECTED' }
  }

  return { first, second: role }
}

// The client queues with a primary position and either FILL or a secondary one
export function isRolePairComplete({ first, second }: RolePair): boolean {
  return first === 'FILL' || (first !== 'UNSELECTED' && second !== 'UNSELECTED')
}
