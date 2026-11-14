import { useQuery } from '@tanstack/react-query'

import {
  clashTournamentsDescriptor,
  createLcuQueryOptions,
  gameMapsDescriptor,
  gameQueuesDescriptor,
  platformConfigDescriptor,
} from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import {
  getAramMapOptions,
  getModeIcon,
  groupCustomQueuesByMode,
  groupQueuesByMode,
  parseQueueIds,
} from '../create-lobby-utils'

import type { GameMode, UseCreateLobbyModesResult } from '../create-lobby-types'

const DAY_MS = 24 * 60 * 60 * 1000

// The client's open queues grouped as create-lobby modes, with their icons; Clash only shows on a tournament day
export function useCreateLobbyModes(): UseCreateLobbyModesResult {
  const transport = useSharedLCUTransport()
  const queuesQuery = useQuery(createLcuQueryOptions(gameQueuesDescriptor, transport))
  const defaultQueuesQuery = useQuery(
    createLcuQueryOptions(platformConfigDescriptor('LcuSocial', 'DefaultGameQueues'), transport),
  )
  const clashTournamentsQuery = useQuery(createLcuQueryOptions(clashTournamentsDescriptor, transport))
  const mapsQuery = useQuery(createLcuQueryOptions(gameMapsDescriptor, transport))

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const isClashVisible = (clashTournamentsQuery.data ?? []).some(({ scheduleTime }) => {
    return scheduleTime !== undefined && scheduleTime >= startOfToday && scheduleTime < startOfToday + DAY_MS
  })
  const openQueues = (queuesQuery.data ?? []).filter((queue) => {
    return (queue.category === 'PvP' || queue.category === 'VersusAi') && queue.queueAvailability === 'Available'
  })

  const maps = mapsQuery.data ?? []

  function withIcon(mode: GameMode): GameMode {
    return { ...mode, icon: getModeIcon(mode, maps) }
  }

  return {
    aramMaps: getAramMapOptions(maps),
    customModes: groupCustomQueuesByMode(queuesQuery.data ?? []).map(withIcon),
    isLoading: queuesQuery.isLoading || defaultQueuesQuery.isLoading || clashTournamentsQuery.isLoading || mapsQuery.isLoading,
    modes: groupQueuesByMode(openQueues, parseQueueIds(defaultQueuesQuery.data), isClashVisible).map(withIcon),
  }
}
