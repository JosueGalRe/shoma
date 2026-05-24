import { use } from 'react'

import type { UseRelayClientResult } from '@/core/relay/hooks'
import { RelayClientContext } from '@/core/relay/relay-client-context'

export function useSharedRelayClient(): UseRelayClientResult {
  const context = use(RelayClientContext)
  if (!context) {
    throw new Error('useSharedRelayClient must be used within a RelayClientProvider')
  }
  return context
}
