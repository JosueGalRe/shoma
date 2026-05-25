import { tv } from 'tailwind-variants'

export const secondaryRuneGridStyles = tv({
  defaultVariants: {
    selected: false,
  },
  slots: {
    container: 'space-y-4 rounded-lg border border-border bg-secondary/60 p-4',
    row: 'flex justify-center gap-x-4',
    runeIcon: 'h-full w-full',
    runeItem: 'focus-visible:ring-ring h-12 w-12 rounded-full transition-all focus-visible:ring-2 focus-visible:outline-none',
  },
  variants: {
    selected: {
      false: {
        runeItem: 'hover:ring-ring/60 opacity-50 hover:opacity-100 hover:ring-1',
      },
      true: {
        runeItem: 'ring-ring scale-110 shadow-[0_0_20px_var(--shoma-primary)] ring-2',
      },
    },
  },
})
