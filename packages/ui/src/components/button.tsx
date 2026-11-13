import { Button as BaseButton } from '@base-ui/react/button'
import { create, props } from '@stylexjs/stylex'

import { text } from '../text'
import { color } from '../tokens/color.stylex'

import type { StyleXStyles } from '@stylexjs/stylex'

// Figma "Button" (UI KIT): Medium only exists for Tertiary
type ButtonVariantProps =
  | { size?: 'large'; variant?: 'primary' | 'secondary' }
  | { size?: 'large' | 'medium'; variant: 'tertiary' }

export type ButtonProps = Omit<BaseButton.Props, 'className' | 'style'> & ButtonVariantProps & { style?: StyleXStyles }

export function Button({ disabled = false, size = 'large', style, variant = 'primary', ...rest }: ButtonProps) {
  return (
    <BaseButton
      {...rest}
      disabled={disabled}
      {...props(
        styles.base,
        size === 'large' ? text.marcellus16 : text.marcellus13,
        size === 'medium' && styles.medium,
        variant !== 'tertiary' && styles.dots,
        variants[variant],
        disabled && disabledVariants[variant],
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
    borderWidth: 1,
    boxSizing: 'border-box',
    color: color.text,
    cursor: 'pointer',
    display: 'inline-flex',
    gap: 10,
    justifyContent: 'center',
    margin: 0,
    minHeight: 48,
    outlineColor: color.focusRing,
    outlineOffset: 2,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    paddingBlock: 8,
    paddingInline: 16,
    textTransform: 'uppercase',
    touchAction: 'manipulation',
    transitionDuration: '150ms',
    transitionProperty: 'background-color, border-color, box-shadow, color',
    transitionTimingFunction: 'ease-out',
    userSelect: 'none',
  },
  // The "• LABEL •" dots of Primary and Secondary
  dots: {
    '::after': { backgroundColor: 'currentColor', borderRadius: '50%', content: '""', flexShrink: 0, height: 4, width: 4 },
    '::before': { backgroundColor: 'currentColor', borderRadius: '50%', content: '""', flexShrink: 0, height: 4, width: 4 },
  },
  medium: {
    minHeight: 32,
    paddingInline: 8,
  },
})

const variants = create({
  primary: {
    backgroundImage: { ':active': color.primaryGradientPressed, default: color.primaryGradient },
    borderColor: color.borderStrong,
    boxShadow: { ':active': 'inset 0 2px 4px rgb(20 40 46 / 45%)', default: '0 4px 4px rgb(134 134 134 / 25%)' },
  },
  secondary: {
    backgroundColor: { ':active': color.pressed, default: 'transparent' },
    borderColor: color.borderStrong,
  },
  tertiary: {
    backgroundColor: { ':active': color.pressed, default: 'transparent' },
    borderWidth: 0,
    color: color.textAction,
    paddingInline: 8,
  },
})

// Later in props() than variants, so they replace the :active values too
const disabledVariants = create({
  primary: {
    backgroundImage: color.primaryGradientDisabled,
    borderColor: color.borderDisabled,
    boxShadow: 'none',
    color: color.textDisabled,
    cursor: 'default',
  },
  secondary: {
    backgroundColor: color.pressed,
    borderColor: 'transparent',
    color: color.textDisabled,
    cursor: 'default',
  },
  tertiary: {
    backgroundColor: color.pressed,
    color: color.textDisabled,
    cursor: 'default',
  },
})
