import type { ReactNode } from 'react'

import type { UseRelayClientResult } from '@/core/relay/hooks'
import type { LcuTransport } from '@/core/relay/lcu-transport'

export type RelayClientProviderProps = {
  children: ReactNode
}

export type RelayContextValue = UseRelayClientResult & {
  transport: LcuTransport | null
}
