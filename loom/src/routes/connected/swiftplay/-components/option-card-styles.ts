import { tv } from 'tailwind-variants'

export const optionCardStyles = tv({
  slots: {
    content: 'space-y-3',
    field: 'text-muted block space-y-1 text-sm',
    icon: 'border-border bg-background size-8 rounded-md border object-cover',
    inline: 'flex items-center gap-2',
    select:
      'border-border bg-background text-foreground focus:border-primary focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus:shadow-[0_0_20px_var(--shoma-primary)] focus-visible:ring-2 focus-visible:outline-none',
    skinButton:
      'focus-visible:ring-ring overflow-hidden rounded-md border text-left focus-visible:ring-2 focus-visible:outline-none',
    skinGrid: 'grid grid-cols-2 gap-2',
    skinImage: 'h-20 w-full object-cover',
    skinLabel: 'text-muted p-2 text-xs',
    title: 'font-display text-primary',
  },
  variants: {
    disabled: {
      false: {},
      true: {
        select: 'disabled:opacity-50',
      },
    },
    selected: {
      false: {
        skinButton: 'border-border bg-background',
      },
      true: {
        skinButton: 'border-primary bg-secondary/60 shadow-[0_0_20px_var(--shoma-primary)]',
      },
    },
  },
})
