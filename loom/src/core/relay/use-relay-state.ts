import { use } from 'react'

import { RelayClientContext } from '@/core/relay/relay-client-context'
import type { LcuTransport } from '@/core/relay/lcu-transport'

export function useSharedLCUTransport(): LcuTransport | null {
  const context = use(RelayClientContext)
  if (!context) {
    throw new Error('useSharedLCUTransport must be used within a RelayClientProvider')
  }
  return context.transport
}
