import { useQuery } from '@tanstack/react-query'

import { useLatestDdragonVersion } from '@/core/http/ddragon-client'
import { createLcuQueryOptions, currentSummonerDescriptor } from '@/core/lcu/lcu-queries'
import { useSharedLCUTransport } from '@/core/relay/relay-client-provider'
import { profileIconUrl } from '@/features/social/components/social-utils'

export function useCurrentUserProfileIcon() {
  const transport = useSharedLCUTransport()
  const versionQuery = useLatestDdragonVersion()
  const currentSummonerQuery = useQuery(createLcuQueryOptions(currentSummonerDescriptor, transport))

  const rawIconId = currentSummonerQuery.data?.profileIconId
  const iconId = typeof rawIconId === 'number' ? rawIconId : undefined

  return profileIconUrl(versionQuery.data, iconId)
}
