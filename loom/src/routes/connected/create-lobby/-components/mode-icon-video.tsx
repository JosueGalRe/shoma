import { useState } from 'react'

import { create, props } from '@stylexjs/stylex'

import type { ModeIconVideoProps } from './create-lobby-steps-types'

// The client's pick animation: the intro once, then the active loop. Mounted only while picked, so a new pick restarts it
export function ModeIconVideo({ activeVideo, introVideo }: ModeIconVideoProps) {
  const [isLooping, setIsLooping] = useState(introVideo === undefined)

  return (
    <video
      aria-hidden
      autoPlay
      loop={isLooping}
      muted
      playsInline
      src={isLooping ? activeVideo : introVideo}
      tabIndex={-1}
      onEnded={() => {
        setIsLooping(true)
      }}
      {...props(styles.video)}
    />
  )
}

const styles = create({
  video: {
    // Reduced motion keeps the still active icon underneath
    display: { '@media (prefers-reduced-motion: reduce)': 'none', default: 'block' },
    height: '100%',
    inset: 0,
    objectFit: 'contain',
    position: 'absolute',
    width: '100%',
  },
})
