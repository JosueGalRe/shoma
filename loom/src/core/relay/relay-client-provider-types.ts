import type { UseRelayClientResult } from '@/core/relay/hooks'
import type { LcuTransport } from '@/core/relay/lcu-transport'
import type { ReactNode } from 'react'

export type RelayClientProviderProps = {
  children: ReactNode
}

export type RelayContextValue = UseRelayClientResult & {
  transport: LcuTransport | null
}
