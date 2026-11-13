import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import { create, defaultMarker, props, when } from '@stylexjs/stylex'
import { Check } from 'lucide-react'

import { text } from '../text'
import { color } from '../tokens/color.stylex'

import type { StyleXStyles } from '@stylexjs/stylex'

export type CheckboxProps = Omit<BaseCheckbox.Root.Props, 'className' | 'style'> & {
  label: string
  // Overrides the label row's text style
  style?: StyleXStyles
}

// Figma "Checkbox": an 18px shimmer-400 outline, with a check when selected, beside a Body 1 label
export function Checkbox({ label, style, ...rest }: CheckboxProps) {
  return (
    <label {...props(text.body1, styles.row, style)}>
      <BaseCheckbox.Root
        {...rest}
        className={(state) => {
          return props(defaultMarker(), styles.control, state.disabled && styles.controlDisabled).className
        }}
      >
        <BaseCheckbox.Indicator {...props(styles.indicator)}>
          <Check size={14} strokeWidth={3} />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>

      {label}
    </label>
  )
}

const styles = create({
  control: {
    '::before': {
      borderColor: color.control,
      borderStyle: 'solid',
      borderWidth: 2,
      boxSizing: 'border-box',
      content: '""',
      height: 18,
      position: 'absolute',
      width: 18,
    },
    WebkitTapHighlightColor: 'transparent',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: color.control,
    cursor: 'inherit',
    display: 'flex',
    flexShrink: 0,
    height: 32,
    justifyContent: 'center',
    margin: 0,
    outlineColor: color.focusRing,
    outlineOffset: 0,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    padding: 0,
    position: 'relative',
    width: 32,
  },
  controlDisabled: {
    '::before': { borderColor: color.textDisabled },
    color: color.textDisabled,
  },
  indicator: {
    display: 'flex',
  },
  row: {
    WebkitTapHighlightColor: 'transparent',
    alignItems: 'center',
    // Dims with the control, whether the item or its whole group is disabled
    color: { default: color.text, [when.descendant('[data-disabled]')]: color.textDisabled },
    cursor: { default: 'pointer', [when.descendant('[data-disabled]')]: 'default' },
    display: 'flex',
    gap: 12,
    userSelect: 'none',
  },
})
