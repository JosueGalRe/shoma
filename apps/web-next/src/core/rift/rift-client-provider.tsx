import { createContext, use, type ReactNode } from 'react'

import { useRiftClient, type UseRiftClientResult } from '@/core/rift/hooks'
import { useRiftStore } from '@/core/state/rift-store'

const RiftClientContext = createContext<UseRiftClientResult | null>(null)

export function RiftClientProvider({ children }: { children: ReactNode }) {
  const code = useRiftStore((state) => state.code)
  const status = useRiftStore((state) => state.status)
  const shouldConnect = status === 'connecting' || status === 'connected'

  const riftClient = useRiftClient({
    code,
    enabled: shouldConnect && code.length > 0,
  })

  return (
    <RiftClientContext.Provider value={riftClient}>
      {children}
    </RiftClientContext.Provider>
  )
}

export function useSharedRiftClient(): UseRiftClientResult {
  const context = use(RiftClientContext)
  if (!context) {
    throw new Error('useSharedRiftClient must be used within RiftClientProvider')
  }
  return context
}
