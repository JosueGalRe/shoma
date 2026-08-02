import type { ReactNode } from 'react'

export interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  dragHandleAriaLabel?: string
  tall?: boolean
  flush?: boolean
}
