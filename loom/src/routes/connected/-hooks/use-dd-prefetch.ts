import { useEffect } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { prefetchDdragonData, useLatestDdragonVersion } from '@/core/http/ddragon-client'
import { createLcuQueryOptions, regionLocaleDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

export function useDdragonPrefetch() {
  const queryClient = useQueryClient()
  const transport = useSharedLCUTransport()
  const versionQuery = useLatestDdragonVersion()

  const regionLocaleQuery = useQuery(createLcuQueryOptions(regionLocaleDescriptor, transport))

  useEffect(() => {
    if (!versionQuery.isSuccess || !regionLocaleQuery.isSuccess || !versionQuery.data || !regionLocaleQuery.data) {
      return
    }

    prefetchDdragonData(queryClient, versionQuery.data, regionLocaleQuery.data.locale)
  }, [queryClient, versionQuery.isSuccess, versionQuery.data, regionLocaleQuery.isSuccess, regionLocaleQuery.data])
}
