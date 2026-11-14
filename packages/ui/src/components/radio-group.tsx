import { Radio as BaseRadio } from '@base-ui/react/radio'
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group'
import { create, defaultMarker, props, when } from '@stylexjs/stylex'

import { text } from '../text'
import { color } from '../tokens/color.stylex'

import type { StyleXStyles } from '@stylexjs/stylex'

export type RadioGroupProps<Value> = Omit<BaseRadioGroup.Props<Value>, 'className' | 'style'> & { style?: StyleXStyles }

export function RadioGroup<Value>({ style, ...rest }: RadioGroupProps<Value>) {
  return <BaseRadioGroup<Value> {...rest} {...props(styles.group, style)} />
}

export type RadioProps = Omit<BaseRadio.Root.Props, 'className' | 'style'> & {
  label: string
  // Overrides the label row, e.g. the uppercase Marcellus labels of the custom game screen
  style?: StyleXStyles
}

// Figma "Radio Button": a shimmer-400 diamond, filled with a shimmer-50 one when selected, beside a Body 1 label
export function Radio({ label, style, ...rest }: RadioProps) {
  return (
    <label {...props(text.body1, styles.row, style)}>
      <BaseRadio.Root
        {...rest}
        className={(state) => {
          return props(defaultMarker(), styles.control, state.disabled && styles.controlDisabled).className
        }}
      >
        <BaseRadio.Indicator {...props(styles.mark)} />
      </BaseRadio.Root>

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
      height: 20,
      position: 'absolute',
      transform: 'rotate(45deg)',
      width: 20,
    },
    WebkitTapHighlightColor: 'transparent',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
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
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  mark: {
    backgroundColor: color.controlMark,
    height: 10,
    transform: 'rotate(45deg)',
    width: 10,
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
