import { useQuery } from '@tanstack/react-query'

import { communityDragonGameDataUrl } from '@/core/http/ddragon'
import { createLcuQueryOptions, gameMapsDescriptor, gameQueuesDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { findQueueMap } from '@/features/lobby/create-lobby-utils'

import type { ChampSelectSession } from '@/features/champ-select'

// The map from above, as the client's position assignment shows it: from the south on blue side, the north on red
export function useChampSelectMap(session: ChampSelectSession | null): string | undefined {
  const transport = useSharedLCUTransport()
  const queues = useQuery(createLcuQueryOptions(gameQueuesDescriptor, transport)).data
  const maps = useQuery(createLcuQueryOptions(gameMapsDescriptor, transport)).data
  const queue = queues?.find(({ id }) => {
    return id === session?.queueId
  })
  const local = session?.myTeam?.find((member) => {
    return member.cellId === session.localPlayerCellId
  })
  const assets = queue ? findQueueMap(queue, maps ?? [])?.assets : undefined
  // ARAM's maps have no view from above: their art, as the lobby shows it
  const art = assets?.[local?.team === 2 ? 'map-north' : 'map-south'] ?? assets?.['gameflow-background']

  return art ? communityDragonGameDataUrl(art) : undefined
}
