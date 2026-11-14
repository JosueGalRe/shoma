import type { LobbyMember, LobbyRole } from '@/features/lobby/lobby-store'
import type { IconName } from '@shoma/ui/icon'

// Shortcut: FILL borrows the dashboard glyph, the Figma has no fill icon yet; swap it when Adriana draws one
export const ROLE_ICONS: Record<LobbyRole, IconName> = {
  BOTTOM: 'position-bottom',
  FILL: 'dashboard',
  JUNGLE: 'position-jungle',
  MIDDLE: 'position-middle',
  TOP: 'position-top',
  UNSELECTED: 'add',
  UTILITY: 'position-support',
}

// One slot per party place: the members fill the middle first, then outward, left before right; the rest invite
export function getPartySlots(members: LobbyMember[], size: number): (LobbyMember | null)[] {
  const middle = Math.floor((size - 1) / 2)
  const order = Array.from({ length: size }, (_, index) => {
    return index
  }).toSorted((left, right) => {
    return Math.abs(left - middle) - Math.abs(right - middle) || left - right
  })
  const slots: (LobbyMember | null)[] = Array.from({ length: Math.max(size, members.length) }, () => {
    return null
  })

  members.forEach((member, index) => {
    slots[order[index] ?? index] = member
  })

  return slots
}
