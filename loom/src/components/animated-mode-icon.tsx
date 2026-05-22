import { useEffect, useRef, useState } from 'react'

export type AnimatedIconMode = {
  id: string
  iconUrl: string
  iconUrlActive?: string
  videoUrlIntro?: string
  videoUrlActive?: string
}

export function AnimatedModeIcon({ mode, isExpanded }: { mode: AnimatedIconMode; isExpanded: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [phase, setPhase] = useState<'intro' | 'active' | 'idle'>('idle')

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
        className='h-full w-full object-contain drop-shadow-md'
        loading='lazy'
      />
    )
  }

  const src = phase === 'intro' ? mode.videoUrlIntro : mode.videoUrlActive
  const fallbackSrc = isExpanded && mode.iconUrlActive ? mode.iconUrlActive : mode.iconUrl

  return (
    <div className='relative h-full w-full'>
      <img src={fallbackSrc} alt='' className='absolute inset-0 h-full w-full object-contain drop-shadow-md' loading='lazy' />
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        playsInline
        loop={phase === 'active'}
        onEnded={handleEnded}
        className='relative z-10 h-full w-full object-contain'
      />
    </div>
  )
}
