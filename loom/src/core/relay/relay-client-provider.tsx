import { createContext, use, useMemo, type ReactNode } from 'react'

import { useRelayClient, type UseRelayClientResult } from '@/core/relay/hooks'
import { createLCUTransport, type LcuTransport } from '@/core/relay/lcu-transport'
import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'

type RelayContextValue = UseRelayClientResult & {
  transport: LcuTransport | null
}

const RelayClientContext = createContext<RelayContextValue | null>(null)

export function RelayClientProvider({ children }: { children: ReactNode }) {
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

export function useSharedRelayClient(): UseRelayClientResult {
  const context = use(RelayClientContext)
  if (!context) {
    throw new Error('useSharedRelayClient must be used within a RelayClientProvider')
  }
  return context
}

export function useSharedLCUTransport(): LcuTransport | null {
  const context = use(RelayClientContext)
  if (!context) {
    throw new Error('useSharedLCUTransport must be used within a RelayClientProvider')
  }
  return context.transport
}
