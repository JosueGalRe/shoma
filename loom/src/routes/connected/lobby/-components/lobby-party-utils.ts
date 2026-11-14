import { communityDragonGameDataUrl } from '@/core/http/ddragon'

import type { LobbyMemberRegalia } from './lobby-screen-types'
import type { PlayerRegalia } from '@/core/lcu/parsers/regalia'
import type { LobbyMember } from '@/features/lobby/lobby-store'

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

// The plain banner in regalia.json, which the client hangs for players who never picked one
const DEFAULT_BANNER_ID = '1'

// Undefined regalia is still loading: no banner yet, so the real one fades in instead of replacing the default
export function getMemberRegalia(
  regalia: PlayerRegalia | null | undefined,
  bannerSkins: Record<string, string> | null | undefined,
): LobbyMemberRegalia {
  const bannerId = regalia === undefined ? undefined : (regalia?.bannerId ?? DEFAULT_BANNER_ID)
  const bannerPath = bannerId ? bannerSkins?.[bannerId] : undefined

  return {
    bannerUrl: bannerPath ? communityDragonGameDataUrl(bannerPath) : undefined,
    tokenUrls: (regalia?.tokenIconPaths ?? []).map((iconPath) => {
      return communityDragonGameDataUrl(iconPath)
    }),
  }
}
