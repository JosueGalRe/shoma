import { Spinner } from '@/components/ui'

import { gameflowTransitionOverlayStyles } from './gameflow-transition-overlay-styles'
import { getGameflowTransitionLabel } from './gameflow-transition-overlay-utils'

import type { GameflowTransitionOverlayProps } from './gameflow-transition-overlay-types'

export function GameflowTransitionOverlay({ isOpen, targetRoute }: GameflowTransitionOverlayProps) {
  if (!isOpen) {
    return null
  }

  const styles = gameflowTransitionOverlayStyles()
  const label = getGameflowTransitionLabel(targetRoute)

  return (
    <output className={styles.backdrop()} aria-live="polite" aria-busy="true">
      <div className={styles.card()}>
        <Spinner className={styles.spinner()} />

        <p className={styles.label()}>{label}</p>
      </div>
    </output>
  )
}
