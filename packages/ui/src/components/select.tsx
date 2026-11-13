import { Field } from '@base-ui/react/field'
import { Select as BaseSelect } from '@base-ui/react/select'
import { create, props } from '@stylexjs/stylex'
import { ChevronDown } from 'lucide-react'

import { FieldMessage } from '../field-message'
import { text } from '../text'
import { color } from '../tokens/color.stylex'

import type { StyleXStyles } from '@stylexjs/stylex'

export interface SelectOption {
  label: string
  value: string
}

type SelectLabelProps = { 'aria-label'?: never; label: string } | { 'aria-label': string; label?: never }

export type SelectProps = SelectLabelProps & {
  description?: string
  disabled?: boolean
  error?: string
  name?: string
  onValueChange: (value: string) => void
  options: readonly SelectOption[]
  placeholder?: string
  style?: StyleXStyles
  value: string | null
}

// Figma "Dropdown": the Text Field box with a chevron, and a list of 48px items opening flush below it
export function Select({
  'aria-label': ariaLabel,
  description,
  disabled = false,
  error,
  label,
  name,
  onValueChange,
  options,
  placeholder,
  style,
  value,
}: SelectProps) {
  return (
    <Field.Root disabled={disabled} invalid={Boolean(error)} name={name} {...props(styles.root, style)}>
      {label ? <Field.Label {...props(text.marcellus13, styles.label)}>{label}</Field.Label> : null}

      <BaseSelect.Root
        disabled={disabled}
        items={options}
        value={value}
        onValueChange={(next) => {
          if (next !== null) {
            onValueChange(next)
          }
        }}
      >
        <BaseSelect.Trigger
          aria-label={ariaLabel}
          className={(state) => {
            return props(text.marcellus16, styles.trigger, state.open && styles.triggerOpen).className
          }}
        >
          <BaseSelect.Value
            placeholder={placeholder}
            className={(state) => {
              return props(styles.value, state.placeholder && styles.placeholder, disabled && styles.valueDisabled).className
            }}
          />

          <BaseSelect.Icon
            className={(state) => {
              return props(styles.icon, state.open && styles.iconOpen).className
            }}
          >
            <ChevronDown size={20} />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>

        <BaseSelect.Portal>
          <BaseSelect.Positioner alignItemWithTrigger={false} {...props(styles.positioner)}>
            <BaseSelect.Popup
              className={(state) => {
                return props(styles.popup, state.transitionStatus !== undefined && styles.popupHidden).className
              }}
            >
              {options.map((option) => {
                return (
                  <BaseSelect.Item
                    key={option.value}
                    value={option.value}
                    className={(state) => {
                      return props(
                        text.marcellus16,
                        styles.item,
                        state.selected && styles.itemSelected,
                        state.highlighted && styles.itemHighlighted,
                      ).className
                    }}
                  >
                    <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                  </BaseSelect.Item>
                )
              })}
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>

      <FieldMessage description={description} error={error} />
    </Field.Root>
  )
}

const styles = create({
  icon: {
    display: 'flex',
    flexShrink: 0,
    transitionDuration: { '@media (prefers-reduced-motion: reduce)': '0s', default: '150ms' },
    transitionProperty: 'transform',
    transitionTimingFunction: 'ease-out',
  },
  iconOpen: {
    transform: 'rotate(180deg)',
  },
  item: {
    WebkitTapHighlightColor: 'transparent',
    alignItems: 'center',
    backgroundColor: color.menu,
    color: color.text,
    cursor: 'pointer',
    display: 'flex',
    minHeight: 48,
    outlineStyle: 'none',
    paddingInline: 16,
    userSelect: 'none',
  },
  // Pointer or keyboard: the pressed wash over the item's own color, selected or not
  itemHighlighted: {
    backgroundImage: `linear-gradient(${color.pressed}, ${color.pressed})`,
  },
  itemSelected: {
    backgroundColor: color.selected,
  },
  label: {
    color: color.textLabel,
    textTransform: 'uppercase',
  },
  placeholder: {
    color: color.textMuted,
  },
  popup: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    boxSizing: 'border-box',
    maxHeight: 'var(--available-height)',
    opacity: 1,
    outlineStyle: 'none',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    transform: 'translateY(0)',
    transitionDuration: { '@media (prefers-reduced-motion: reduce)': '0s', default: '150ms' },
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'ease-out',
    width: 'var(--anchor-width)',
  },
  popupHidden: {
    opacity: 0,
    transform: { '@media (prefers-reduced-motion: reduce)': 'none', default: 'translateY(-4px)' },
  },
  positioner: {
    outlineStyle: 'none',
    zIndex: 45,
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  trigger: {
    WebkitTapHighlightColor: 'transparent',
    alignItems: 'center',
    backgroundColor: color.fieldBackground,
    borderColor: { ':focus-visible': color.focusRing, default: color.border },
    borderStyle: 'solid',
    borderWidth: 1,
    boxSizing: 'border-box',
    color: color.text,
    cursor: 'pointer',
    display: 'flex',
    gap: 8,
    height: 48,
    margin: 0,
    outlineStyle: 'none',
    paddingInline: 16,
    textAlign: 'start',
    transitionDuration: '150ms',
    transitionProperty: 'border-color',
    transitionTimingFunction: 'ease-out',
    width: '100%',
  },
  triggerOpen: {
    borderColor: color.focusRing,
  },
  value: {
    flexGrow: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  valueDisabled: {
    color: color.textDisabled,
  },
})
