import type { ReactNode } from 'react'

export interface AppShellProps {
  children: ReactNode
  // Room for Social's panel beside the screens, in a wide window once connected
  wide?: boolean
}
