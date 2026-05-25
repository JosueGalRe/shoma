import { tv } from 'tailwind-variants'

export const statShardGridStyles = tv({
  defaultVariants: {
    selected: false,
  },
  slots: {
    root: 'border-border bg-secondary/60 space-y-2 rounded-lg border p-4',
    row: 'flex justify-center gap-x-4',
    shardButton:
      'focus-visible:ring-ring h-10 w-10 rounded-full transition-all focus-visible:ring-2 focus-visible:outline-none',
    shardIcon: 'h-full w-full',
  },
  variants: {
    selected: {
      false: {
        shardButton: 'hover:ring-ring/60 opacity-50 hover:opacity-100 hover:ring-1',
      },
      true: {
        shardButton: 'ring-ring scale-110 shadow-[0_0_20px_var(--shoma-primary)] ring-2',
      },
    },
  },
})
