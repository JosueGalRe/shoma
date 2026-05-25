import { useEffect, useRef } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'

const LCU_QUERY_KEY_PREFIX = ['lcu'] as const

/**
 * Clears all LCU query cache when the Relay connection is disconnected.
 * This prevents stale data from leaking across sessions when a user
 * reconnects with a different code.
 */
export function useLcuCacheClear(): void {
  const queryClient = useQueryClient()
  const status = useRelayStore(relayStoreSelectors.status)
  const previousStatus = useRef(status)

  useEffect(() => {
    const wasConnected = previousStatus.current === 'connecting' || previousStatus.current === 'connected'
    const isDisconnected = status === 'disconnected' || status === 'idle' || status === 'error'

    if (wasConnected && isDisconnected) {
      queryClient.removeQueries({ exact: false, queryKey: LCU_QUERY_KEY_PREFIX })
    }

    previousStatus.current = status
  }, [status, queryClient])
}
