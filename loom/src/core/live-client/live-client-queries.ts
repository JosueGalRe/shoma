import { LiveClientPaths } from '@shoma/protocol-contract'
import { queryOptions } from '@tanstack/react-query'

import { type GameStats, parseGameStats } from './parsers/game-stats'

import type { LiveClientTransport } from './live-client-transport-types'

export interface LiveClientQueryDescriptor<TDomain> {
  path: string
  queryKey: readonly unknown[]
  parse: (content: unknown) => TDomain | null
  enabled?: (transport: LiveClientTransport | null) => boolean
  notFoundValue?: TDomain | null
  staleTime?: number
}

export function createLiveClientQueryOptions<TDomain>(
  descriptor: LiveClientQueryDescriptor<TDomain>,
  transport: LiveClientTransport | null,
) {
  return queryOptions({
    enabled: descriptor.enabled ? descriptor.enabled(transport) : Boolean(transport),
    queryFn: async () => {
      if (!transport) {
        throw new Error('No transport')
      }

      const result = await transport.request(descriptor.path, 'GET')
      const parsed = result.status === 404 ? (descriptor.notFoundValue ?? null) : descriptor.parse(result.content)

      return parsed
    },
    queryKey: descriptor.queryKey,
    staleTime: descriptor.staleTime ?? 5000,
  })
}

export const gameStatsDescriptor = {
  parse: parseGameStats,
  path: LiveClientPaths.gameStats,
  queryKey: [LiveClientPaths.gameStats] as const,
} satisfies LiveClientQueryDescriptor<GameStats>
