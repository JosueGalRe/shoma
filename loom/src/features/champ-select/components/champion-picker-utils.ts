import type { SyntheticEvent } from 'react'

import { ChampionId, type ChampionId as ChampionIdType } from '@/core/types/branded'

import type { ChampionCard } from '../aram-store'
import type { ChampSelectMember } from '../champ-select-store'
import type { ChampionSummary } from '@/core/http/ddragon'

export type ChampionSortOrder = 'name-asc' | 'name-desc'

interface FilterChampionsOptions<T extends Pick<ChampionSummary, 'id' | 'name' | 'tags'>> {
  champions: T[]
  query: string
  activeRoleFilter: string | null
  sortOrder: ChampionSortOrder
}

interface FilterAramCardsOptions<T extends ChampionCard> {
  aramCards: T[]
  champions: Pick<ChampionSummary, 'id' | 'name' | 'tags'>[]
  query: string
  activeRoleFilter: string | null
  sortOrder: ChampionSortOrder
}

interface AvailableAramChampionIdsOptions {
  champions: Pick<ChampionSummary, 'id'>[]
  bannedChampions: ChampionIdType[]
  team: Pick<ChampSelectMember, 'championId' | 'championPickIntent'>[]
  enemyTeam: Pick<ChampSelectMember, 'championId'>[]
}

function compareChampionNames(leftName: string, rightName: string, sortOrder: ChampionSortOrder): number {
  return sortOrder === 'name-asc' ? leftName.localeCompare(rightName) : rightName.localeCompare(leftName)
}

export function filterChampions<T extends Pick<ChampionSummary, 'id' | 'name' | 'tags'>>(
  options: FilterChampionsOptions<T>,
): T[] {
  const { activeRoleFilter, champions, query, sortOrder } = options
  const normalizedQuery = query.trim().toLowerCase()

  return [...champions]
    .filter((champion) => {
      if (activeRoleFilter && !champion.tags.includes(activeRoleFilter)) {
        return false
      }

      return champion.name.toLowerCase().includes(normalizedQuery)
    })
    .toSorted((left, right) => {
      return compareChampionNames(left.name, right.name, sortOrder)
    })
}

export function filterAramCards<T extends ChampionCard>(options: FilterAramCardsOptions<T>): T[] {
  const { activeRoleFilter, aramCards, champions, query, sortOrder } = options
  const normalizedQuery = query.trim().toLowerCase()

  return [...aramCards]
    .filter((card) => {
      const champion = champions.find((candidate) => {
        return candidate.id === card.championId
      })

      // eslint-disable-next-line react-doctor/js-set-map-lookups -- tags is a <=5 item array, a Set allocation per row is worse
      if (activeRoleFilter && champion && !champion.tags.includes(activeRoleFilter)) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      return champion?.name.toLowerCase().includes(normalizedQuery) ?? false
    })
    .toSorted((left, right) => {
      const leftChampion = champions.find((candidate) => {
        return candidate.id === left.championId
      })
      const rightChampion = champions.find((candidate) => {
        return candidate.id === right.championId
      })
      const leftName = leftChampion?.name ?? String(left.championId)
      const rightName = rightChampion?.name ?? String(right.championId)

      return compareChampionNames(leftName, rightName, sortOrder)
    })
}

export function getAvailableAramChampionIds(options: AvailableAramChampionIdsOptions): ChampionIdType[] {
  const { bannedChampions, champions, enemyTeam, team } = options
  const pickedChampionIds = new Set<ChampionIdType>()

  for (const member of team) {
    if (member.championId > 0) {
      pickedChampionIds.add(ChampionId(member.championId))
    }
  }

  for (const member of enemyTeam) {
    if (member.championId > 0) {
      pickedChampionIds.add(ChampionId(member.championId))
    }
  }

  const bannedChampionIds = new Set(bannedChampions)

  return champions.reduce<ChampionIdType[]>((acc, champion) => {
    if (!bannedChampionIds.has(champion.id) && !pickedChampionIds.has(champion.id)) {
      acc.push(champion.id)
    }

    return acc
  }, [])
}

export function getAramCardTone(card: {
  isBlessed: boolean
  type?: string
}): 'crowdFavorite' | 'bravery' | 'blessed' | 'default' {
  if (card.type === 'crowd-favorite') {
    return 'crowdFavorite'
  }

  if (card.type === 'bravery') {
    return 'bravery'
  }

  if (card.isBlessed) {
    return 'blessed'
  }

  return 'default'
}

export function getChampionCardState(params: {
  isBanned: boolean
  isPicked: boolean
  isShielded: boolean
}): 'banned' | 'picked' | 'shielded' | 'available' {
  if (params.isBanned) {
    return 'banned'
  }

  if (params.isPicked) {
    return 'picked'
  }

  if (params.isShielded) {
    return 'shielded'
  }

  return 'available'
}

export function handleSplashError(event: SyntheticEvent<HTMLImageElement>) {
  const { fallbackUrl } = event.currentTarget.dataset

  if (!fallbackUrl || event.currentTarget.src === fallbackUrl) {
    return
  }

  event.currentTarget.src = fallbackUrl
}
