import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { championNamesQueryOptions, ddragonVersionQueryOptions, type DdragonLanguage } from '@core/http/ddragon-client'
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
    queueDodgePenaltySeconds,
    getMapName,
    getQueueDescription,
    lcuClient,
    lcuTransport,
  }
}
