import { Button } from '@shoma/ui/button'
import { createPortal } from 'react-dom'

import type { ChampSelectActionProps } from './champ-select-screen-types'

// A panel's button, drawn in the screen's "Bottom Action" below the teams, where the Figma puts it
export function ChampSelectAction({ disabled, label, onClick, slot }: ChampSelectActionProps) {
  if (!slot) {
    return null
  }

  return createPortal(
    <Button disabled={disabled} onClick={onClick}>
      {label}
    </Button>,
    slot,
  )
}
