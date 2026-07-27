import type { ReactNode } from 'react'

export interface InvitePlayerRowProps {
  disabled: boolean
  icon: ReactNode
  name: string
  onToggle: () => void
  selected: boolean
}
