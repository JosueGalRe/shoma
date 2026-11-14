import { Button as BaseButton } from '@base-ui/react/button'
import { create, props } from '@stylexjs/stylex'

import { color } from '../tokens/color.stylex'

import type { StyleXStyles } from '@stylexjs/stylex'

// Figma "Button" icon set (UI KIT): Type=Default and Filled; Large Default is the bordered one. Its "Outline" type is Small
// Default without a border, so it is not a variant here. Icons are 24px, 32px in Large.
export type IconButtonProps = Omit<BaseButton.Props, 'aria-label' | 'className' | 'style'> & {
  // Icon-only, so the accessible name is required
  'aria-label': string
  size?: 'large' | 'medium' | 'small'
  style?: StyleXStyles
  variant?: 'default' | 'filled'
}

export function IconButton({ disabled = false, size = 'medium', style, variant = 'default', ...rest }: IconButtonProps) {
  return (
    <BaseButton
      {...rest}
      disabled={disabled}
      {...props(
        styles.base,
        sizes[size],
        variants[variant],
        variant === 'default' && size === 'large' && styles.bordered,
        disabled && styles.disabled,
        style,
      )}
    />
  )
}

const styles = create({
  base: {
    WebkitTapHighlightColor: 'transparent',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderStyle: 'solid',
    borderWidth: 0,
    boxSizing: 'border-box',
    color: color.icon,
    cursor: 'pointer',
    display: 'inline-flex',
    flexShrink: 0,
    justifyContent: 'center',
    margin: 0,
    outlineColor: color.focusRing,
    outlineOffset: 2,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    padding: 0,
    touchAction: 'manipulation',
    transitionDuration: '150ms',
    transitionProperty: 'background-color, border-color, color',
    transitionTimingFunction: 'ease-out',
    userSelect: 'none',
  },
  bordered: {
    borderColor: color.borderStrong,
    borderWidth: 1,
  },
  // Later in props() than the variants, so it replaces their :active values too
  disabled: {
    backgroundColor: 'transparent',
    borderColor: color.borderDisabled,
    color: color.textDisabled,
    cursor: 'default',
  },
})

const sizes = create({
  large: { height: 48, width: 48 },
  medium: { height: 40, width: 40 },
  small: { height: 32, width: 32 },
})

const variants = create({
  // Pressed is not in the Figma: same wash as the text Button
  default: {
    backgroundColor: { ':active': color.pressed, default: 'transparent' },
  },
  filled: {
    backgroundColor: { ':active': color.accentPressed, default: color.accent },
    borderColor: color.text,
    borderWidth: 1,
    color: color.text,
  },
})
