import type { LobbyRole, LobbyRolePreferences } from '../lobby-store'

type RolePair = Pick<LobbyRolePreferences, 'first' | 'second'>

export type RoleSlot = keyof RolePair

// As in the client: the role goes to the slot being edited, and one already in the other slot swaps places with it.
// FILL as the primary position leaves no secondary
export function assignRolePreference(pair: RolePair, slot: RoleSlot, role: LobbyRole): RolePair {
  const other = slot === 'first' ? 'second' : 'first'

  if (role === pair[slot]) {
    return pair
  }

  if (role === pair[other]) {
    return { first: pair.second, second: pair.first }
  }

  if (slot === 'first' && role === 'FILL') {
    return { first: 'FILL', second: 'UNSELECTED' }
  }

  return slot === 'first' ? { first: role, second: pair.second } : { first: pair.first, second: role }
}

// The client queues with a primary position and either FILL or a secondary one
export function isRolePairComplete({ first, second }: RolePair): boolean {
  return first === 'FILL' || (first !== 'UNSELECTED' && second !== 'UNSELECTED')
}
