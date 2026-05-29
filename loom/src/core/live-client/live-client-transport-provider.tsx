import { type ReactNode, use } from 'react'

import { RelayClientContext } from '@/core/relay/relay-client-context'

import { LiveClientTransport, LiveClientTransportContext } from './live-client-transport'

interface LiveClientTransportProviderProps {
  children: ReactNode
}

export function LiveClientTransportProvider({ children }: LiveClientTransportProviderProps) {
  const relayContext = use(RelayClientContext)
  const relayClient = relayContext?.client ?? null

  const transport = relayClient ? new LiveClientTransport(relayClient) : null
  const value = { transport }

  return <LiveClientTransportContext.Provider value={value}>{children}</LiveClientTransportContext.Provider>
}
