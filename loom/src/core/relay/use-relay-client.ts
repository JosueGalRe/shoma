import { use } from 'react'

import { RelayClientContext } from '@/core/relay/relay-client-context'

import type { UseRelayClientResult } from '@/core/relay/hooks'

export function useSharedRelayClient(): UseRelayClientResult {
  const context = use(RelayClientContext)

  if (!context) {
    throw new Error('useSharedRelayClient must be used within a RelayClientProvider')
  }

  return context
}
