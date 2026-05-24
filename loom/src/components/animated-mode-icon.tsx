import { useEffect, useRef, useState } from 'react'

import { animatedModeIconStyles } from './animated-mode-icon-styles'
import type { AnimatedModeIconProps } from './animated-mode-icon-types'

export function AnimatedModeIcon({ mode, isExpanded }: AnimatedModeIconProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [phase, setPhase] = useState<'intro' | 'active' | 'idle'>('idle')
  const styles = animatedModeIconStyles()

  useEffect(() => {
    if (isExpanded && mode.videoUrlIntro && mode.videoUrlActive && mode.id !== 'tft') {
      setPhase('intro')
    } else {
      setPhase('idle')
    }
  }, [isExpanded, mode.videoUrlIntro, mode.videoUrlActive, mode.id])

  const handleEnded = () => {
    if (phase === 'intro') {
      setPhase('active')
    }
  }

  if (phase === 'idle' || !mode.videoUrlIntro || !mode.videoUrlActive) {
    return (
      <img
        src={isExpanded && mode.iconUrlActive ? mode.iconUrlActive : mode.iconUrl}
        alt=''
        className={styles.image()}
        loading='lazy'
      />
    )
  }

  const src = phase === 'intro' ? mode.videoUrlIntro : mode.videoUrlActive
  const fallbackSrc = isExpanded && mode.iconUrlActive ? mode.iconUrlActive : mode.iconUrl

  return (
    <div className={styles.wrapper()}>
      <img src={fallbackSrc} alt='' className={styles.imageFallback()} loading='lazy' />
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        playsInline
        loop={phase === 'active'}
        onEnded={handleEnded}
        className={styles.video()}
      />
    </div>
  )
}
