import { useQuery } from '@tanstack/react-query'

import { communityDragonGameDataUrl } from '@/core/http/ddragon'
import { createLcuQueryOptions, gameMapsDescriptor, gameQueuesDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { findQueueMap } from '@/features/lobby/create-lobby-utils'

// The lobby's queue as the client draws it: its name, its mode's icon and its map's art
export function useLobbyQueueArt(queueId: number | null) {
  const transport = useSharedLCUTransport()
  const queuesQuery = useQuery(createLcuQueryOptions(gameQueuesDescriptor, transport))
  const mapsQuery = useQuery(createLcuQueryOptions(gameMapsDescriptor, transport))
  const queue = queuesQuery.data?.find(({ id }) => {
    return id === queueId
  })
  const map = queue ? findQueueMap(queue, mapsQuery.data ?? []) : undefined
  const icon = map?.assets['game-select-icon-active']
  const background = map?.assets['gameflow-background']
  const readyCheck = map?.assets['ready-check-background']

  return {
    backgroundUrl: background ? communityDragonGameDataUrl(background) : undefined,
    description: queue?.description,
    iconUrl: icon ? communityDragonGameDataUrl(icon) : undefined,
    mapName: map?.name,
    playersPerTeam: queue?.numPlayersPerTeam,
    readyCheckUrl: readyCheck ? communityDragonGameDataUrl(readyCheck) : undefined,
  }
}
