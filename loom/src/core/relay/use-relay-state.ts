import { use } from 'react'

import type { LcuTransport } from '@/core/relay/lcu-transport'
import { RelayClientContext } from '@/core/relay/relay-client-context'

export function useSharedLCUTransport(): LcuTransport | null {
  const context = use(RelayClientContext)
  if (!context) {
    throw new Error('useSharedLCUTransport must be used within a RelayClientProvider')
  }
  return context.transport
}
