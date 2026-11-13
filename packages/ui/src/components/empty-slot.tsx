import type { ReactNode } from 'react'

import { Button as BaseButton } from '@base-ui/react/button'
import { create, props } from '@stylexjs/stylex'

import { color } from '../tokens/color.stylex'

import type { StyleXStyles } from '@stylexjs/stylex'

export type EmptySlotProps = Omit<BaseButton.Props, 'aria-label' | 'children' | 'className' | 'style'> & {
  // Icon-only, so the accessible name is required ("Pick a champion", "Invite a friend")
  'aria-label': string
  icon: ReactNode
  // Other sizes the screens use (40, 60): set width and height here
  style?: StyleXStyles
  variant?: 'champion' | 'friend'
}

// Figma "Champion Slot" (Slots/Square/Empty): a dotted mana-500 square for an unpicked champion, rune or spell, or a
// Dotted circle to invite a friend
export function EmptySlot({ disabled = false, icon, style, variant = 'champion', ...rest }: EmptySlotProps) {
  return (
    <BaseButton {...rest} disabled={disabled} {...props(styles.base, variants[variant], disabled && styles.disabled, style)}>
      {icon}
    </BaseButton>
  )
}

const styles = create({
  base: {
    WebkitTapHighlightColor: 'transparent',
    alignItems: 'center',
    backgroundColor: { ':active': color.pressed, default: 'transparent' },
    borderColor: color.primary,
    borderStyle: 'dotted',
    boxSizing: 'border-box',
    color: color.icon,
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    height: 80,
    justifyContent: 'center',
    margin: 0,
    outlineColor: color.focusRing,
    outlineOffset: 2,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    padding: 0,
    touchAction: 'manipulation',
    transitionDuration: '150ms',
    transitionProperty: 'background-color',
    transitionTimingFunction: 'ease-out',
    userSelect: 'none',
    width: 80,
  },
  // Figma State=Disabled (champion type only, e.g. a teammate's slot)
  disabled: {
    backgroundColor: 'transparent',
    borderColor: color.slotDisabled,
    color: color.slotIconDisabled,
    cursor: 'default',
  },
})

// Figma property Type, renamed since a button already has a type
const variants = create({
  champion: { borderWidth: 2 },
  friend: { borderRadius: '50%', borderWidth: 1 },
})
