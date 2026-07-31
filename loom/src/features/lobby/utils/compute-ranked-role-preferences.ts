import type { LobbyRole, LobbyRolePreferences } from '../lobby-store'

export const RANKED_ROLE_SLOTS: LobbyRole[] = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY']

export function normalizeRankedRoles(preferences: LobbyRolePreferences): LobbyRole[] {
  const preferred = [preferences.first, preferences.second, preferences.third, preferences.fourth, preferences.fifth]
  const seen = new Set<LobbyRole>()
  const slots = preferred.map((role) => {
    if (role !== undefined && role !== 'UNSELECTED' && role !== 'FILL' && RANKED_ROLE_SLOTS.includes(role) && !seen.has(role)) {
      seen.add(role)

      return role
    }

    return null
  })
  const missing = RANKED_ROLE_SLOTS.filter((role) => {
    return !seen.has(role)
  })
  let missingIndex = 0

  return slots.map((role) => {
    if (role !== null) {
      return role
    }

    const fill = missing[missingIndex]

    missingIndex += 1

    return fill
  })
}

export function swapRankedRole(order: LobbyRole[], slotIndex: number, role: LobbyRole): LobbyRole[] {
  const currentIndex = order.indexOf(role)

  if (currentIndex === -1 || currentIndex === slotIndex) {
    return order
  }

  const next = [...order]

  next[currentIndex] = next[slotIndex]
  next[slotIndex] = role

  return next
}

export function rankedRolesToPreferences(order: LobbyRole[]): LobbyRolePreferences {
  return {
    fifth: order[4],
    first: order[0],
    fourth: order[3],
    second: order[1],
    third: order[2],
  }
}
