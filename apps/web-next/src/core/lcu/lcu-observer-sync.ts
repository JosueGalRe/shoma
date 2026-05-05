import { useEffect } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import type { LcuTransport } from '@/core/rift/lcu-transport'

type LcuObserverSyncDescriptor<TDomain> = {
  path: string
  queryKey: readonly unknown[]
  parse: (content: unknown) => TDomain | null
}

export function useLcuObserverSync<TDomain>(descriptor: LcuObserverSyncDescriptor<TDomain>, transport: LcuTransport | null): void {
  const queryClient = useQueryClient()

  // External system sync: LCU observer stream subscription
  useEffect(() => {
    if (!transport) {
      return undefined
    }

    const unsubscribe = transport.observe(descriptor.path, (result) => {
      const parsed = descriptor.parse(result.content)
      if (parsed !== null) {
        queryClient.setQueryData(descriptor.queryKey, parsed)
      }
    })

    return () => {
      unsubscribe.then((fn) => fn()).catch(() => {
        // Cleanup errors are safe to ignore.
      })
    }
  }, [descriptor, queryClient, transport])
}
