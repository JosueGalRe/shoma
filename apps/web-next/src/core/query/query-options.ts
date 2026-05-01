import { queryOptions } from '@tanstack/react-query'

import type { LcuClient } from '../rift/lcu-client'

type QueryResult = string | null

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
  options(queueId: number, lcuClient: LcuClient) {
    return createLcuQueryFactory(lcuClient).queueInfo.options(queueId)
  },
}

export const mapInfoQuery = {
  queryKey(mapId: number) {
    return ['map-info', mapId] as const
  },
  options(mapId: number, lcuClient: LcuClient) {
    return createLcuQueryFactory(lcuClient).mapInfo.options(mapId)
  },
}

export function createLcuQueryFactory(lcuClient: LcuClient) {
  return {
    queueInfo: {
      queryKey(queueId: number) {
        return ['queue-info', queueId] as const
      },
      options(queueId: number) {
        return queryOptions({
          queryKey: this.queryKey(queueId),
          queryFn: async () => {
            const result = await lcuClient.gameQueues.getQueue(queueId)
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
            const result = await lcuClient.maps.getMap(mapId)
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
