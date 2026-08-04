import { tv } from 'tailwind-variants'

export const banSlotStyles = tv({
  slots: {
    image: 'size-full object-cover opacity-80 saturate-50',
    noBanIcon: 'text-muted size-4',
    root: 'border-border-gold/40 bg-secondary/60 flex size-9 items-center justify-center overflow-hidden rounded-md border',
  },
  variants: {
    pending: {
      true: {
        root: 'animate-pulse border-dashed',
      },
    },
  },
})
