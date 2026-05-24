import { createContext, useMemo } from 'react'

import { useRelayClient } from '@/core/relay/hooks'
import { createLCUTransport } from '@/core/relay/lcu-transport'
import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'
import type { RelayClientProviderProps, RelayContextValue } from '@/core/relay/relay-client-provider-types'

export const RelayClientContext = createContext<RelayContextValue | null>(null)

export function RelayClientProvider({ children }: RelayClientProviderProps) {
  const code = useRelayStore(relayStoreSelectors.code)
  const status = useRelayStore(relayStoreSelectors.status)
  const shouldConnect = status === 'connecting' || status === 'connected'

  const relayClient = useRelayClient({
    code,
    enabled: shouldConnect && code.length > 0,
  })

  const transport = useMemo(() => (relayClient.client ? createLCUTransport(relayClient.client) : null), [relayClient.client])

  const value = useMemo(() => ({ ...relayClient, transport }), [relayClient, transport])

  return <RelayClientContext.Provider value={value}>{children}</RelayClientContext.Provider>
}

export { useSharedRelayClient } from '@/core/relay/use-relay-client'
export { useSharedLCUTransport } from '@/core/relay/use-relay-state'
