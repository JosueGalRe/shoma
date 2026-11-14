import { communityDragonGameDataUrl, communityDragonStaticAssetUrl } from '@/core/http/ddragon'

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

// The client's 21 prestige borders: one at levels 1, 30 and 50, then one every 25 levels from 75 to 500
export function getPrestigeBorderTheme(level: number): number | null {
  if (level < 1) {
    return null
  }

  if (level < 30) {
    return 1
  }

  if (level < 50) {
    return 2
  }

  if (level < 75) {
    return 3
  }

  return Math.min(21, 4 + Math.floor((level - 75) / 25))
}

// Shortcut: a ranked crest has no border level, so it shows none; draw ranked-emblem/wings if players ask for it
export function getMemberRegalia(
  regalia: PlayerRegalia | null | undefined,
  bannerSkins: Record<string, string> | null | undefined,
): LobbyMemberRegalia {
  const theme = getPrestigeBorderTheme(regalia?.borderLevel ?? 0)
  const bannerPath = regalia?.bannerId ? bannerSkins?.[regalia.bannerId] : undefined

  return {
    bannerUrl: bannerPath ? communityDragonGameDataUrl(bannerPath) : undefined,
    borderUrl: theme ? communityDragonStaticAssetUrl(`uikit/themed-borders/theme-${theme}-border.png`) : undefined,
    ringUrl: theme ? communityDragonStaticAssetUrl(`uikit/themed-level-ring/theme-${theme}-simplified-border.png`) : undefined,
    tokenUrls: (regalia?.tokenIconPaths ?? []).map((iconPath) => {
      return communityDragonGameDataUrl(iconPath)
    }),
  }
}
