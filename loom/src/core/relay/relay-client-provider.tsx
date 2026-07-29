import { useMemo } from 'react'

import { useRelayClient } from '@/core/relay/hooks'
import { createLCUTransport } from '@/core/relay/lcu-transport'
import { RelayClientContext } from '@/core/relay/relay-client-context'
import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'

import type { RelayClientProviderProps } from '@/core/relay/relay-client-provider-types'

export function RelayClientProvider({ children }: RelayClientProviderProps) {
  const code = useRelayStore(relayStoreSelectors.code)
  const status = useRelayStore(relayStoreSelectors.status)
  const shouldConnect = status === 'connecting' || status === 'connected'

  const relayClient = useRelayClient({
    code,
    enabled: shouldConnect && code.length > 0,
  })

  const value = useMemo(() => {
    return { ...relayClient, transport: relayClient.client ? createLCUTransport(relayClient.client) : null }
  }, [relayClient])

  return <RelayClientContext.Provider value={value}>{children}</RelayClientContext.Provider>
}
