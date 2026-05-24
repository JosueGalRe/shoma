import { useMemo } from 'react'

import { useRelayClient } from '@/core/relay/hooks'
import { createLCUTransport } from '@/core/relay/lcu-transport'
import { RelayClientContext } from '@/core/relay/relay-client-context'
import type { RelayClientProviderProps } from '@/core/relay/relay-client-provider-types'
import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'

export function RelayClientProvider({ children }: RelayClientProviderProps) {
  const code = useRelayStore(relayStoreSelectors.code)
  const status = useRelayStore(relayStoreSelectors.status)
  const shouldConnect = status === 'connecting' || status === 'connected'

  const relayClient = useRelayClient({
    code,
    enabled: shouldConnect && code.length > 0,
  })

  const transport = useMemo(() => {
    return relayClient.client ? createLCUTransport(relayClient.client) : null
  }, [relayClient.client])

  const value = useMemo(() => {
    return { ...relayClient, transport }
  }, [relayClient, transport])

  return <RelayClientContext.Provider value={value}>{children}</RelayClientContext.Provider>
}

export { useSharedRelayClient } from '@/core/relay/use-relay-client'
export { useSharedLCUTransport } from '@/core/relay/use-relay-state'
