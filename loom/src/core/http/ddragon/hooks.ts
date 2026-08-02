import { type QueryClient, queryOptions, useQuery } from '@tanstack/react-query'

import { ChampionId } from '@/core/types/branded'

import {
  getChampionDetail,
  getChampions,
  getChampionSkins,
  getLatestDdragonVersion,
  getProfileIconUrl,
  getRunes,
} from './fetchers'

import type { ChampionIdType, DdragonLanguage } from './ddragon-types'

const DEFAULT_LANGUAGE: DdragonLanguage = 'en'
const DAY_STALE_TIME_MS = 24 * 60 * 60 * 1000

export function prefetchDdragonData(queryClient: QueryClient, version: string, language: DdragonLanguage): void {
  void queryClient.prefetchQuery({
    queryFn: () => {
      return getChampions(version, language)
    },
    queryKey: ['ddragon', 'champions', version, language] as const,
    staleTime: DAY_STALE_TIME_MS,
  })

  void queryClient.prefetchQuery({
    queryFn: () => {
      return getRunes(version, language)
    },
    queryKey: ['ddragon', 'runes', version, language] as const,
    staleTime: DAY_STALE_TIME_MS,
  })
}

function latestDdragonVersionQueryOptions() {
  return queryOptions({
    queryFn: getLatestDdragonVersion,
    queryKey: ['ddragon', 'latest-version'] as const,
    staleTime: DAY_STALE_TIME_MS,
  })
}

export function profileIconQueryOptions(version: string, iconId: number) {
  return queryOptions({
    queryFn: () => {
      return getProfileIconUrl(version, iconId)
    },
    queryKey: ['ddragon', 'profile-icon', version, iconId] as const,
    staleTime: DAY_STALE_TIME_MS,
  })
}

export function useLatestDdragonVersion() {
  return useQuery(latestDdragonVersionQueryOptions())
}

export function useChampions(language: DdragonLanguage = DEFAULT_LANGUAGE) {
  const versionQuery = useLatestDdragonVersion()

  return useQuery({
    enabled: versionQuery.isSuccess,
    queryFn: () => {
      return getChampions(versionQuery.data ?? '', language)
    },
    queryKey: ['ddragon', 'champions', versionQuery.data, language] as const,
    staleTime: DAY_STALE_TIME_MS,
  })
}

export function useRunes(language: DdragonLanguage = DEFAULT_LANGUAGE) {
  const versionQuery = useLatestDdragonVersion()

  return useQuery({
    enabled: versionQuery.isSuccess,
    queryFn: () => {
      return getRunes(versionQuery.data ?? '', language)
    },
    queryKey: ['ddragon', 'runes', versionQuery.data, language] as const,
    staleTime: DAY_STALE_TIME_MS,
  })
}

export function useChampionDetail(championKey: string | undefined, language: DdragonLanguage = DEFAULT_LANGUAGE) {
  const versionQuery = useLatestDdragonVersion()

  return useQuery({
    enabled: versionQuery.isSuccess && typeof championKey === 'string' && championKey.length > 0,
    queryFn: () => {
      return getChampionDetail(versionQuery.data ?? '', championKey ?? '', language)
    },
    queryKey: ['ddragon', 'champion-detail', versionQuery.data, championKey, language] as const,
    staleTime: DAY_STALE_TIME_MS,
  })
}

export function useChampionSkins(championId: ChampionIdType | undefined, language: DdragonLanguage = DEFAULT_LANGUAGE) {
  const versionQuery = useLatestDdragonVersion()

  return useQuery({
    enabled: versionQuery.isSuccess && typeof championId === 'number',
    queryFn: () => {
      return getChampionSkins(versionQuery.data ?? '', championId ?? ChampionId(-1), language)
    },
    queryKey: ['ddragon', 'champion-skins', versionQuery.data, championId, language] as const,
    staleTime: DAY_STALE_TIME_MS,
  })
}
