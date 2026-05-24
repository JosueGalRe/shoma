import { tv } from 'tailwind-variants'

export const runePageControlsStyles = tv({
  slots: {
    root: 'flex gap-x-2',
    pages: 'flex gap-2 overflow-x-auto',
    tab: 'focus-visible:ring-ring h-11 shrink-0 rounded-md border px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none',
  },
  variants: {
    active: {
      true: {
        tab: 'border-primary bg-secondary/60 text-primary',
      },
      false: {
        tab: 'border-border text-muted hover:text-foreground',
      },
    },
  },
  defaultVariants: {
    active: false,
  },
})
