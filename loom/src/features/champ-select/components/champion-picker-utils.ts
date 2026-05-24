import type { ChampionSummary } from '@/core/http/ddragon-client'
import { ChampionId } from '@/core/types/branded'
import type { ChampionId as ChampionIdType } from '@/core/types/branded'

import type { ChampionCard } from '../aram-store'
import type { ChampSelectMember } from '../champ-select-store'

export type ChampionSortOrder = 'name-asc' | 'name-desc'

function compareChampionNames(leftName: string, rightName: string, sortOrder: ChampionSortOrder): number {
  return sortOrder === 'name-asc' ? leftName.localeCompare(rightName) : rightName.localeCompare(leftName)
}

export function filterChampions<T extends Pick<ChampionSummary, 'id' | 'name' | 'tags'>>(
  champions: T[],
  query: string,
  activeRoleFilter: string | null,
  sortOrder: ChampionSortOrder,
): T[] {
  const normalizedQuery = query.trim().toLowerCase()

  return [...champions]
    .filter((champion) => {
      if (activeRoleFilter && !champion.tags.includes(activeRoleFilter)) {
        return false
      }

      return champion.name.toLowerCase().includes(normalizedQuery)
    })
    .sort((left, right) => compareChampionNames(left.name, right.name, sortOrder))
}

export function filterAramCards<T extends ChampionCard>(
  aramCards: T[],
  champions: Pick<ChampionSummary, 'id' | 'name' | 'tags'>[],
  query: string,
  activeRoleFilter: string | null,
  sortOrder: ChampionSortOrder,
): T[] {
  const normalizedQuery = query.trim().toLowerCase()

  return [...aramCards]
    .filter((card) => {
      const champion = champions.find((candidate) => candidate.id === card.championId)

      if (activeRoleFilter && champion && !champion.tags.includes(activeRoleFilter)) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      return champion?.name.toLowerCase().includes(normalizedQuery) ?? false
    })
    .sort((left, right) => {
      const leftChampion = champions.find((candidate) => candidate.id === left.championId)
      const rightChampion = champions.find((candidate) => candidate.id === right.championId)
      const leftName = leftChampion?.name ?? String(left.championId)
      const rightName = rightChampion?.name ?? String(right.championId)

      return compareChampionNames(leftName, rightName, sortOrder)
    })
}

export function getAvailableAramChampionIds(
  champions: Pick<ChampionSummary, 'id'>[],
  bannedChampions: ChampionIdType[],
  team: Pick<ChampSelectMember, 'championId' | 'championPickIntent'>[],
  enemyTeam: Pick<ChampSelectMember, 'championId'>[],
): ChampionIdType[] {
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

  return champions.reduce<ChampionIdType[]>((acc, champion) => {
    if (!bannedChampions.includes(champion.id) && !pickedChampionIds.has(champion.id)) {
      acc.push(champion.id)
    }

    return acc
  }, [])
}
