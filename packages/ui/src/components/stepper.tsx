import { Progress } from '@base-ui/react/progress'
import { create, props } from '@stylexjs/stylex'

import { color } from '../tokens/color.stylex'

import type { StyleXStyles } from '@stylexjs/stylex'

export interface StepperProps {
  'aria-label': string
  // Read instead of the number, e.g. "Paso 1 de 3"
  'aria-valuetext'?: string
  // 1-based
  step: number
  steps?: number
  style?: StyleXStyles
}

// Figma "Stepper": the create-lobby flow's progress, one 4px segment per step, lit in mana-500 up to the current one
export function Stepper({ step, steps = 3, style, ...rest }: StepperProps) {
  return (
    <Progress.Root {...rest} max={steps} min={0} value={step} {...props(styles.root, style)}>
      {Array.from({ length: steps }, (_, index) => {
        return <span key={index} {...props(styles.segment, index < step && styles.done)} />
      })}
    </Progress.Root>
  )
}

const styles = create({
  done: {
    backgroundColor: color.primary,
  },
  root: {
    display: 'flex',
    gap: 8,
    width: '100%',
  },
  segment: {
    backgroundColor: color.stepTodo,
    flexGrow: 1,
    height: 4,
    transitionDuration: { '@media (prefers-reduced-motion: reduce)': '0s', default: '200ms' },
    transitionProperty: 'background-color',
    transitionTimingFunction: 'ease-out',
  },
})
