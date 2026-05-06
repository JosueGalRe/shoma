import { useEffect } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import type { LcuTransport } from '@/core/rift/lcu-transport'

type LcuObserverSyncDescriptor<TDomain> = {
  path: string
  queryKey: readonly unknown[]
  parse: (content: unknown) => TDomain | null
  notFoundValue?: TDomain | null
}

export function useLcuObserverSync<TDomain>(descriptor: LcuObserverSyncDescriptor<TDomain>, transport: LcuTransport | null): void {
  const queryClient = useQueryClient()

  // External system sync: LCU observer stream subscription
  const path = descriptor.path
  const parse = descriptor.parse
  const queryKey = descriptor.queryKey
  const notFoundValue = descriptor.notFoundValue

  useEffect(() => {
    if (!transport) {
      return undefined
    }

    const unsubscribe = transport.observe(path, (result) => {
      const parsed = parse(result.content)
      queryClient.setQueryData(queryKey, parsed ?? notFoundValue ?? null)
    })

    return () => {
      unsubscribe.then((fn) => fn()).catch(() => {
        // Cleanup errors are safe to ignore.
      })
    }
  }, [path, parse, queryKey, notFoundValue, queryClient, transport])
}
