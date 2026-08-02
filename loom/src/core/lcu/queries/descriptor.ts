import { queryOptions } from '@tanstack/react-query'
import { object } from 'valibot'

import { finiteNumber, parseObjectOrNull } from '../parsers/base'

import type { LcuTransport } from '../../relay/lcu-transport'
import type { LcuQueryDescriptor } from './descriptor-types'

const ErrorStatusSchema = object({
  status: finiteNumber,
})

function readErrorStatus(error: unknown): number | null {
  return parseObjectOrNull(ErrorStatusSchema, error)?.status ?? null
}

export function createLcuQueryOptions<TDomain>(descriptor: LcuQueryDescriptor<TDomain>, transport: LcuTransport | null) {
  return queryOptions({
    enabled: descriptor.enabled ? descriptor.enabled(transport) : Boolean(transport),
    queryFn: async () => {
      if (!transport) {
        throw new Error('No transport')
      }

      try {
        const result = await transport.request(descriptor.path)
        const parsed = result.status === 404 ? (descriptor.notFoundValue ?? null) : descriptor.parse(result.content)

        return parsed
      } catch (error) {
        if (readErrorStatus(error) === 404) {
          return descriptor.notFoundValue ?? null
        }

        throw error
      }
    },
    queryKey: descriptor.queryKey,
    staleTime: descriptor.staleTime ?? 5000,
  })
}
