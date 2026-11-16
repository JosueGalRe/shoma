import { isRecord } from '@/lib/type-guards'

import { MOBILE_GROUP, OFFLINE_GROUP, PRODUCT_GROUP_PREFIX } from './group-friends'

import type { Friend, RecentPlayer } from '../social-types'

export function isFriendInvitable(friend: Pick<Friend, 'activity' | 'isOnMobile' | 'product' | 'status'>): boolean {
  if (friend.status === 'offline' || friend.isOnMobile) {
    return false
  }

  if (friend.product && friend.product !== 'league_of_legends') {
    return false
  }

  return friend.activity !== 'in-game' && friend.activity !== 'champ-select' && friend.activity !== 'in-queue'
}

const PRODUCT_LABELS: Record<string, string> = {
  lor: 'Legends of Runeterra',
  tft: 'Teamfight Tactics',
  valorant: 'VALORANT',
}

export function readProductLabel(product: string): string {
  return PRODUCT_LABELS[product] ?? product
}

export function readFriendStatusDetail(
  friend: Pick<Friend, 'gameMode' | 'isOnMobile' | 'product'>,
  labels: { activityLabel: string | undefined; riotMobileLabel: string; statusLabel: string },
): string {
  if (labels.activityLabel) {
    return friend.gameMode ? `${labels.activityLabel} · ${friend.gameMode}` : labels.activityLabel
  }

  if (friend.isOnMobile) {
    return labels.riotMobileLabel
  }

  if (friend.product && friend.product !== 'league_of_legends') {
    return readProductLabel(friend.product)
  }

  return labels.statusLabel
}

export function matchesPuuid(friendId: string, participantId: string): boolean {
  // Handles mismatched formats: puuid@region vs bare puuid
  const [friendNormalized = ''] = friendId.split('@')
  const [participantNormalized = ''] = participantId.split('@')

  return friendNormalized === participantNormalized || friendId === participantId
}

export function translateGroupName(group: string, t: (key: string) => string): string {
  if (group === OFFLINE_GROUP) {
    return t('social.group.offline')
  }

  if (group === MOBILE_GROUP) {
    return t('social.status.riotMobile')
  }

  if (group.startsWith(PRODUCT_GROUP_PREFIX)) {
    return readProductLabel(group.slice(PRODUCT_GROUP_PREFIX.length))
  }

  const cleaned = group.replace(/^\*+/, '').trim()
  const normalized = cleaned.toUpperCase()

  if (normalized === 'DEFAULT' || normalized === 'GENERAL') {
    return t('social.group.default')
  }

  return cleaned
}

// The client lists friends by game name, without the tag
export function readGameName(name: string): string {
  return name.split('#')[0] || name
}

export function profileIconUrl(version: string | undefined, iconId?: number): string | undefined {
  if (!version || iconId === undefined || iconId < 0) {
    return undefined
  }

  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`
}

export function readCurrentUserPuuid(currentSummoner: Record<string, unknown> | null | undefined): string | undefined {
  if (!currentSummoner) {
    return undefined
  }

  return typeof currentSummoner.puuid === 'string' ? currentSummoner.puuid : undefined
}

function readPuuid(pid: string): string {
  return pid.split('@')[0] ?? pid
}

// Recently Played as the client lists it: each player once, newest first, without friends or who already has a request
export function readRecentPlayers(entries: unknown[], excludedPids: string[]): RecentPlayer[] {
  const excluded = new Set(excludedPids.map(readPuuid))
  const players = new Map<string, { playedAt: number; player: RecentPlayer }>()

  for (const entry of entries) {
    const puuid = isRecord(entry) && typeof entry.puuid === 'string' ? entry.puuid : ''
    const gameName = isRecord(entry) && typeof entry.gameName === 'string' ? entry.gameName : ''
    const playedAt = isRecord(entry) && typeof entry.gameCreationDate === 'string' ? Date.parse(entry.gameCreationDate) : 0
    const known = players.get(puuid)

    if (isRecord(entry) && puuid && gameName && !excluded.has(puuid) && (!known || playedAt > known.playedAt)) {
      players.set(puuid, {
        playedAt,
        player: {
          championId: typeof entry.championId === 'number' ? entry.championId : 0,
          gameName,
          puuid,
          tagLine: typeof entry.tagLine === 'string' ? entry.tagLine : '',
        },
      })
    }
  }

  return [...players.values()]
    .toSorted((left, right) => {
      return right.playedAt - left.playedAt
    })
    .map(({ player }) => {
      return player
    })
}
