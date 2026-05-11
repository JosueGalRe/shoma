import { createContext, use, useMemo, type ReactNode } from 'react'

import { useRiftClient, type UseRiftClientResult } from '@/core/rift/hooks'
import { createLCUTransport, type LcuTransport } from '@/core/rift/lcu-transport'
import { riftStoreSelectors, useRiftStore } from '@/core/state/rift-store'

type RiftContextValue = UseRiftClientResult & {
  transport: LcuTransport | null
}

const RiftClientContext = createContext<RiftContextValue | null>(null)

export function RiftClientProvider({ children }: { children: ReactNode }) {
  const code = useRiftStore(riftStoreSelectors.code)
  const status = useRiftStore(riftStoreSelectors.status)
  const shouldConnect = status === 'connecting' || status === 'connected'

  const riftClient = useRiftClient({
    code,
    enabled: shouldConnect && code.length > 0,
  })

  const transport = useMemo(() => (riftClient.client ? createLCUTransport(riftClient.client) : null), [riftClient.client])

  const value = useMemo(() => ({ ...riftClient, transport }), [riftClient, transport])

  return (
    <RiftClientContext.Provider value={value}>
      {children}
    </RiftClientContext.Provider>
  )
}

export function useSharedRiftClient(): UseRiftClientResult {
  const context = use(RiftClientContext)
  if (!context) {
    throw new Error('useSharedRiftClient must be used within a RiftClientProvider')
  }
  return context
}

export function useSharedLCUTransport(): LcuTransport | null {
  const context = use(RiftClientContext)
  if (!context) {
    throw new Error('useSharedLCUTransport must be used within a RiftClientProvider')
  }
  return context.transport
}
