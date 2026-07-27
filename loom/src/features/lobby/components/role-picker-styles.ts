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
export const roleSlotStripStyles = tv({
  slots: {
    strip:
      'absolute right-0 bottom-full z-20 mb-3 flex items-center gap-3 rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_25%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_90%,transparent)] px-4 py-2 shadow-lg backdrop-blur-md',
    stripButton:
      'focus-visible:ring-ring flex size-8 items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:outline-none',
  },
})
