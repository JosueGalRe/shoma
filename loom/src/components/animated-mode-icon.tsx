import { useState } from 'react'

import { animatedModeIconStyles } from './animated-mode-icon-styles'

import type { AnimatedModeIconProps } from './animated-mode-icon-types'

export function AnimatedModeIcon({ mode, isExpanded }: AnimatedModeIconProps) {
  const [completedSession, setCompletedSession] = useState<string | null>(null)
  const styles = animatedModeIconStyles()

  const canAnimate = Boolean(isExpanded && mode.videoUrlIntro && mode.videoUrlActive && mode.id !== 'tft')
  const animationSession = `${mode.id}:${isExpanded ? 'expanded' : 'collapsed'}:${mode.videoUrlIntro ?? ''}:${mode.videoUrlActive ?? ''}`
  let phase: 'active' | 'idle' | 'intro'

  if (!canAnimate) {
    phase = 'idle'
  } else if (completedSession === animationSession) {
    phase = 'active'
  } else {
    phase = 'intro'
  }

  const handleEnded = () => {
    if (phase === 'intro') {
      setCompletedSession(animationSession)
    }
  }

  if (phase === 'idle') {
    return (
      <img
        src={isExpanded && mode.iconUrlActive ? mode.iconUrlActive : mode.iconUrl}
        alt=""
        className={styles.image()}
        loading="lazy"
      />
    )
  }

  const src = phase === 'intro' ? mode.videoUrlIntro : mode.videoUrlActive
  const fallbackSrc = isExpanded && mode.iconUrlActive ? mode.iconUrlActive : mode.iconUrl

  return (
    <div className={styles.wrapper()}>
      <img src={fallbackSrc} alt="" className={styles.imageFallback()} loading="lazy" />

      <video
        src={src}
        autoPlay
        muted
        playsInline
        loop={phase === 'active'}
        onEnded={handleEnded}
        aria-label="Animated mode preview"
        tabIndex={-1}
        className={styles.video()}
      />
    </div>
  )
}
