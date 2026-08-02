import type { Friend } from '../social-types'
import type { GameQueue } from '@/core/lcu/parsers/game-queues'

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

function readQueueLabel(queue: GameQueue): string {
  return queue.name ?? queue.description
}

// Presence gameMode is a raw internal id (e.g. "KIWI"); resolve it to the queue's display name.
export function resolveFriendGameModeLabel(
  friend: Pick<Friend, 'gameMode' | 'mapId' | 'queueId'>,
  queues: GameQueue[],
): string | undefined {
  if (friend.queueId !== undefined) {
    const byId = queues.find((queue) => {
      return queue.id === friend.queueId
    })

    if (byId) {
      return readQueueLabel(byId)
    }
  }

  if (friend.gameMode) {
    const byMode = queues.find((queue) => {
      return queue.gameMode === friend.gameMode
    })

    if (byMode) {
      return readQueueLabel(byMode)
    }
  }

  if (friend.mapId !== undefined) {
    const byMap = queues.find((queue) => {
      return queue.mapId === friend.mapId
    })

    if (byMap) {
      return readQueueLabel(byMap)
    }
  }

  return undefined
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
  if (group === '__offline__') {
    return t('social.group.offline')
  }

  const cleaned = group.replace(/^\*+/, '').trim()
  const normalized = cleaned.toUpperCase()

  if (normalized === 'DEFAULT' || normalized === 'GENERAL') {
    return t('social.group.default')
  }

  return cleaned
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
