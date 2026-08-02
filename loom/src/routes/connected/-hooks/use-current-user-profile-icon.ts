import { useQuery } from '@tanstack/react-query'

import { useLatestDdragonVersion } from '@/core/http/ddragon'
import { createLcuQueryOptions, currentSummonerDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { profileIconUrl } from '@/features/social/components/friend-utils'

export function useCurrentUserProfileIcon() {
  const transport = useSharedLCUTransport()
  const versionQuery = useLatestDdragonVersion()
  const currentSummonerQuery = useQuery(createLcuQueryOptions(currentSummonerDescriptor, transport))

  const rawIconId = currentSummonerQuery.data?.profileIconId
  const iconId = typeof rawIconId === 'number' ? rawIconId : undefined

  return profileIconUrl(versionQuery.data, iconId)
}
