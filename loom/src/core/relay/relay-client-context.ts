import { createContext } from 'react'

import type { RelayContextValue } from '@/core/relay/relay-client-provider-types'

export const RelayClientContext = createContext<RelayContextValue | null>(null)
