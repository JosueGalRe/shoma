import { tv } from 'tailwind-variants'

export const rolePickerContainerStyles = tv({
  base: 'flex flex-row gap-2',
  variants: {
    disabled: {
      true: 'pointer-events-none opacity-50',
    },
  },
})

export const rolePickerButtonStyles = tv({
  base: 'focus-visible:ring-ring flex h-11 w-11 items-center justify-center rounded-full border-2 focus-visible:ring-2 focus-visible:outline-none',
  variants: {
    selected: {
      true: 'border-primary bg-secondary/60 shadow-[0_0_20px_var(--shoma-primary)]',
      false: 'border-border bg-background',
    },
  },
})

export const rolePickerIconStyles = tv({
  base: 'size-6 object-contain',
})
