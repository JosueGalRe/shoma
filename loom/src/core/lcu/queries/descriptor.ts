import { queryOptions } from '@tanstack/react-query'
import { object } from 'valibot'

import { finiteNumber, parseObjectOrNull } from '../parsers/base'

import type { LcuTransport } from '../../relay/lcu-transport'

export interface LcuQueryDescriptor<TDomain> {
  path: string
  queryKey: readonly unknown[]
  parse: (content: unknown) => TDomain | null
  enabled?: (transport: LcuTransport | null) => boolean
  notFoundValue?: TDomain | null
  staleTime?: number
}

function normalizeLcuSegment(segment: string): string | number {
  const numericSegment = Number(segment)

  return Number.isInteger(numericSegment) && String(numericSegment) === segment ? numericSegment : segment
}

function normalizeLcuDomain(segment: string): string {
  return segment.startsWith('lol-') ? segment.slice(4) : segment
}

export function lcuQueryKey(path: string): readonly unknown[] {
  const segments = path.split('/').filter(Boolean)
  const [rawDomain, , ...resourceSegments] = segments
  const domain = rawDomain ? normalizeLcuDomain(rawDomain) : 'unknown'

  if (domain === 'lobby' && resourceSegments[0] === 'lobby') {
    const [, ...subResource] = resourceSegments

    return ['lcu', domain, 'session', ...subResource] as const
  }

  if (domain === 'summoner') {
    const [, summonerId] = resourceSegments

    if (resourceSegments[0] === 'summoners' && summonerId) {
      return ['lcu', domain, normalizeLcuSegment(summonerId)] as const
    }

    if (resourceSegments[0] === 'current-summoner') {
      return ['lcu', domain, 'current', ...resourceSegments.slice(1).map(normalizeLcuSegment)] as const
    }
  }

  return ['lcu', domain, ...resourceSegments.map(normalizeLcuSegment)] as const
}

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
