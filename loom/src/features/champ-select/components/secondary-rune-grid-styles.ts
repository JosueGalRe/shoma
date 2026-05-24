import { tv } from 'tailwind-variants'

export const secondaryRuneGridStyles = tv({
  slots: {
    container: 'space-y-4 rounded-lg border border-border bg-secondary/60 p-4',
    row: 'flex justify-center gap-x-4',
    runeItem:
      'focus-visible:ring-ring h-12 w-12 rounded-full transition-all focus-visible:ring-2 focus-visible:outline-none',
    runeIcon: 'h-full w-full',
  },
  variants: {
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
    selected: false,
  },
})
