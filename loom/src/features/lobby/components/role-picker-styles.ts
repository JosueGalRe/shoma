import { tv } from 'tailwind-variants'

export const rolePickerContainerStyles = tv({
  base: 'flex flex-row justify-center gap-2',
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
      false: 'border-border bg-background',
      true: 'border-primary bg-secondary/60 shadow-[0_0_20px_var(--shoma-primary)]',
    },
  },
})

export const rolePickerIconStyles = tv({
  base: 'size-6 object-contain object-center',
  variants: {
    selected: {
      false: 'opacity-50 grayscale',
      true: '[filter:grayscale(1)_sepia(1)_saturate(4)_hue-rotate(2deg)_brightness(1.05)]',
    },
  },
})
