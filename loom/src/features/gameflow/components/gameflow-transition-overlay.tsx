import { Loader } from '@shoma/ui/loader'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

import { getGameflowTransitionLabel } from './gameflow-transition-overlay-utils'

import type { GameflowTransitionOverlayProps } from './gameflow-transition-overlay-types'

export function GameflowTransitionOverlay({ isOpen, targetRoute }: GameflowTransitionOverlayProps) {
  if (!isOpen) {
    return null
  }

  const label = getGameflowTransitionLabel(targetRoute)

  return (
    <output aria-busy="true" aria-live="polite" {...props(styles.backdrop)}>
      <span aria-hidden>
        <Loader aria-label={label} />
      </span>

      <p {...props(text.body2, styles.label)}>{label}</p>
    </output>
  )
}

const styles = create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: color.overlay,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    inset: 0,
    justifyContent: 'center',
    padding: 16,
    position: 'fixed',
    zIndex: 40,
  },
  label: {
    color: color.text,
    margin: 0,
    textAlign: 'center',
  },
})
