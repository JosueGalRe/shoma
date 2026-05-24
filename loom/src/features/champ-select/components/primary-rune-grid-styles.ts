import { tv } from 'tailwind-variants'

export const primaryRuneGridStyles = tv({
  slots: {
    container: 'space-y-4 rounded-lg border border-border bg-secondary/60 p-4',
    row: 'flex justify-center gap-x-4',
    runeItem:
      'focus-visible:ring-ring relative rounded-full transition-all focus-visible:ring-2 focus-visible:outline-none',
    runeIcon: 'h-full w-full',
  },
  variants: {
    size: {
      primary: {
        runeItem: 'h-16 w-16',
      },
      secondary: {
        runeItem: 'h-12 w-12',
      },
    },
    selected: {
      true: {
        runeItem: 'ring-ring scale-110 shadow-[0_0_20px_var(--shoma-primary)] ring-2',
      },
      false: {
        runeItem: 'hover:ring-ring/60 opacity-50 hover:opacity-100 hover:ring-1',
      },
    },
  },
  defaultVariants: {
    size: 'secondary',
    selected: false,
  },
})
