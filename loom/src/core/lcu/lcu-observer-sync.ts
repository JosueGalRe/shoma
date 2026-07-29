import { useEffect } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import type { LcuTransport } from '@/core/relay/lcu-transport'

interface LcuObserverSyncDescriptor<TDomain> {
  path: string
  queryKey: readonly unknown[]
  parse: (content: unknown) => TDomain | null
  notFoundValue?: TDomain | null
}

export function useLcuObserverSync<TDomain>(
  descriptor: LcuObserverSyncDescriptor<TDomain>,
  transport: LcuTransport | null,
): void {
  const queryClient = useQueryClient()

  // External system sync: LCU observer stream subscription
  const { path } = descriptor
  const { parse } = descriptor
  const { queryKey } = descriptor
  const { notFoundValue } = descriptor

  /* eslint-disable react-doctor/effect-needs-cleanup -- transport.observe() returns a Promise<Unsubscribe>; the cleanup below owns it */
  useEffect(() => {
    if (!transport) {
      return undefined
    }

    const unsubscribe = transport.observe(path, (result) => {
      const parsed = parse(result.content)
      const value = parsed ?? notFoundValue ?? null

      queryClient.setQueryData(queryKey, value)
    })

    return () => {
      unsubscribe
        .then((fn) => {
          return fn()
        })
        .catch(() => {
          // Cleanup errors are safe to ignore.
        })
    }
  }, [path, parse, queryKey, notFoundValue, queryClient, transport])
}
