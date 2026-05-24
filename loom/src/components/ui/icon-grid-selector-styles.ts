import { tv } from 'tailwind-variants'

export const iconGridSelectorStyles = tv({
  slots: {
    root: 'grid gap-3',
    item: 'focus-visible:ring-ring flex min-h-[44px] min-w-[44px] flex-col items-center gap-2 rounded-xl border p-3 transition-all focus-visible:ring-2 focus-visible:outline-none',
    icon: 'size-10 rounded-full object-cover',
    label: 'text-center text-xs leading-tight font-medium',
  },
  variants: {
    selected: {
      true: {
        item: 'border-primary bg-secondary/50 scale-105 shadow-[0_0_20px_var(--shoma-primary)]',
        label: 'text-primary',
      },
      false: {
        item: 'border-border hover:border-primary/50 hover:bg-secondary/50',
        label: 'text-muted',
      },
    },
    disabled: {
      true: {
        item: 'cursor-not-allowed opacity-50',
      },
      false: {
        item: 'cursor-pointer',
      },
    },
  },
  defaultVariants: {
    selected: false,
    disabled: false,
  },
})
