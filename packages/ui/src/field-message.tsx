import { Field } from '@base-ui/react/field'
import { create, props } from '@stylexjs/stylex'
import { CircleAlert } from 'lucide-react'

import { color } from './tokens/color.stylex'
import { font } from './tokens/font.stylex'

// Helper text under a field (Figma "Helper Text"): the error replaces the description, in red with an icon
export function FieldMessage({ description, error }: { description?: string; error?: string }) {
  if (error) {
    return (
      <Field.Error match {...props(styles.message, styles.error)}>
        <CircleAlert size={16} {...props(styles.icon)} />

        {error}
      </Field.Error>
    )
  }

  if (description) {
    return <Field.Description {...props(styles.message)}>{description}</Field.Description>
  }

  return null
}

const styles = create({
  error: {
    color: color.danger,
  },
  icon: {
    flexShrink: 0,
    marginBlock: 1,
  },
  // Marcellus 12px, 5% tracking: used only here, so not one of the Figma text styles
  message: {
    alignItems: 'flex-start',
    color: color.textMuted,
    display: 'flex',
    fontFamily: font.display,
    fontSize: '0.75rem',
    gap: 4,
    letterSpacing: '0.05em',
    lineHeight: 1.5,
    margin: 0,
  },
})
