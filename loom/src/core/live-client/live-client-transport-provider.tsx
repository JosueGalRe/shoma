import { type ReactNode, use, useMemo } from 'react'

import { RelayClientContext } from '@/core/relay/relay-client-context'

import { LiveClientTransport, LiveClientTransportContext } from './live-client-transport'

interface LiveClientTransportProviderProps {
  children: ReactNode
}

export function LiveClientTransportProvider({ children }: LiveClientTransportProviderProps) {
  const relayContext = use(RelayClientContext)
  const relayClient = relayContext?.client ?? null

  const value = useMemo(() => {
    return { transport: relayClient ? new LiveClientTransport(relayClient) : null }
  }, [relayClient])

  return <LiveClientTransportContext.Provider value={value}>{children}</LiveClientTransportContext.Provider>
}
