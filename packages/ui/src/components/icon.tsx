import { create, props } from '@stylexjs/stylex'

import { icons } from '../icon-paths'
import { color } from '../tokens/color.stylex'

import type { IconName, IconPaths } from '../icon-paths'
import type { StyleXStyles } from '@stylexjs/stylex'

export type { IconName }

export interface IconProps {
  name: IconName
  // The screens use 14 to 41
  size?: number
  style?: StyleXStyles
}

// Figma "Icons" (UI KIT), drawn in currentColor. Decorative: the control that holds it carries the label.
export function Icon({ name, size = 24, style }: IconProps) {
  const { main, muted = [] }: IconPaths = icons[name]

  return (
    <svg aria-hidden fill="currentColor" height={size} viewBox="0 0 24 24" width={size} {...props(styles.base, style)}>
      {main.map((d) => {
        return <path key={d} d={d} />
      })}

      {muted.map((d) => {
        return <path key={d} d={d} {...props(styles.muted)} />
      })}
    </svg>
  )
}

const styles = create({
  base: {
    flexShrink: 0,
  },
  muted: {
    fill: color.iconMuted,
  },
})
