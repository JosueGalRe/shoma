import { tv } from 'tailwind-variants'

export const optionCardStyles = tv({
  slots: {
    title: 'font-display text-primary',
    content: 'space-y-3',
    field: 'text-muted block space-y-1 text-sm',
    select: 'border-border bg-background text-foreground focus:border-primary focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus:shadow-[0_0_20px_var(--shoma-primary)] focus-visible:ring-2 focus-visible:outline-none',
    inline: 'flex items-center gap-2',
    icon: 'border-border bg-background size-8 rounded-md border object-cover',
    skinGrid: 'grid grid-cols-2 gap-2',
    skinButton: 'focus-visible:ring-ring overflow-hidden rounded-md border text-left focus-visible:ring-2 focus-visible:outline-none',
    skinImage: 'h-20 w-full object-cover',
    skinLabel: 'text-muted p-2 text-xs',
  },
  variants: {
    disabled: {
      true: {
        select: 'disabled:opacity-50',
      },
      false: {},
    },
    selected: {
      true: {
        skinButton: 'border-primary bg-secondary/60 shadow-[0_0_20px_var(--shoma-primary)]',
      },
      false: {
        skinButton: 'border-border bg-background',
      },
    },
  },
})
