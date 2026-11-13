import type { ReactNode } from 'react'

import { Switch as BaseSwitch } from '@base-ui/react/switch'
import { create, props } from '@stylexjs/stylex'

import { color } from '../tokens/color.stylex'

import type { StyleXStyles } from '@stylexjs/stylex'

export type SwitchProps = Omit<BaseSwitch.Root.Props, 'aria-label' | 'className' | 'style'> & {
  // No visible label of its own: the screens show the state as text beside it ("OPEN PARTY")
  'aria-label': string
  // Drawn inside the thumb, like the Figma's group icon on the party switch
  icon?: ReactNode
  style?: StyleXStyles
}

// Figma "Switch" (the "Active" states the screens use): grey track when off, shimmer-900 when on, white thumb
export function Switch({ disabled = false, icon, style, ...rest }: SwitchProps) {
  return (
    <BaseSwitch.Root
      {...rest}
      disabled={disabled}
      className={(state) => {
        return props(
          styles.track,
          state.checked && styles.trackOn,
          disabled && (state.checked ? styles.trackOnDisabled : styles.trackOffDisabled),
          style,
        ).className
      }}
    >
      <BaseSwitch.Thumb
        className={(state) => {
          return props(
            styles.thumb,
            state.checked && styles.thumbOn,
            disabled && (state.checked ? styles.thumbOnDisabled : styles.thumbOffDisabled),
          ).className
        }}
      >
        {icon}
      </BaseSwitch.Thumb>
    </BaseSwitch.Root>
  )
}

const styles = create({
  thumb: {
    alignItems: 'center',
    backgroundColor: color.text,
    borderRadius: '50%',
    color: color.iconOnLight,
    display: 'flex',
    height: 20,
    justifyContent: 'center',
    transform: 'translateX(0)',
    transitionDuration: { '@media (prefers-reduced-motion: reduce)': '0s', default: '150ms' },
    transitionProperty: 'transform, background-color',
    transitionTimingFunction: 'ease-out',
    width: 20,
  },
  thumbOffDisabled: {
    backgroundColor: color.textDisabled,
  },
  // 53px track - 2 x 3px inset - 1px border each side - 20px thumb
  thumbOn: {
    transform: 'translateX(25px)',
  },
  thumbOnDisabled: {
    backgroundColor: color.trackOnDisabled,
  },
  track: {
    WebkitTapHighlightColor: 'transparent',
    alignItems: 'center',
    backgroundColor: color.trackOff,
    borderColor: color.text,
    borderRadius: 999,
    borderStyle: 'solid',
    borderWidth: 1,
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    height: 28,
    margin: 0,
    outlineColor: color.focusRing,
    outlineOffset: 2,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    paddingInline: 3,
    transitionDuration: '150ms',
    transitionProperty: 'background-color, border-color',
    transitionTimingFunction: 'ease-out',
    width: 53,
  },
  trackOffDisabled: {
    backgroundColor: color.trackOffDisabled,
    borderColor: color.border,
    cursor: 'default',
  },
  trackOn: {
    backgroundColor: color.trackOn,
  },
  trackOnDisabled: {
    borderColor: color.trackOnDisabled,
    cursor: 'default',
  },
})
