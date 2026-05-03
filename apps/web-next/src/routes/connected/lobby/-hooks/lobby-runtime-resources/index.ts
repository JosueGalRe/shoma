import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { championNamesQueryOptions, ddragonVersionQueryOptions, getChampionMetadata, type DdragonLanguage } from '@core/http/ddragon-client'
import { useRiftLcuRuntime } from '@features/connect/hooks/use-rift-lcu-runtime'

import type { UseLobbyRuntimeResourcesOptions } from './lobby-runtime-resources-types'
import { readQueueDodgePenaltySeconds } from '../../-lobby-utils'

export function useLobbyRuntimeResources({
  i18nResolvedLanguage,
  queueErrors,
  appendLog,
  client,
  setPeer,
  status,
}: UseLobbyRuntimeResourcesOptions) {
  const { data: ddragonVersion } = useQuery(ddragonVersionQueryOptions())
  const ddragonLanguage: DdragonLanguage = i18nResolvedLanguage?.startsWith('es') ? 'es' : 'en'
  const { data: championNamesById = {} } = useQuery({
    ...championNamesQueryOptions(ddragonVersion ?? '', ddragonLanguage),
    enabled: Boolean(ddragonVersion),
  })

  const { data: championMetadataById = {} } = useQuery({
    queryKey: ['ddragon-champion-metadata', ddragonVersion, ddragonLanguage] as const,
    queryFn: () => getChampionMetadata(ddragonVersion ?? '', ddragonLanguage),
    enabled: Boolean(ddragonVersion),
    staleTime: 60 * 60 * 1000,
  })

  const ddragonVersionValue = ddragonVersion ?? null

  const queueDodgePenaltySeconds = useMemo(() => {
    return readQueueDodgePenaltySeconds(queueErrors)
  }, [queueErrors])

  const { getMapName, getQueueDescription, lcuClient, lcuTransport } = useRiftLcuRuntime({
    appendLog,
    client,
    setPeer,
    status,
  })

  return {
    ddragonVersionValue,
    championNamesById,
    championMetadataById,
    queueDodgePenaltySeconds,
    getMapName,
    getQueueDescription,
    lcuClient,
    lcuTransport,
  }
}
