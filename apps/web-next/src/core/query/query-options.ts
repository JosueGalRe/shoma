import { queryOptions } from '@tanstack/react-query'

import type { RiftLcuResult } from '../rift/rift-lcu-types'

type QueryResult = string | null
export type LcuRequest = (path: string, method?: string, body?: string) => Promise<RiftLcuResult>

function readStringField(content: unknown, field: string): QueryResult {
  if (typeof content !== 'object' || content === null) {
    return null
  }

  const candidate = content as Record<string, unknown>
  return typeof candidate[field] === 'string' ? candidate[field] : null
}

export const queueInfoQuery = {
  queryKey(queueId: number) {
    return ['queue-info', queueId] as const
  },
  options(queueId: number, request: LcuRequest) {
    return createLcuQueryFactory(request).queueInfo.options(queueId)
  },
}

export const mapInfoQuery = {
  queryKey(mapId: number) {
    return ['map-info', mapId] as const
  },
  options(mapId: number, request: LcuRequest) {
    return createLcuQueryFactory(request).mapInfo.options(mapId)
  },
}

export function createLcuQueryFactory(request: LcuRequest) {
  return {
    queueInfo: {
      queryKey(queueId: number) {
        return ['queue-info', queueId] as const
      },
      options(queueId: number) {
        return queryOptions({
          queryKey: this.queryKey(queueId),
          queryFn: async () => {
            const result = await request(`/lol-game-queues/v1/queues/${queueId}`)
            if (result.status !== 200) {
              return null
            }

            return readStringField(result.content, 'description')
          },
        })
      },
    },
    mapInfo: {
      queryKey(mapId: number) {
        return ['map-info', mapId] as const
      },
      options(mapId: number) {
        return queryOptions({
          queryKey: this.queryKey(mapId),
          queryFn: async () => {
            const result = await request(`/lol-maps/v1/map/${mapId}`)
            if (result.status !== 200) {
              return null
            }

            return readStringField(result.content, 'name')
          },
        })
      },
    },
  }
}
