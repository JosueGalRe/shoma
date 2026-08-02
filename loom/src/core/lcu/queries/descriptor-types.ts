import type { LcuTransport } from '../../relay/lcu-transport'

export interface LcuQueryDescriptor<TDomain> {
  path: string
  queryKey: readonly unknown[]
  parse: (content: unknown) => TDomain | null
  enabled?: (transport: LcuTransport | null) => boolean
  notFoundValue?: TDomain | null
  staleTime?: number
}
