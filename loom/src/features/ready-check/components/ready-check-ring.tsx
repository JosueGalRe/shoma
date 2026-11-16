import { type ReactNode, useId, useState } from 'react'

import { create, keyframes, props } from '@stylexjs/stylex'

import { READY_CHECK_SECONDS } from '../ready-check-utils'

interface ReadyCheckRingProps {
  children: ReactNode
  // Since the match popped
  elapsedSeconds: number
}

// The Figma's arc around "Match found" (309:60128): a mana-to-white band edged in white, from 3 o'clock clockwise. It
// Is the countdown, so its end draws back to 3 o'clock as the ready check runs out
export function ReadyCheckRing({ children, elapsedSeconds }: ReadyCheckRingProps) {
  const gradientId = useId()
  // Read once: the LCU's timer only moves each second, and the animation runs on its own from here
  // eslint-disable-next-line react/hook-use-state -- Never set
  const [startSeconds] = useState(elapsedSeconds)
  const timing = styles.timing(`${-startSeconds}s`, `${READY_CHECK_SECONDS}s`)

  return (
    <span {...props(styles.ring)}>
      <svg aria-hidden viewBox={`0 0 ${box} ${box}`} {...props(styles.arcs)}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0.46" y2="0.65">
            <stop offset="0" stopColor="#74a9b9" />

            <stop offset="1" stopColor="#fff" />
          </linearGradient>
        </defs>

        <circle
          cx={box / 2}
          cy={box / 2}
          fill="none"
          pathLength={100}
          r={radius}
          stroke="#fff"
          strokeWidth={band + 2}
          {...props(styles.arc, timing)}
        />

        <circle
          cx={box / 2}
          cy={box / 2}
          fill="none"
          pathLength={100}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={band}
          {...props(styles.arc, timing)}
        />
      </svg>

      {children}
    </span>
  )
}

// The Figma's 171px arc, 92.7% hollow, plus its 1px outside stroke
const box = 173
const band = 6.26
const radius = (171 - band) / 2

const drain = keyframes({
  from: { strokeDashoffset: 0 },
  to: { strokeDashoffset: 100 },
})

const styles = create({
  arc: {
    animationFillMode: 'forwards',
    animationName: drain,
    animationTimingFunction: 'linear',
    strokeDasharray: 100,
  },
  arcs: {
    inset: 0,
    position: 'absolute',
  },
  ring: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    height: box,
    justifyContent: 'center',
    marginInline: 'auto',
    position: 'relative',
    width: box,
  },
  // eslint-disable-next-line arrow-body-style
  timing: (delay: string, duration: string) => ({
    animationDelay: delay,
    animationDuration: duration,
  }),
})
