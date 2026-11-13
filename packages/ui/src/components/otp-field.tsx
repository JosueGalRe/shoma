import { Field } from '@base-ui/react/field'
import { OTPField } from '@base-ui/react/otp-field'
import { create, props } from '@stylexjs/stylex'

import { FieldMessage } from '../field-message'
import { text } from '../text'
import { color } from '../tokens/color.stylex'

import type { StyleXStyles } from '@stylexjs/stylex'

// Base UI names every slot from a <label>, so a screen without a visible field label points at its own text instead
type OtpFieldLabelProps = { 'aria-labelledby'?: never; label: string } | { 'aria-labelledby': string; label?: never }

export type OtpFieldProps = Omit<OTPField.Root.Props, 'aria-labelledby' | 'children' | 'className' | 'style'> &
  OtpFieldLabelProps & {
    description?: string
    error?: string
    style?: StyleXStyles
  }

// Figma "Segmented Input": one 48x64 box per character, 8px apart, with the Text Field's helper and error text
export function OtpField({ description, disabled = false, error, label, length, style, ...rest }: OtpFieldProps) {
  return (
    <Field.Root disabled={disabled} invalid={Boolean(error)} {...props(styles.root, style)}>
      {label ? <Field.Label {...props(text.marcellus13, styles.label)}>{label}</Field.Label> : null}

      <OTPField.Root {...rest} disabled={disabled} length={length} {...props(styles.slots)}>
        {Array.from({ length }, (_, index) => {
          return (
            <OTPField.Input
              // Slots are positional, so the index is their identity
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              placeholder="0"
              {...props(text.marcellus28, styles.slot, disabled && styles.slotDisabled)}
            />
          )
        })}
      </OTPField.Root>

      <FieldMessage description={description} error={error} />
    </Field.Root>
  )
}

const styles = create({
  label: {
    color: color.textLabel,
    textTransform: 'uppercase',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  slot: {
    '::placeholder': { color: color.textMuted, opacity: 1 },
    backgroundColor: color.fieldBackground,
    borderColor: { ':focus': color.focusRing, default: color.border },
    borderStyle: 'solid',
    borderWidth: 1,
    boxSizing: 'border-box',
    color: color.text,
    height: 64,
    margin: 0,
    outlineStyle: 'none',
    padding: 0,
    textAlign: 'center',
    transitionDuration: '150ms',
    transitionProperty: 'border-color',
    transitionTimingFunction: 'ease-out',
    width: 48,
  },
  slotDisabled: {
    color: color.textDisabled,
  },
  slots: {
    display: 'flex',
    gap: 8,
  },
})
