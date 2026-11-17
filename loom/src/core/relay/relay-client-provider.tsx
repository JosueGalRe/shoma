import { useMemo } from 'react'

import { useRelayClient } from '@/core/relay/hooks'
import { createLCUTransport } from '@/core/relay/lcu-transport'
import { RelayClientContext } from '@/core/relay/relay-client-context'
import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'

import type { RelayClientProviderProps } from '@/core/relay/relay-client-provider-types'

export function RelayClientProvider({ children }: RelayClientProviderProps) {
  const code = useRelayStore(relayStoreSelectors.code)
  const status = useRelayStore(relayStoreSelectors.status)
  // A lost session keeps its client, which tries again on its own
  const shouldConnect = status === 'connecting' || status === 'connected' || status === 'lost'

  const { client, state } = useRelayClient({
    code,
    enabled: shouldConnect && code.length > 0,
  })

  // One transport per client: it resubscribes its observers when the client comes back
  const transport = useMemo(() => {
    return client ? createLCUTransport(client) : null
  }, [client])

  const value = useMemo(() => {
    return { client, state, transport }
  }, [client, state, transport])

  return <RelayClientContext.Provider value={value}>{children}</RelayClientContext.Provider>
}
