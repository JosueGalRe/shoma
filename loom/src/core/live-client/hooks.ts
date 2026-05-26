import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { createLiveClientQueryOptions, gameStatsDescriptor } from './live-client-queries'
import { useSharedLiveClientTransport } from './live-client-transport'

import type { GameStats } from './parsers/game-stats'

export function useGameStats(): UseQueryResult<GameStats | null> {
  const transport = useSharedLiveClientTransport()

  return useQuery(createLiveClientQueryOptions(gameStatsDescriptor, transport))
}
