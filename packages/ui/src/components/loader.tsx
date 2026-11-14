import { create, keyframes, props } from '@stylexjs/stylex'

import { color } from '../tokens/color.stylex'

import type { StyleXStyles } from '@stylexjs/stylex'

export interface LoaderProps {
  // Read by screen readers instead of the spinner ("Connecting")
  'aria-label': string
  style?: StyleXStyles
}

// Figma "Loader": a thin mana ring that fades along its length and spins around a still dot
export function Loader({ 'aria-label': ariaLabel, style }: LoaderProps) {
  return (
    <div aria-label={ariaLabel} role="progressbar" {...props(styles.loader, style)}>
      <span {...props(styles.ring)} />

      <span {...props(styles.dot)} />
    </div>
  )
}

const spin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
})

const styles = create({
  dot: {
    backgroundColor: color.icon,
    borderRadius: '50%',
    height: 4,
    position: 'absolute',
    width: 4,
  },
  loader: {
    alignItems: 'center',
    display: 'inline-flex',
    flexShrink: 0,
    height: 48,
    justifyContent: 'center',
    position: 'relative',
    width: 48,
  },
  ring: {
    animationDuration: { '@media (prefers-reduced-motion: reduce)': '3s', default: '1s' },
    animationIterationCount: 'infinite',
    animationName: spin,
    animationTimingFunction: 'linear',
    // The Figma's arc: 332deg long, transparent mana-400 to mana-600
    backgroundImage: `conic-gradient(rgb(116 169 185 / 0%), ${color.loader} 332deg, transparent 332deg)`,
    borderRadius: '50%',
    inset: 0,
    // Keeps a 2px ring of the gradient
    maskImage: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))',
    position: 'absolute',
  },
})
