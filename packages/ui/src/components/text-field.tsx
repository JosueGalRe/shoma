import { useRef } from 'react'

import { Field } from '@base-ui/react/field'
import { create, props } from '@stylexjs/stylex'
import { X } from 'lucide-react'

import { FieldMessage } from '../field-message'
import { text } from '../text'
import { color } from '../tokens/color.stylex'

import { IconButton } from './icon-button'

import type { StyleXStyles } from '@stylexjs/stylex'

// A visible label, or an aria-label when the screen shows none (search fields)
type TextFieldLabelProps = { 'aria-label'?: never; label: string } | { 'aria-label': string; label?: never }

export type TextFieldProps = Omit<Field.Control.Props, 'aria-label' | 'className' | 'onValueChange' | 'style' | 'value'> &
  TextFieldLabelProps & {
    // Shows the clear button while there is text; it needs its own accessible name
    clearLabel?: string
    description?: string
    error?: string
    onValueChange: (value: string) => void
    style?: StyleXStyles
    value: string
  }

// Figma "Text Field" (UI KIT): label, 48px box, helper or error text. Errors only recolor the helper text, as in Figma.
export function TextField({
  clearLabel,
  description,
  disabled = false,
  error,
  label,
  onValueChange,
  style,
  value,
  ...rest
}: TextFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Field.Root disabled={disabled} invalid={Boolean(error)} {...props(styles.root, style)}>
      {label ? <Field.Label {...props(text.marcellus13, styles.label)}>{label}</Field.Label> : null}

      <div {...props(styles.box)}>
        <Field.Control
          {...rest}
          ref={inputRef}
          value={value}
          onValueChange={onValueChange}
          {...props(text.marcellus16, styles.input, disabled && styles.inputDisabled)}
        />

        {clearLabel && value !== '' && !disabled ? (
          <IconButton
            aria-label={clearLabel}
            size="small"
            style={styles.clear}
            onClick={() => {
              onValueChange('')
              inputRef.current?.focus()
            }}
          >
            <X />
          </IconButton>
        ) : null}
      </div>

      <FieldMessage description={description} error={error} />
    </Field.Root>
  )
}

const styles = create({
  box: {
    alignItems: 'center',
    backgroundColor: color.fieldBackground,
    borderColor: { ':focus-within': color.focusRing, default: color.border },
    borderStyle: 'solid',
    borderWidth: 1,
    boxSizing: 'border-box',
    display: 'flex',
    gap: 8,
    height: 48,
    paddingInline: 16,
    transitionDuration: '150ms',
    transitionProperty: 'border-color',
    transitionTimingFunction: 'ease-out',
  },
  // Puts the 24px icon 16px from the edge, like the Figma close icon
  clear: {
    color: color.text,
    marginInlineEnd: -4,
  },
  input: {
    '::placeholder': { color: color.textMuted, opacity: 1 },
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: color.text,
    flexGrow: 1,
    height: '100%',
    margin: 0,
    minWidth: 0,
    outlineStyle: 'none',
    padding: 0,
  },
  inputDisabled: {
    color: color.textDisabled,
    cursor: 'default',
  },
  label: {
    color: color.textLabel,
    textTransform: 'uppercase',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
})
